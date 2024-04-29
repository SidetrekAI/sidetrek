import chalk from 'chalk'
import { $ } from 'bun'
import * as R from 'ramda'
import * as p from '@clack/prompts'
import {
  clackLog,
  execShell,
  endStopwatch,
  genDockerCompose,
  createDockerComposeFile,
  startStopwatch,
} from '../../utils'
import {
  getDagsterConfig,
  getDbtConfig,
  getIcebergConfig,
  getMeltanoConfig,
  getMinioConfig,
  getSupersetConfig,
  getTrinoConfig,
} from '../../toolConfigs'
import type { ToolInitResponse } from '../../types'
import {
  SHARED_NETWORK_NAME,
  MINIO_VOLUME,
  ICEBERG_PG_CATALOG_VOLUME,
  SUPERSET_HOME_VOLUME,
  SUPERSET_DB_HOME_VOLUME,
  SUPERSET_CACHE_VOLUME,
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
  MINIO_SERVER_HOST_PORT,
} from '../../constants'

const s = p.spinner()

// TODO: Make meltano, dbt, superset optional (the rest is not optional)
export const buildDagsterIcebergTrinoStack = async (cliInputs: any): Promise<void> => {
  const { projectName, pythonVersion } = cliInputs

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
  // `poetry new` -> remove tests -> create sidetrek dir
  s.start('Scaffolding your project')
  const poetryNewStartTime = startStopwatch()
  const poetryNewResp = await execShell(
    `poetry new ${projectName} && rm -rf ./${projectName}/tests && mkdir -p ./${projectName}/sidetrek`
  )

  if (poetryNewResp?.error) {
    const errorMessage = `Sorry, something went wrong while scaffolding the project via Poetry.\n\n${poetryNewResp.error?.stderr}`
    exitOnError(errorMessage)
  }

  // Must update the pyproject.toml file to set the correct python version
  const pyprojectTomlStr = await $`cat ./${projectName}/pyproject.toml`.text()
  const updatedPyprojectTomlStr = R.compose(
    R.join('\n'),
    R.map((line) => (line.includes('python = "') ? `python = "~${pythonVersion}.0"` : line)),
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
  s.start('Setting up Dagster (this may take a few minutes)')
  const dagsterInitStartTime = startStopwatch()
  const dagsterInitResp = await initDagster(projectName)

  if (dagsterInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Dagster.\n\n${dagsterInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dagsterInitDuration = endStopwatch(dagsterInitStartTime)
    s.stop('Dagster set up successfully.' + chalk.gray(` [${dagsterInitDuration}ms]`))
  }

  // Set up Meltano
  s.start('Setting up Meltano (this may take a few minutes)')
  const meltanoInitStartTime = startStopwatch()
  const meltanoInitResp = await initMeltano(projectName)

  if (meltanoInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Meltano.\n\n${meltanoInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const meltanoInitDuration = endStopwatch(meltanoInitStartTime)
    s.stop('Meltano set up successfully.' + chalk.gray(` [${meltanoInitDuration}ms]`))
  }

  // Set up DBT
  s.start('Setting up DBT (this may take a few minutes)')
  const dbtInitStartTime = startStopwatch()
  const dbtInitResp = await initDbt(projectName)

  if (dbtInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing DBT.\n\n${dbtInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const dbtInitDuration = endStopwatch(dbtInitStartTime)
    s.stop('DBT set up successfully.' + chalk.gray(` [${dbtInitDuration}ms]`))
  }

  // Set up Trino
  s.start('Setting up Trino (this may take a few minutes)')
  const trinoInitStartTime = startStopwatch()
  const trinoInitResp = await initTrino(projectName)

  if (trinoInitResp?.error) {
    const errorMessage = `Sorry, something went wrong while intializing Trino.\n\n${trinoInitResp.error?.stderr}`
    exitOnError(errorMessage)
  } else {
    const trinoInitDuration = endStopwatch(trinoInitStartTime)
    s.stop('Trino set up successfully.' + chalk.gray(` [${trinoInitDuration}ms]`))
  }

  /**
   *
   * Combine the tool docker-compose.yaml files
   *
   *    WHY???
   *    - Tools are initialized in parallel and this can cause issues if it's written to one file concurrently
   *
   */
  s.start('Generating docker-compose file')
  const dcStartTime = startStopwatch()
  const toolConfigs = [
    getMinioConfig(projectName),
    getIcebergConfig(projectName),
    getTrinoConfig(projectName),
    getSupersetConfig(projectName),
  ]
  const dcNetworks = { [SHARED_NETWORK_NAME]: { driver: 'bridge' } }
  const dcVolumes = {
    ...MINIO_VOLUME,
    ...ICEBERG_PG_CATALOG_VOLUME,
    ...SUPERSET_HOME_VOLUME,
    ...SUPERSET_DB_HOME_VOLUME,
    ...SUPERSET_CACHE_VOLUME,
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
    s.stop('Docker-compose file generated successfully.' + chalk.gray(` [${dcDuration}ms]`))
  }

  /**
   *
   * Create environment variables and root .gitignore
   *
   */
  s.start('Setting up other project level configurations')
  const envsStartTime = startStopwatch()
  const envs = [
    `${PROJECT_DIRNAME_ENVNAME}=${projectName}`,
    `${AWS_REGION_ENVNAME}=us-west-2`,
    `${AWS_ACCESS_KEY_ID_ENVNAME}=admin`,
    `${AWS_SECRET_ACCESS_KEY_ENVNAME}=admin_secret`,
    `${LAKEHOUSE_NAME_ENVNAME}=lakehouse`,
    `${S3_ENDPOINT_ENVNAME}=http://minio:${MINIO_SERVER_HOST_PORT}`,
    `${ICEBERG_CATALOG_NAME_ENVNAME}=icebergcatalog`,
    `${ICEBERG_PG_CATALOG_USER_ENVNAME}=iceberg`,
    `${ICEBERG_PG_CATALOG_PASSWORD_ENVNAME}=iceberg`,
    `${ICEBERG_PG_CATALOG_DB_ENVNAME}=iceberg`,
    `${TRINO_USER_ENVNAME}=admin`,
  ]
  const envsStr = envs.join('\n')
  await Bun.write(`./${projectName}/.env`, envsStr) // overwrites

  const gitignorefileTemplate = await Bun.file('src/cli/templates/gitignore_file').text()
  await Bun.write(`./${projectName}/.gitignore`, gitignorefileTemplate)

  // Copy the .env file to /dagster and /meltano
  await Bun.write(`./${projectName}/.env`, `./${projectName}/dagster/${projectName}/.env`)
  await Bun.write(`./${projectName}/.env`, `./${projectName}/meltano/.env`)

  const envsDuration = endStopwatch(envsStartTime)
  s.stop('Successfully set up other project level configurations.' + chalk.gray(` [${envsDuration}ms]`))

  /**
   *
   * Connect the tools
   *
   */

  // dagster-meltano

  // dagster-dbt

  /**
   *
   * TODO: Add example code
   *
   */

  //

  // dbt example code to access iceberg
}

export const initDagster = async (projectName: string): Promise<ToolInitResponse> => {
  // Initialize the tool (if necessary)
  const config = getDagsterConfig(projectName)
  const { id, name } = config

  // Run `poetry add`
  if (config.install) {
    const installResp = await config.install()
    if (installResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while installing ${name}.`,
          ...installResp?.error,
        },
      }
    }
  }

  // Initialize
  if (config.init) {
    const initResp = await config.init()
    if (initResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while intializing ${name}.`,
          ...initResp?.error,
        },
      }
    }
  }

  // Run post-init script
  if (config.postInit) {
    const postInitResp = await config.postInit()
    if (postInitResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while running post-initialization script for ${name}.`,
          ...postInitResp?.error,
        },
      }
    }
  }

  return {
    id,
    name,
    response: `${name} successfully initialized!`,
  }
}

export const initMeltano = async (projectName: string): Promise<ToolInitResponse> => {
  // Initialize the tool (if necessary)
  const config = getMeltanoConfig(projectName)
  const { id, name } = config

  // Run `poetry add`
  if (config.install) {
    const installResp = await config.install()
    if (installResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while installing ${name}.`,
          ...installResp?.error,
        },
      }
    }
  }

  // Initialize
  if (config.init) {
    const initResp = await config.init()
    if (initResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while initializing ${name}.`,
          ...initResp?.error,
        },
      }
    }
  }

  // Run post-init script
  if (config.postInit) {
    const postInitResp = await config.postInit()
    if (postInitResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while running post-initialization script for ${name}.`,
          ...postInitResp?.error,
        },
      }
    }
  }

  return {
    id,
    name,
    response: `${name} successfully initialized!`,
  }
}

