import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

const sidetrekHome = getSidetrekHome()

export default async function stop() {
  // Stop the core services
  await $`docker compose stop`

  // Stop superset
  await $`docker compose stop`.cwd(`${sidetrekHome}/superset`)
}
