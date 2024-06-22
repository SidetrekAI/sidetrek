import path from 'path'
import { $ } from 'bun'
import { getDagsterConfig, getSupersetConfig } from '../toolConfigs'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function start(options: any) {
  const { build = false, skip = [] } = options

  const projectName = path.basename(cwd)

  // Run the core services
  await $`docker compose up -d ${build ? '--build' : ''}`

  // Enter poetry shell
  await $`poetry shell`.cwd(cwd)

  // Run superset
  const supersetConfig = getSupersetConfig(projectName)
  await supersetConfig.run({ build })

  // Run the dagster dev server
  const dagsterConfig = getDagsterConfig(projectName)
  await dagsterConfig.run()
}
