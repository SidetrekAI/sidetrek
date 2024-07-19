import { $ } from 'bun'
import { getSidetrekHome } from '@cli/utils'

const sidetrekHome = getSidetrekHome()

export async function runTrinoShell() {
  try {
    await $`docker compose exec -it trino trino`.cwd(sidetrekHome)
  } catch (err: any) {
    // Silently exit since docker will print the error
  }
}
