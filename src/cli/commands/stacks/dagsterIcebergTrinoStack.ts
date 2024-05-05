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
  createOrUpdateEnvFile,
} from '../../utils'
import {
  getDagsterConfig,
  getDagsterDbtConfig,
  getDagsterMeltanoConfig,
  getDbtConfig,
  getIcebergConfig,
  getMeltanoConfig,
  getMinioConfig,
  getSupersetConfig,
  getTrinoConfig,
  type IcebergConfig,
  type MinioConfig,
  type SupersetConfig,
  type TrinoConfig,
} from '../../toolConfigs'
import type { ToolInitResponse } from '../../types'
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
  MINIO_SERVER_HOST_PORT,
  PYICEBERG_CATALOG__ICEBERGCATALOG__URI_ENVNAME,
  PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ENDPOINT_ENVNAME,
  PYICEBERG_CATALOG__ICEBERGCATALOG__PY_IO_IMPL_ENVNAME,
  PYICEBERG_CATALOG__ICEBERGCATALOG__S3__REGION_ENVNAME,
  PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ACCESS_KEY_ID_ENVNAME,
  PYICEBERG_CATALOG__ICEBERGCATALOG__S3__SECRET_ACCESS_KEY_ENVNAME,
  ICEBERG_REST_HOST_PORT,
  DAGSTER_HOME_ENVNAME,
} from '../../constants'
import gitignore from '../../templates/gitignore'
import { initTool } from '../utils'

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
  const poetryNewResp = await execShell(`poetry new ${projectName} && rm -rf ./${projectName}/tests && mkdir -p ./${projectName}/sidetrek`)

  if (poetryNewResp?.error) {
    const errorMessage = `Sorry, something went wrong while scaffolding the project via Poetry.\n\n${poetryNewResp.error?.stderr}`
    exitOnError(errorMessage)
  }

  // Must update the pyproject.toml file to set the correct python version
  const pyprojectTomlStr = await $`cat ./${projectName}/pyproject.toml`.text()
  const updatedPyprojectTomlStr = R.compose(
    R.join('\n'),
    R.append(`\n\n[tool.dagster]\nmodule_name = "${projectName}"`),
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

  // Set up Meltano
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
  s.start('Generating docker-compose file')
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
    s.stop('Docker-compose file generated successfully.' + chalk.gray(` [${dcDuration}ms]`))
  }

  /**
   *
   * Create environment variables and root .gitignore
   *
   */
  s.start('Setting up other project level configurations')
  const envsStartTime = startStopwatch()

  const S3_ENDPOINT = `http://minio:${MINIO_SERVER_HOST_PORT}`
  const AWS_REGION = 'us-west-2'
  const AWS_ACCESS_KEY_ID = 'admin'
  const AWS_SECRET_ACCESS_KEY = 'admin_secret'

  const envFileObj = {
    [PROJECT_DIRNAME_ENVNAME]: `${projectName}`,
    [DAGSTER_HOME_ENVNAME]: `${process.cwd()}/${projectName}/${projectName}/dagster/${projectName}`,
    [AWS_REGION_ENVNAME]: `${AWS_REGION}`,
    [AWS_ACCESS_KEY_ID_ENVNAME]: `${AWS_ACCESS_KEY_ID}`,
    [AWS_SECRET_ACCESS_KEY_ENVNAME]: `${AWS_SECRET_ACCESS_KEY}`,
    [LAKEHOUSE_NAME_ENVNAME]: `lakehouse`,
    [S3_ENDPOINT_ENVNAME]: `${S3_ENDPOINT}`,
    [ICEBERG_CATALOG_NAME_ENVNAME]: `icebergcatalog`,
    [ICEBERG_PG_CATALOG_USER_ENVNAME]: `iceberg`,
    [ICEBERG_PG_CATALOG_PASSWORD_ENVNAME]: `iceberg`,
    [ICEBERG_PG_CATALOG_DB_ENVNAME]: `iceberg`,
    [TRINO_USER_ENVNAME]: `admin`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__URI_ENVNAME]: `http://iceberg-rest:${ICEBERG_REST_HOST_PORT}`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ENDPOINT_ENVNAME]: `${S3_ENDPOINT}`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__PY_IO_IMPL_ENVNAME]: `pyiceberg.io.pyarrow.PyArrowFileIO`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__S3__REGION_ENVNAME]: `${AWS_REGION}`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ACCESS_KEY_ID_ENVNAME]: `${AWS_ACCESS_KEY_ID}`,
    [PYICEBERG_CATALOG__ICEBERGCATALOG__S3__SECRET_ACCESS_KEY_ENVNAME]: `${AWS_SECRET_ACCESS_KEY}`,
  }
  await createOrUpdateEnvFile(`./${projectName}/.env`, envFileObj)

  await Bun.write(`./${projectName}/.gitignore`, gitignore)

  // // Copy the .env file to /dagster and /meltano
  await createOrUpdateEnvFile(`./${projectName}/${projectName}/dagster/${projectName}/.env`, envFileObj)
  await createOrUpdateEnvFile(`./${projectName}/${projectName}/meltano/.env`, envFileObj)

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
   * TODO: Add example code
   *
   */

  //

  // dbt example code to access iceberg

  /**
   *
   * Wrap up
   *
   */
  s.start('Calculating total duration')
  const totalDuration = endStopwatch(startTime)
  s.stop(chalk.gray(`Total duration: ${totalDuration}ms`))
}

