import path from 'path'
import { $ } from 'bun'
import { getDagsterConfig, getSupersetConfig } from '../toolConfigs'
import { getProjectName, getSidetrekHome } from '@cli/utils'

const projectName = getProjectName()

export default async function start(options: any) {
  const { build = false, skip = [] } = options

  // Run the core services
  await $`docker compose up -d ${build ? '--build' : ''}`

  // Run superset
  const supersetConfig = getSupersetConfig(projectName)
  await supersetConfig.run({ build })

  // Run the dagster dev server
  const dagsterConfig = getDagsterConfig(projectName)
  await dagsterConfig.run()
}
