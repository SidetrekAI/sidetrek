import path from 'path'
import { $ } from 'bun'
import { getDagsterConfig, getSupersetConfig } from '../toolConfigs'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function start(options: any) {
  const { build = false, skip = [] } = options

  const projectName = path.basename(cwd)

  // Enter poetry shell
  try {
    await $`poetry shell`.cwd(cwd)
  } catch (err) {
    console.error(err)
  }

  // Run the core services
  await $`docker compose up -d ${build ? '--build' : ''}`

  console.log('HERE 0')

  // Run ui + bun server
  try {
    await $`bun run dev`.cwd(`${cwd}/sidetrek-ui/ui`)
    await $`bun run dev`.cwd(`${cwd}/sidetrek-ui/server`)
  } catch (err) {
    console.error(err)
  }

  console.log('HERE 1')

  // Run superset
  const supersetConfig = getSupersetConfig(projectName)
  await supersetConfig.run({ build })

  console.log('HERE 2')

  // Run the dagster dev server
  const dagsterConfig = getDagsterConfig(projectName)
  await dagsterConfig.run()

  console.log('HERE 3')
}
