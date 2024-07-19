import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

const sidetrekHome = getSidetrekHome()

export default async function down() {
  // Down the core services
  await $`docker compose down`

  // Down superset
  await $`docker compose down`.cwd(`${sidetrekHome}/superset`)
}
