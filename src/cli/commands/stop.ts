import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

export default async function stop() {
  const sidetrekHome = getSidetrekHome()
  
  // Stop the core services
  await $`docker compose stop`

  // Stop superset
  await $`docker compose stop`.cwd(`${sidetrekHome}/superset`)
}
