import { $ } from 'bun'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function stop() {
  // Stop the core services
  await $`docker compose stop`

  // Stop superset
  await $`docker compose stop`.cwd(`${cwd}/superset`)
}
