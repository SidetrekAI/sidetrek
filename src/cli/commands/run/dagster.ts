import path from 'path'
import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

export default async function runDagster(dagsterCmd: string[]) {
  const sidetrekHome = getSidetrekHome()
  const projectName = getProjectName()

  const dagsterProjectDir = `${sidetrekHome}/${projectName}/dagster/${projectName}`

  // `dagsterCmd` includes the command (after `sidetrek run dagster`) and options
  const dagsterCmdStr = dagsterCmd.join(' ')

  // Pass the command to dagster CLI
  try {
    const cmd = `poetry run dagster ${dagsterCmdStr}`
    await $`${{ raw: cmd }}`.cwd(dagsterProjectDir)
  } catch (err: any) {
    // Silently exit since dagster will print the error
  }
}
