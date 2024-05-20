import chalk from 'chalk'
import { $ } from 'bun'
import * as R from 'ramda'
import * as p from '@clack/prompts'
import YAML from 'yaml'
import {
  execShell,
  endStopwatch,
  genDockerCompose,
  createDockerComposeFile,
  startStopwatch,
  createOrUpdateEnvFile,
} from '@cli/utils'
import { getIcebergConfig, getMinioConfig, getSupersetConfig, getTrinoConfig } from '@cli/toolConfigs'
import {
  SHARED_NETWORK_NAME,
  MINIO_VOLUME,
  ICEBERG_PG_CATALOG_VOLUME,
  AWS_REGION_ENVNAME,
  AWS_ACCESS_KEY_ID_ENVNAME,
  AWS_SECRET_ACCESS_KEY_ENVNAME,
  LAKEHOUSE_NAME_ENVNAME,
  S3_ENDPOINT_ENVNAME,
  ICEBERG_PG_CATALOG_USER_ENVNAME,
  ICEBERG_PG_CATALOG_PASSWORD_ENVNAME,
  ICEBERG_PG_CATALOG_DB_ENVNAME,
  PROJECT_DIRNAME_ENVNAME,
  TRINO_USER_ENVNAME,
  ICEBERG_CATALOG_NAME_ENVNAME,
  S3_ENDPOINT,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  LAKEHOUSE_NAME,
  ICEBERG_CATALOG_NAME,
  DAGSTER_HOME_ENVNAME,
  MINIO_SERVER_HOST_PORT,
  ICEBERG_REST_HOST_PORT,
  RAW_ICEBERG_TABLE_NAME,
  DAGSTER_HOST_PORT,
  TRINO_HOST_PORT,
  SUPERSET_HOST_PORT,
  ICEBERG_PG_HOST_PORT,
} from '@cli/constants'
import gitignore from '@cli/templates/gitignore'
import { initTool } from '../../utils'
import ordersCsv from '@cli/templates/dagsterIcebergTrinoStack/example/data/orders.csv'
import customersCsv from '@cli/templates/dagsterIcebergTrinoStack/example/data/customers.csv'
import productsCsv from '@cli/templates/dagsterIcebergTrinoStack/example/data/products.csv'
import storesCsv from '@cli/templates/dagsterIcebergTrinoStack/example/data/stores.csv'
import exampleCsvFilesDefJson from '@cli/templates/dagsterIcebergTrinoStack/example/meltano/example_csv_files_def.json'
import exampleDagsterInitPy from '@cli/templates/dagsterIcebergTrinoStack/example/dagster/__init__.py'
import stgIcebergOrdersSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/stg_iceberg__orders.sql'
import stgIcebergCustomersSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/stg_iceberg__customers.sql'
import stgIcebergProductsSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/stg_iceberg__products.sql'
import stgIcebergStoresSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/stg_iceberg__stores.sql'
import intIcebergDenormalizedOrdersSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/int_iceberg__denormalized_orders.sql'
import martsGeneralSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/marts_iceberg__general.sql'
import martsMarketingSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/marts_iceberg__marketing.sql'
import martsPaymentSql from '@cli/templates/dagsterIcebergTrinoStack/example/dbt/marts_iceberg__payment.sql'
import type { SidetrekConfig } from '@cli/types'

const s = p.spinner()

