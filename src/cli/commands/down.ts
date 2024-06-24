import { $ } from 'bun'
import { killSidetrekUI } from './utils'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function down() {
  // Down the core services
  await $`docker compose down`

  // Down superset
  await $`docker compose down`.cwd(`${cwd}/superset`)

  // // Kill Sidetrek UI
  // await killSidetrekUI()

  // // Exit poetry shell
  // await $`exit`.cwd(cwd)
}
