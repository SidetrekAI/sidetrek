import * as R from 'ramda'
import { Command } from 'commander'
import { colors } from './constants'
import init from './commands/init'

const program = new Command()

export default async function runCli() {
  program
    .version('0.1.0')
    .description(
      `🦄 ${colors.sidetrekPink('Sidetrek')} is the ${colors.sidetrekYellow(
        'fastest'
      )} way to build a ${colors.sidetrekPurple('modern data stack')}.`
    )
  // .option('-l, --ls  [value]', 'List directory contents')
  // .option('-m, --mkdir <value>', 'Create a directory')
  // .option('-t, --touch <value>', 'Create a file')

  const initCommand = program
    .command('init')
    .description('Initialize your project')
    .option('--skip-example  [value]', 'Skip the example code')
    .action((args, options) => {
      init(options)
    })

  program.parse(process.argv)
}
