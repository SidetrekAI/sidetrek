import path from 'path'
import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'

const sidetrekHome = getSidetrekHome()
const projectName = getProjectName()
console.log(`sidetrekHome: ${sidetrekHome}`)
console.log(`projectName: ${projectName}`)

export default async function runMeltano(meltanoCmd: string[]) {
  const meltanoProjectDir = `${sidetrekHome}/${projectName}/meltano`

  // `meltanoCmd` includes the command (after `sidetrek run meltano`) and options
  const meltanoCmdStr = meltanoCmd.join(' ')
  
  // Pass the command to meltano CLI
  try {
    const cmd = `poetry run meltano ${meltanoCmdStr}`
    await $`${{ raw: cmd }}`.cwd(meltanoProjectDir)
  } catch(err: any) {
    // Silently exit since meltano will print the error
  }
}
