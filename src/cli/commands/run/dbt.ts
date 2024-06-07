import path from 'path'
import { $ } from 'bun'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function runDbt(dbtCmd: string[]) {
  const projectName = path.basename(cwd)
  const dbtProjectDir = `${cwd}/${projectName}/dbt/${projectName}`

  // `dbtCmd` includes the command (after `sidetrek run dbt`) and options
  const dbtCmdStr = dbtCmd.join(' ')
  
  // Pass the command to dbt CLI
  try {
    const cmd = `poetry run dbt ${dbtCmdStr}`
    await $`${{ raw: cmd }}`.cwd(dbtProjectDir)
  } catch(err: any) {
    // Silently exit since dbt will print the error
  }
}
