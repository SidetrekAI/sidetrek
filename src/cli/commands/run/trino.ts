import { $ } from 'bun'
import { getSidetrekHome } from '@cli/utils'

export async function runTrinoShell() {
  const sidetrekHome = getSidetrekHome()

  try {
    await $`docker compose exec -it trino trino`.cwd(sidetrekHome)
  } catch (err: any) {
    // Silently exit since docker will print the error
  }
}
