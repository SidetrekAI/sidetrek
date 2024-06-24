import path from 'path'
import { $ } from 'bun'
import { getDagsterConfig, getSupersetConfig } from '../toolConfigs'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function start(options: any) {
  const { build = false, skip = [] } = options

  const projectName = path.basename(cwd)

  // // Enter poetry shell (TODO: this doesn't work yet)
  // try {
  //   await $`poetry shell`.cwd(cwd)
  // } catch (err) {
  //   console.error(err)
  // }

  // Run the core services
  await $`docker compose up -d ${build ? '--build' : ''}`

  // Run superset
  const supersetConfig = getSupersetConfig(projectName)
  await supersetConfig.run({ build })

  // Run ui + bun server
  // console.log('CUSTOM_ENV', process.env.CUSTOM_ENV)
  // console.log('sidetrek start cwd: ', cwd)
  try {
    if (process.env.CUSTOM_ENV === 'development') {
      Promise.all([
        $`bun run dev`.cwd(path.resolve(cwd, '../ui')),
        $`bun run dev`.cwd(path.resolve(cwd, '../server')),
      ])
    } else {
      Promise.all([
        $`bun run prod`.cwd(path.resolve(cwd, '/sidetrek-ui/ui')),
        $`bun run prod`.cwd(path.resolve(cwd, '/sidetrek-ui/server')),
      ])
    }
  } catch (err) {
    console.error(err)
  }

  // Run the dagster dev server
  const dagsterConfig = getDagsterConfig(projectName)
  await dagsterConfig.run()
}
