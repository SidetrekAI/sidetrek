import path from 'path'
import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

export default async function runDbt(dbtCmd: string[]) {
  const sidetrekHome = getSidetrekHome()
  const projectName = getProjectName()

  const dbtProjectDir = `${sidetrekHome}/${projectName}/dbt/${projectName}`

  // `dbtCmd` includes the command (after `sidetrek run dbt`) and options
  const dbtCmdStr = dbtCmd.join(' ')

  // Pass the command to dbt CLI
  try {
    const cmd = `poetry run dbt ${dbtCmdStr}`
    await $`${{ raw: cmd }}`.cwd(dbtProjectDir)
  } catch (err: any) {
    // Silently exit since dbt will print the error
  }
}
