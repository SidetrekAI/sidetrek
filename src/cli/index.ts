import * as R from 'ramda'
import { Command } from 'commander'
import { colors } from './constants'
import init from './commands/init'
import start from './commands/start'
import logs from './commands/logs'
import { getPackageVersion } from './utils'

const program = new Command()

// NOTE: In commander js, [] means optional, <> means required

export default async function runCli() {
  const version = await getPackageVersion()

  program
    .version(version)
    .description(
      `🦄 ${colors.sidetrekPink('Sidetrek')} is the ${colors.sidetrekYellow(
        'fastest'
      )} way to build a ${colors.sidetrekPurple('modern data stack')}.`
    )

  const initCommand = program
    .command('init')
    .description('Initialize your project')
    .option('--skip-example', 'Skip the example code')
    .action((options) => {
      init(options)
    })

  const startCommand = program
    .command('start')
    .description('Start the development services')
    .option('--build', 'Re-build the docker containers')
    .option('--skip <value...>', 'Skip a specific service')
    .action((options) => {
      start(options)
    })

  const logsCommand = program
    .command('logs')
    .description('View logs')
    .argument('[string]', 'Service to view logs for')
    .option('-f, --follow', 'Follow logs')
    .option('--since <value>', 'Only show logs since a specific time ago')
    .action((service, options) => {
      logs(service, options)
    })

  program.parse(process.argv)
}