// TODO: Make meltano, dbt, superset optional (the rest is not optional)
export const buildDagsterIcebergTrinoStack = async (cliInputs: any): Promise<void> => {
  const projectName: string = cliInputs.projectName
  const pythonVersion: string = cliInputs.pythonVersion
  const shouldAddExample: boolean = cliInputs.example

  const startTime = startStopwatch()

  /**
   *
   * Helper functions
   *
   */
  const exitOnError = async (errorMessage: string): Promise<void> => {
    await cleanupOnFailure()
    p.cancel(errorMessage)
    return process.exit(0)
  }

  const cleanupOnFailure = async (): Promise<void> => {
    await $`rm -rf ${projectName}`.quiet()
  }

  /**
   *
   * Scaffold the project
   *
   */
  // `poetry new` -> remove tests -> create sidetrek dir -> add sidetrek.config.yaml to project root
  s.start('Scaffolding your project')
  const poetryNewStartTime = startStopwatch()
  const poetryNewResp = await execShell(
    `poetry new ${projectName} && rm -rf ./${projectName}/tests && mkdir -p ./${projectName}/.sidetrek`
  )

  const sidetrekConfigYaml: SidetrekConfig = {
    services: {
      dagster: {
        title: 'Dagster',
        port: DAGSTER_HOST_PORT,
      },
      meltano: {
        title: 'Meltano',
      },
      dbt: {
        title: 'DBT',
      },
      minio: {
        title: 'Minio',
        port: MINIO_SERVER_HOST_PORT,
      },
      'iceberg-rest': {
        title: 'Iceberg REST Catalog',
        port: ICEBERG_REST_HOST_PORT,
      },
      'iceberg-pg-catalog': {
        title: 'Iceberg Postgres Catalog',
        port: ICEBERG_PG_HOST_PORT,
      },
      trino: {
        title: 'Trino',
        port: TRINO_HOST_PORT,
      },
      superset: {
        title: 'Superset',
        port: SUPERSET_HOST_PORT,
      },
    },
  }
  await Bun.write(`./${projectName}/sidetrek.config.yaml`, YAML.stringify(sidetrekConfigYaml))

  if (poetryNewResp?.error) {
    const errorMessage = `Sorry, something went wrong while scaffolding the project via Poetry.\n\n${poetryNewResp.error?.stderr}`
    exitOnError(errorMessage)
  }

  // Must update the pyproject.toml file to set the correct python version
  const pyprojectTomlStr = await $`cat ./${projectName}/pyproject.toml`.text()
  const updatedPyprojectTomlStr = R.compose(
    R.join('\n'),
    R.append(`\n\n[tool.dagster]\nmodule_name = "${projectName}.dagster.${projectName}.${projectName}"\n`),
    R.map((line) => (line.includes('python = "') ? `python = "~${pythonVersion}.0"` : line)), // set the python version
    R.split('\n')
  )(pyprojectTomlStr)
  await Bun.write(`./${projectName}/pyproject.toml`, updatedPyprojectTomlStr) // overwrites

  const poetryNewDuration = endStopwatch(poetryNewStartTime)
  s.stop('Project successfully scaffolded.' + chalk.gray(` [${poetryNewDuration}ms]`))

  /**
   *
   * Initialize each tool in the data stack in parallel
   *
   */

  // Set up Dagster
  s.start('Setting up Dagster (this may take a couple minutes)')
  const dagsterInitStartTime = startStopwatch()
  const dagsterInitResp = await initTool(projectName, 'dagster')

  if (dagsterInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Dagster.\n\n${dagsterInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dagsterInitDuration = endStopwatch(dagsterInitStartTime)
    s.stop('Dagster set up successfully.' + chalk.gray(` [${dagsterInitDuration}ms]`))
  }

  // Set up DBT
  s.start('Setting up DBT (this may take a couple minutes)')
  const dbtInitStartTime = startStopwatch()
  const dbtInitResp = await initTool(projectName, 'dbt')

  if (dbtInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing DBT.\n\n${dbtInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dbtInitDuration = endStopwatch(dbtInitStartTime)
    s.stop('DBT set up successfully.' + chalk.gray(` [${dbtInitDuration}ms]`))
  }

  // Set up Meltano
  // IMPORTANT: Meltano must be set up BEFORE DBT for now due to snowplow tracker bug
  s.start('Setting up Meltano (this may take a couple minutes)')
  const meltanoInitStartTime = startStopwatch()
  const meltanoInitResp = await initTool(projectName, 'meltano')

  if (meltanoInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Meltano.\n\n${meltanoInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const meltanoInitDuration = endStopwatch(meltanoInitStartTime)
    s.stop('Meltano set up successfully.' + chalk.gray(` [${meltanoInitDuration}ms]`))
  }

  // Set up Trino
  s.start('Setting up Trino (this may take a couple minutes)')
  const trinoInitStartTime = startStopwatch()
  const trinoInitResp = await initTool(projectName, 'trino')

  if (trinoInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Trino.\n\n${trinoInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const trinoInitDuration = endStopwatch(trinoInitStartTime)
    s.stop('Trino set up successfully.' + chalk.gray(` [${trinoInitDuration}ms]`))
  }

  // Set up Superset
  s.start('Setting up Superset (this may take a couple minutes)')
  const supersetInitStartTime = startStopwatch()
  const supersetInitResp = await initTool(projectName, 'superset')

  if (supersetInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Superset.\n\n${supersetInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const supersetInitDuration = endStopwatch(supersetInitStartTime)
    s.stop('Superset set up successfully.' + chalk.gray(` [${supersetInitDuration}ms]`))
  }

  /**
   *
   * Combine the tool docker-compose.yaml files
   *
   *    WHY???
   *    - Tools are initialized in parallel and this can cause issues if it's written to one file concurrently
   *
   */
  s.start('Generating docker compose file')
  const dcStartTime = startStopwatch()
  const toolConfigs: any[] = [
    getMinioConfig(projectName),
    getIcebergConfig(projectName),
    getTrinoConfig(projectName),
    getSupersetConfig(projectName),
  ]
  const dcNetworks = { [SHARED_NETWORK_NAME]: { driver: 'bridge' } }
  const dcVolumes = {
    ...MINIO_VOLUME,
    ...ICEBERG_PG_CATALOG_VOLUME,
  }
  const dockerComposeObj = genDockerCompose({
    projectName,
    toolDockerComposeObjs: R.pluck('dockerComposeObj', toolConfigs),
    networks: dcNetworks,
    volumes: dcVolumes,
  })

  const dcResp = await createDockerComposeFile(dockerComposeObj, `./${projectName}/docker-compose.yaml`)

  if (dcResp?.error) {
    const errorMessage = `Sorry, something went wrong while generating docker-compose.yaml file.\n\n${dcResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dcDuration = endStopwatch(dcStartTime)
    s.stop('Docker compose file generated successfully.' + chalk.gray(` [${dcDuration}ms]`))
  }

  /**
   *
   * Create environment variables and root .gitignore
   *
   */
  s.start('Setting up other project level configurations')
  const envsStartTime = startStopwatch()

  // Create root .env file
  const rootEnvFileObj = {
    [PROJECT_DIRNAME_ENVNAME]: projectName,
    [DAGSTER_HOME_ENVNAME]: `${process.cwd()}/${projectName}/${projectName}/dagster/${projectName}`,
    [AWS_REGION_ENVNAME]: AWS_REGION,
    [AWS_ACCESS_KEY_ID_ENVNAME]: AWS_ACCESS_KEY_ID,
    [AWS_SECRET_ACCESS_KEY_ENVNAME]: AWS_SECRET_ACCESS_KEY,
    [LAKEHOUSE_NAME_ENVNAME]: LAKEHOUSE_NAME,
    [S3_ENDPOINT_ENVNAME]: S3_ENDPOINT,
    [ICEBERG_CATALOG_NAME_ENVNAME]: ICEBERG_CATALOG_NAME,
    [ICEBERG_PG_CATALOG_USER_ENVNAME]: `iceberg`,
    [ICEBERG_PG_CATALOG_PASSWORD_ENVNAME]: `iceberg`,
    [ICEBERG_PG_CATALOG_DB_ENVNAME]: `iceberg`,
  }
  await createOrUpdateEnvFile(`./${projectName}/.env`, rootEnvFileObj)

  await Bun.write(`./${projectName}/.gitignore`, gitignore)

  // Create dagster .env file
  const dagsterEnvFileObj = {
    [PROJECT_DIRNAME_ENVNAME]: `${projectName}`,
    [TRINO_USER_ENVNAME]: `admin`,
  }
  await createOrUpdateEnvFile(`./${projectName}/${projectName}/dagster/${projectName}/.env`, dagsterEnvFileObj)

  // Create meltano .env file
  const meltanoEnvFileObj = {
    [AWS_ACCESS_KEY_ID_ENVNAME]: `${AWS_ACCESS_KEY_ID}`,
    [AWS_SECRET_ACCESS_KEY_ENVNAME]: `${AWS_SECRET_ACCESS_KEY}`,
  }
  await createOrUpdateEnvFile(`./${projectName}/${projectName}/meltano/.env`, meltanoEnvFileObj)

  const envsDuration = endStopwatch(envsStartTime)
  s.stop('Successfully set up other project level configurations.' + chalk.gray(` [${envsDuration}ms]`))

  /**
   *
   * Connect the tools
   *
   */

  // dagster-meltano
  s.start('Adding Dagster/Meltano connection')
  const dagsterMeltanoStartTime = startStopwatch()
  const dagsterMeltanoResp = await initTool(projectName, 'dagster-meltano')

  if (dagsterMeltanoResp?.error) {
    const errorMessage = `Sorry, something went wrong while adding Dagster/Meltano connection.\n\n${dagsterMeltanoResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dagsterMeltanoDuration = endStopwatch(dagsterMeltanoStartTime)
    s.stop('Dagster/Meltano connection added successfully.' + chalk.gray(` [${dagsterMeltanoDuration}ms]`))
  }

  // dagster-dbt
  s.start('Adding Dagster/DBT connection')
  const dagsterDbtStartTime = startStopwatch()
  const dagsterDbtResp = await initTool(projectName, 'dagster-dbt')

  if (dagsterDbtResp?.error) {
    const errorMessage = `Sorry, something went wrong while adding Dagster/DBT connection.\n\n${dagsterDbtResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dagsterDbtDuration = endStopwatch(dagsterDbtStartTime)
    s.stop('Dagster/DBT connection added successfully.' + chalk.gray(` [${dagsterDbtDuration}ms]`))
  }

  /**
   *
   * Add example code
   *
   */
  if (shouldAddExample) {
    // ----- Add meltano example code -----

    // Copy example csv files
    s.start('Copying example data')
    const exampleDataCopyStartTime = startStopwatch()
    try {
      await Bun.write(`./${projectName}/${projectName}/meltano/extract/orders.csv`, await Bun.file(ordersCsv).text())
      await Bun.write(`./${projectName}/${projectName}/meltano/extract/customers.csv`, await Bun.file(customersCsv).text())
      await Bun.write(`./${projectName}/${projectName}/meltano/extract/products.csv`, await Bun.file(productsCsv).text())
      await Bun.write(`./${projectName}/${projectName}/meltano/extract/stores.csv`, await Bun.file(storesCsv).text())

      // Create example_csv_files_def.json inside /meltano/extract
      await Bun.write(
        `./${projectName}/${projectName}/meltano/extract/example_csv_files_def.json`,
        JSON.stringify(exampleCsvFilesDefJson)
      )

      // Add the `csv_files_definition` config and the custom loader target-iceberg in meltano.yml
      const meltanoYamlJson = YAML.parse(await $`cat ./${projectName}/${projectName}/meltano/meltano.yml`.text())
      const newMeltanoYaml = YAML.stringify({
        ...meltanoYamlJson,
        plugins: {
          extractors: [
            {
              name: 'tap-csv',
              variant: 'meltanolabs',
              pip_url: 'git+https://github.com/MeltanoLabs/tap-csv.git',
              config: {
                csv_files_definition: 'extract/example_csv_files_def.json',
              },
            },
          ],
          loaders: [
            {
              name: 'target-iceberg',
              namespace: 'target_iceberg',
              pip_url: 'git+https://github.com/SidetrekAI/target-iceberg',
              executable: 'target-iceberg',
              config: {
                add_record_metadata: true,
                aws_access_key_id: `$${AWS_ACCESS_KEY_ID_ENVNAME}`,
                aws_secret_access_key: `$${AWS_SECRET_ACCESS_KEY_ENVNAME}`,
                s3_endpoint: `http://localhost:${MINIO_SERVER_HOST_PORT}`,
                s3_bucket: LAKEHOUSE_NAME,
                iceberg_rest_uri: `http://localhost:${ICEBERG_REST_HOST_PORT}`,
                iceberg_catalog_name: ICEBERG_CATALOG_NAME,
                iceberg_catalog_namespace_name: RAW_ICEBERG_TABLE_NAME,
              },
            },
          ],
        },
      })
      await Bun.write(`./${projectName}/${projectName}/meltano/meltano.yml`, newMeltanoYaml)

      const exampleDataCopyDuration = endStopwatch(exampleDataCopyStartTime)
      s.stop('Copied example data successfully' + chalk.gray(` [${exampleDataCopyDuration}ms]`))
    } catch (err) {
      const errorMessage = `Sorry, something went wrong while copying example data.\n\n${err}`
      exitOnError(errorMessage)
    }

    // Install the meltano extractor/loader
    s.start('Installing Meltano tap-csv extractor and target-iceberg loader')
    const meltanoInstallStartTime = startStopwatch()
    const meltanoInstallResp = await execShell(`poetry run meltano lock --update --all && poetry run meltano install`, {
      cwd: `./${projectName}/${projectName}/meltano`,
    })

    if (meltanoInstallResp?.error) {
      const errorMessage = `Sorry, something went wrong while installing meltano tap-csv extractor and target-iceberg loader.\n\n${meltanoInstallResp.error?.stderr}`
      exitOnError(errorMessage)
    } else {
      const meltanoInstallDuration = endStopwatch(meltanoInstallStartTime)
      s.stop(
        'Meltano tap-csv extractor and target-iceberg loader successfully installed' +
          chalk.gray(` [${meltanoInstallDuration}ms]`)
      )
    }

    // ----- Add dbt example code -----

    const dbtProjectDirpath = `./${projectName}/${projectName}/dbt/${projectName}`

    // Add staging models
    const stgIcebergYaml = YAML.stringify({
      version: 2,
      sources: [
        {
          name: 'stg_iceberg',
          database: 'iceberg',
          schema: 'raw',
          tables: [{ name: 'orders' }, { name: 'customers' }, { name: 'products' }, { name: 'stores' }],
        },
      ],
      models: [
        { name: 'stg_iceberg__orders' },
        { name: 'stg_iceberg__customers' },
        { name: 'stg_iceberg__products' },
        { name: 'stg_iceberg__stores' },
      ],
    })
    await Bun.write(`${dbtProjectDirpath}/models/staging/stg_iceberg.yml`, stgIcebergYaml)

    await Bun.write(`${dbtProjectDirpath}/models/staging/stg_iceberg__orders.sql`, stgIcebergOrdersSql)
    await Bun.write(`${dbtProjectDirpath}/models/staging/stg_iceberg__customers.sql`, stgIcebergCustomersSql)
    await Bun.write(`${dbtProjectDirpath}/models/staging/stg_iceberg__products.sql`, stgIcebergProductsSql)
    await Bun.write(`${dbtProjectDirpath}/models/staging/stg_iceberg__stores.sql`, stgIcebergStoresSql)

    // Add intermediate models
    const intIcebergYaml = YAML.stringify({
      version: 2,
      sources: [
        {
          name: 'int_iceberg',
          database: 'iceberg',
          schema: 'project_staging',
          tables: [
            { name: 'stg_iceberg__orders' },
            { name: 'stg_iceberg__customers' },
            { name: 'stg_iceberg__products' },
            { name: 'stg_iceberg__stores' },
          ],
        },
      ],
      models: [{ name: 'int_iceberg__denormalized_orders' }],
    })
    await Bun.write(`${dbtProjectDirpath}/models/intermediate/int_iceberg.yml`, intIcebergYaml)

    await Bun.write(
      `${dbtProjectDirpath}/models/intermediate/int_iceberg__denormalized_orders.sql`,
      intIcebergDenormalizedOrdersSql
    )

    // Add marts models
    const martsIcebergYaml = YAML.stringify({
      version: 2,
      sources: [
        {
          name: 'marts_iceberg',
          database: 'iceberg',
          schema: 'project_intermediate',
          tables: [{ name: 'int_iceberg__denormalized_orders' }],
        },
      ],
      models: [
        { name: 'marts_iceberg__general' },
        { name: 'marts_iceberg__marketing' },
        { name: 'marts_iceberg__payment' },
      ],
    })
    await Bun.write(`${dbtProjectDirpath}/models/marts/marts_iceberg.yml`, martsIcebergYaml)

    await Bun.write(`${dbtProjectDirpath}/models/marts/marts_iceberg__general.sql`, martsGeneralSql)
    await Bun.write(`${dbtProjectDirpath}/models/marts/marts_iceberg__marketing.sql`, martsMarketingSql)
    await Bun.write(`${dbtProjectDirpath}/models/marts/marts_iceberg__payments.sql`, martsPaymentSql)

    // Add models to dbt_project.yml
    const dbtProjectYamlJson = YAML.parse(
      await $`cat ./${projectName}/${projectName}/dbt/${projectName}/dbt_project.yml`.text()
    )
    const newDbtProjectYaml = YAML.stringify({
      ...dbtProjectYamlJson,
      models: {
        ...dbtProjectYamlJson.models,
        [projectName]: {
          staging: {
            '+materialized': 'view',
            '+schema': 'staging',
            '+views_enabled': false,
          },
          intermediate: {
            '+materialized': 'view',
            '+schema': 'intermediate',
            '+views_enabled': false,
          },
          marts: {
            '+materialized': 'view',
            '+schema': 'marts',
            '+views_enabled': false,
          },
        },
      },
    })
    await Bun.write(`${dbtProjectDirpath}/dbt_project.yml`, newDbtProjectYaml)

    // ----- Add dagster example code -----

    // Replace dagster __init__.py to include meltano job and dbt assets/resources
    await Bun.write(
      `./${projectName}/${projectName}/dagster/${projectName}/${projectName}/__init__.py`,
      exampleDagsterInitPy
    )
  }

  /**
   *
   * Wrap up
   *
   */
  s.start('Calculating total duration')
  const totalDuration = endStopwatch(startTime)
  s.stop(chalk.gray(`Total duration: ${totalDuration}ms`))
}
