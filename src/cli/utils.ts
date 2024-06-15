import * as R from 'ramda'
import { $ } from 'bun'
import YAML from 'yaml'
import ky from 'ky'
import { v4 as uuidv4 } from 'uuid'
import fs from 'node:fs'
import chalk from 'chalk'
import type { EnvFileObj, PromiseFactory, ShellResponse } from './types'
import { colors, S_BAR, USERINFO_FILEPATH } from './constants'

const cwd = process.cwd()

export const getPackageVersion = async () => {
  const packageJson = await import('../../package.json')
  return packageJson.version
}

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
  cwd?: string
  enableLogging?: boolean
}

export const execShell = async (command: string, options?: ExecShellOptions): Promise<ShellResponse> => {
  const { cwd = process.cwd(), enableLogging = false } = options || {}

  try {
    let counter = 0

    // CAVEAT: must wrap the command in raw - otherwise, it won't work properly due to character escaping issues
    for await (let line of $`${{ raw: command }}`.cwd(cwd).lines()) {
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
    if (!err) {
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
  toolDockerComposeObjs: any[]
  volumes: { [key: string]: any }
  networks: { [key: string]: any }
}

export const genDockerCompose = ({ toolDockerComposeObjs, volumes, networks }: GenDockerComposeArgs): any => {
  return {
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

// IDEMPOTENT
export const createOrUpdateEnvFile = async (envFilePath: string, envFileObj: EnvFileObj): Promise<ShellResponse> => {
  if (!envFilePath) throw new Error('No env file path provided')
  if (!envFileObj) throw new Error('No env file object provided')

  const dockerEnv = Bun.file(envFilePath)

  // If the env file doesn't exist, create it
  if (!(await dockerEnv.exists())) {
    const envFileStr = R.compose(
      R.join('\n'),
      R.map(([k, v]) => `${k}=${v}`),
      R.toPairs
    )(envFileObj)
    return await execShell(`echo '${envFileStr}' > ${envFilePath}`)
  } else {
    const dockerEnvStr = await dockerEnv.text()
    const existingEnvFileObj: EnvFileObj = dockerEnvStr.split('\n').reduce((acc, curr) => {
      const [key, value] = curr.split('=')
      return { ...acc, [key]: value }
    }, {})
    const editedEnvFileObj: EnvFileObj = { ...existingEnvFileObj, ...envFileObj }
    const editedEnvFileStr = R.compose(
      R.join('\n'),
      R.map(([k, v]) => {
        return !v ? k : `${k}=${v}` // Handle comments!
      }),
      R.toPairs
    )(editedEnvFileObj)
    return await execShell(`echo '${editedEnvFileStr}' > ${envFilePath}`)
  }
}

export const retrieveGeneratedUserId = async () => {
  // Check if the uuid exists in .sidetrek
  const userinfoExists = await Bun.file(`${cwd}/${USERINFO_FILEPATH}`).exists()

  // If not, create it and store it
  if (!userinfoExists) {
    const generatedUserId = uuidv4()
    await Bun.write(`${cwd}/${USERINFO_FILEPATH}`, JSON.stringify({ generatedUserId }))
    return generatedUserId
  }

  // If it exists, but doesn't have uuid in it
  const userinfo = await Bun.file(`${cwd}/${USERINFO_FILEPATH}`).json()

  if (!userinfo?.generatedUserId) {
    const generatedUserId = uuidv4()
    const updatedUserinfo = { ...userinfo, generatedUserId }
    await Bun.write(`${cwd}/${USERINFO_FILEPATH}`, JSON.stringify(updatedUserinfo))
    return generatedUserId
  }

  return userinfo.generatedUserId
}

interface TrackingArgs {
  command: string
  metadata?: { [key: string]: any }
}

export const track = async (payload: TrackingArgs) => {
  // Track user actions
  const cliTrackingServerUrl =
    process.env.CUSTOM_ENV === 'development' ? 'http://localhost:3000/track' : 'https://cli-tracking.sidetrek.com/track'

  // Track os and arch
  let os = undefined
  let arch = undefined

  try {
    os = (await $`uname -s`.text()).replace('\n', '').toLowerCase()
    arch = (await $`uname -m`.text()).replace('\n', '').toLowerCase()
  } catch (err: any) {
    if (process.env.CUSTOM_ENV === 'development') {
      console.error('tracking os/arch err', err)
    }

    // Silently return in case of tracking failure - we don't want it affecting cli functionality
    return
  }

  try {
    const trackingRes = await ky
      .post(cliTrackingServerUrl, {
        json: {
          generated_user_id: await retrieveGeneratedUserId(),
          ...payload,
          metadata: {
            ...payload.metadata,
            os,
            arch,
          },
        },
        retry: 5,
      })
      .json()

    return trackingRes
  } catch (err: any) {
    if (process.env.CUSTOM_ENV === 'development') {
      console.log('tracking payload', payload)
      console.error('tracking err', err)
    }

    // Silently return in case of tracking failure - we don't want it affecting cli functionality
    return
  }
}