export const initDbt = async (projectName: string): Promise<ToolInitResponse> => {
  // Initialize the tool (if necessary)
  const config = getDbtConfig(projectName)
  const { id, name } = config

  // Run `poetry add`
  if (config.install) {
    const installResp = await config.install()
    if (installResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while installing ${name}.`,
          ...installResp?.error,
        },
      }
    }
  }

  // Initialize
  if (config.init) {
    const initResp = await config.init()
    if (initResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while initializing ${name}.`,
          ...initResp?.error,
        },
      }
    }
  }

  // Run post-init script
  if (config.postInit) {
    const postInitResp = await config.postInit()
    if (postInitResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while running post-initialization script for ${name}.`,
          ...postInitResp?.error,
        },
      }
    }
  }

  return {
    id,
    name,
    response: `${name} successfully initialized!`,
  }
}

export const initTrino = async (projectName: string): Promise<ToolInitResponse> => {
  // Initialize the tool (if necessary)
  const config = getTrinoConfig(projectName)
  const { id, name } = config

  // Initialize
  if (config.postInit) {
    const initResp = await config.postInit()
    if (initResp?.error) {
      return {
        id,
        name,
        error: {
          message: `Something went wrong while initializing ${name}.`,
          ...initResp?.error,
        },
      }
    }
  }

  return {
    id,
    name,
    response: `${name} successfully initialized!`,
  }
}
