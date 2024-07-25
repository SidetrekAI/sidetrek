import * as R from 'ramda'
import {
  getDagsterConfig,
  getDagsterDbtConfig,
  getDagsterMeltanoConfig,
  getDbtConfig,
  getJupyterlabConfig,
  getMeltanoConfig,
  getSupersetConfig,
  getTrinoConfig,
  type ToolConfig,
} from '../toolConfigs'
import type { ToolInitResponse } from '../types'

export const initTool = async (projectName: string, toolId: string): Promise<ToolInitResponse> => {
  const toolConfigs: { [key: string]: ToolConfig } = {
    dagster: getDagsterConfig(projectName),
    meltano: getMeltanoConfig(projectName),
    dbt: getDbtConfig(projectName),
    trino: getTrinoConfig(projectName),
    jupyterlab: getJupyterlabConfig(projectName),
    superset: getSupersetConfig(projectName),
    'dagster-meltano': getDagsterMeltanoConfig(projectName),
    'dagster-dbt': getDagsterDbtConfig(projectName),
  }

  const config = toolConfigs[toolId]
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
