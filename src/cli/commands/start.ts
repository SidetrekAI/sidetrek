import path from 'path'
import { $ } from 'bun'
import { getDagsterConfig, getSupersetConfig } from '../toolConfigs'
import { getProjectName, getSidetrekHome, track } from '@cli/utils'

export default async function start(options: any) {
  const projectName = getProjectName()

  const { build = false, skip = [] } = options

  try {
    // Run the core services
    await $`docker compose up -d ${build ? '--build' : ''}`

    // Run superset
    const supersetConfig = getSupersetConfig(projectName)
    await supersetConfig.run({ build })

    // Run the dagster dev server
    const dagsterConfig = getDagsterConfig(projectName)
    await dagsterConfig.run()
  } catch (err: any) {
    await track({
      command: 'start',
      metadata: { error: JSON.stringify(err) },
    })
  }
}