// export const initDagster = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getDagsterConfig(projectName)
//   const { id, name } = config

//   // Run `poetry add`
//   if (config.install) {
//     const installResp = await config.install()
//     if (installResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while installing ${name}.`,
//           ...installResp?.error,
//         },
//       }
//     }
//   }

//   // Initialize
//   if (config.init) {
//     const initResp = await config.init()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while intializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const postInitResp = await config.postInit()
//     if (postInitResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while running post-initialization script for ${name}.`,
//           ...postInitResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initMeltano = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getMeltanoConfig(projectName)
//   const { id, name } = config

//   // Run `poetry add`
//   if (config.install) {
//     const installResp = await config.install()
//     if (installResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while installing ${name}.`,
//           ...installResp?.error,
//         },
//       }
//     }
//   }

//   // Initialize
//   if (config.init) {
//     const initResp = await config.init()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while initializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const postInitResp = await config.postInit()
//     if (postInitResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while running post-initialization script for ${name}.`,
//           ...postInitResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initDbt = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getDbtConfig(projectName)
//   const { id, name } = config

//   // Run `poetry add`
//   if (config.install) {
//     const installResp = await config.install()
//     if (installResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while installing ${name}.`,
//           ...installResp?.error,
//         },
//       }
//     }
//   }

//   // Initialize
//   if (config.init) {
//     const initResp = await config.init()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while initializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const postInitResp = await config.postInit()
//     if (postInitResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while running post-initialization script for ${name}.`,
//           ...postInitResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initTrino = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getTrinoConfig(projectName)
//   const { id, name } = config

//   // Run post-init script
//   if (config.postInit) {
//     const initResp = await config.postInit()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while initializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initSuperset = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getSupersetConfig(projectName)
//   const { id, name } = config

//   // Initialize
//   if (config.init) {
//     const initResp = await config.init()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while initializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const initResp = await config.postInit()
//     if (initResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while initializing ${name}.`,
//           ...initResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initDagsterMeltano = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getDagsterMeltanoConfig(projectName)
//   const { id, name } = config

//   // Run `poetry add`
//   if (config.install) {
//     const installResp = await config.install()
//     if (installResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while installing ${name}.`,
//           ...installResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const postInitResp = await config.postInit()
//     if (postInitResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while running post-initialization script for ${name}.`,
//           ...postInitResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }

// export const initDagsterDbt = async (projectName: string): Promise<ToolInitResponse> => {
//   // Initialize the tool (if necessary)
//   const config = getDagsterDbtConfig(projectName)
//   const { id, name } = config

//   // Run `poetry add`
//   if (config.install) {
//     const installResp = await config.install()
//     if (installResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while installing ${name}.`,
//           ...installResp?.error,
//         },
//       }
//     }
//   }

//   // Run post-init script
//   if (config.postInit) {
//     const postInitResp = await config.postInit()
//     if (postInitResp?.error) {
//       return {
//         id,
//         name,
//         error: {
//           message: `Something went wrong while running post-initialization script for ${name}.`,
//           ...postInitResp?.error,
//         },
//       }
//     }
//   }

//   return {
//     id,
//     name,
//     response: `${name} successfully initialized!`,
//   }
// }
