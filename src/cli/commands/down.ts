import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

export default async function down() {
  const sidetrekHome = getSidetrekHome()

  // Down the core services
  await $`docker compose down`

  // Down superset
  await $`docker compose down`.cwd(`${sidetrekHome}/superset`)
}
