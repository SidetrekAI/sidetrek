import { $ } from 'bun'

const cwd = process.cwd()

export async function runTrinoShell() {
  try {
    await $`docker compose exec -it trino trino`.cwd(cwd)
  } catch (err: any) {
    // Silently exit since docker will print the error
  }
}
