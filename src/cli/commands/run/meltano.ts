import path from 'path'
import { $ } from 'bun'
import * as R from 'ramda'
import { extractOptions } from '../utils'

// NOTE: cwd is the root project dir
const cwd = process.cwd()

export default async function runMeltano(meltanoCmd: string[], argv: string[]) {
  const projectName = path.basename(cwd)
  const meltanoProjectDir = `${cwd}/${projectName}/meltano`

  const meltanoCmdStr = meltanoCmd.join(' ')
  const optionsStr = extractOptions(argv)

  console.log('meltanoCmdStr', meltanoCmdStr)
  console.log('optionsStr', optionsStr)

  // // Pass the command to meltano CLI
  // await $`poetry run meltano ${meltanoCmdStr} ${optionsStr}`.cwd(meltanoProjectDir)
}
