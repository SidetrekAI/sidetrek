import * as R from 'ramda'
import { Command } from 'commander'
import { colors } from './constants'
import init from './commands/init'
import dev from './commands/dev'
import logs from './commands/logs'

const program = new Command()

export default async function runCli() {
  program
    .version('0.1.0')
    .description(
      `🦄 ${colors.sidetrekPink('Sidetrek')} is the ${colors.sidetrekYellow(
        'fastest'
      )} way to build a ${colors.sidetrekPurple('modern data stack')}.`
    )

  const initCommand = program
    .command('init')
    .description('Initialize your project')
    .option('--skip-example  [value]', 'Skip the example code')
    .action((_, options) => {
      init(options)
    })

  const devCommand = program
    .command('dev')
    .description('Start the development server')
    .action((_, options) => {
      dev()
    })

  const logsCommand = program
    .command('logs')
    .description('View logs')
    .argument('[string]', 'string to split')
    .option('-f, --follow', 'Follow logs')
    .option('--since [value]', 'Only show logs since a specific time ago')
    .action((service, options) => {
      console.log(service)
      logs(service, options)
    })

  program.parse(process.argv)
}
