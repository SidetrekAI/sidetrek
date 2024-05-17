import { $ } from 'bun'

export async function runTrinoShell() {
  await $`docker compose exec -it trino trino`
}
