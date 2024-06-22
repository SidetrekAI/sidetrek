import path from 'path'
import { $ } from 'bun'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function runMeltano(meltanoCmd: string[]) {
  const projectName = path.basename(cwd)
  const meltanoProjectDir = `${cwd}/${projectName}/meltano`

  // `meltanoCmd` includes the command (after `sidetrek run meltano`) and options
  const meltanoCmdStr = meltanoCmd.join(' ')
  
  // Pass the command to meltano CLI
  try {
    // const cmd = `poetry run meltano ${meltanoCmdStr}`
    const cmd = `meltano ${meltanoCmdStr}`
    await $`${{ raw: cmd }}`.cwd(meltanoProjectDir)
  } catch(err: any) {
    // Silently exit since meltano will print the error
  }
}
