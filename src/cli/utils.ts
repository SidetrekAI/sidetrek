import * as R from 'ramda'
import { $ } from 'bun'
import YAML from 'yaml'
import * as p from '@clack/prompts'
import chalk from 'chalk'
import type { PromiseFactory, ShellResponse } from './types'
import { colors, S_BAR, SHARED_NETWORK_NAME } from './constants'
import type { ToolConfig } from './toolConfigs'

export const startStopwatch = (): number => {
  return new Date().getTime()
}

export const endStopwatch = (startTime: number): number => {
  const endTime = new Date().getTime()
  const timeDiff = endTime - startTime
  return parseFloat(timeDiff.toFixed(2))
}

interface NormalizeEntitiesOptionArgs {
  selectId?: (selector: any) => any
}

// [{ id: '', ... }] -> { ids: [], entities: { [id]: entity, ... } }
// Takes optional selectId fn to specify which key should be the id (defaults to id)
export const normalizeEntities = (
  data: any[],
  { selectId = ({ id }) => id }: NormalizeEntitiesOptionArgs = {}
): any => {
  if (!data) return null

  if (R.isEmpty(data)) {
    return { ids: [], entities: {} }
  }

  return {
    ids: R.map(selectId, data),
    entities: R.reduce((prev, curr: any) => R.mergeAll([prev, { [selectId(curr)]: curr }]), {})(data),
  }
}

interface ClackLogOptions {
  prefix?: string
  suffix?: string
}

export const applyClackStyle = (str: string, options?: ClackLogOptions): string => {
  const { prefix, suffix } = options || {}

  const clackStyleStr = chalk.gray(S_BAR) + `  ${str}`

  if (prefix && suffix) {
    return `${prefix}${clackStyleStr}${suffix}`
  }

  if (prefix) {
    return `${prefix}${clackStyleStr}`
  }

  if (suffix) {
    return `${clackStyleStr}${suffix}`
  }

  return clackStyleStr
}

export const clackLog = (str: string, options?: ClackLogOptions): void => {
  console.log(applyClackStyle(str, options))
}

// MUST input an array of promise factories NOT promises - i.e. () => Promise
export const resolvePromiseFactoriesSeq = async (promiseFactories: PromiseFactory[]) => {
  const results = []
  for (const promiseFactory of promiseFactories) {
    try {
      const result = await promiseFactory()
      results.push(result)
    } catch (err: any) {
      throw new Error(err)
    }
  }

  return results
}

// Execute long running bun shell commands for Clack

interface ExecShellOptions {
  enableLogging?: boolean
}

export const execShell = async (command: string, options?: ExecShellOptions): Promise<ShellResponse> => {
  const { enableLogging = false } = options || {}

  try {
    let counter = 0

    // CAVEAT: must wrap the command in raw - otherwise, it won't work properly due to character escaping issues
    for await (let line of $`${{ raw: command }}`.lines()) {
      if (enableLogging) {
        if (counter === 0) {
          clackLog('', { prefix: '\n' })
        }

        clackLog(colors.lightGray(line))
      }

      counter++
    }

    return {
      response: 'success',
    }
  } catch (err: any) {
    if (!err || !err?.stderr) {
      return {
        error: {
          code: 1,
          stderr: 'Error: No error message provided',
          stdout: '',
        },
      }
    }

    return {
      error: {
        code: err?.exitCode,
        stderr: err?.stderr.toString(),
        stdout: err?.stdout.toString(),
      },
    }
  }
}

export const genDockerfile = () => {}

interface GenDockerComposeArgs {
  projectName: string
  toolDockerComposeObjs: ToolConfig[]
  volumes: { [key: string]: any }
  networks: { [key: string]: any }
}

export const genDockerCompose = ({ toolDockerComposeObjs, volumes, networks }: GenDockerComposeArgs): any => {
  return {
    version: '3',
    services: {
      ...toolDockerComposeObjs.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    },
    volumes,
    networks,
  }
}

export const createDockerComposeFile = async (dockerComposeObj: any, filePath: string): Promise<ShellResponse> => {
  const dockerComposeYaml = YAML.stringify(dockerComposeObj)
  return await execShell(`echo '${dockerComposeYaml}' > ${filePath}`)
}