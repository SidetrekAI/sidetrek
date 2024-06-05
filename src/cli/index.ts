import * as R from 'ramda'
import { Command } from 'commander'
import { colors } from './constants'
import { getPackageVersion, track } from './utils'
import init from './commands/init/init'
import start from './commands/start'
import stop from './commands/stop'
import down from './commands/down'
import logs from './commands/logs'
import runMeltano from './commands/run/meltano'
import { runTrinoShell } from './commands/run/trino'

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

  const stopCommand = program
    .command('stop')
    .description('Stop the development services')
    .action(() => {
      stop()
    })

  const downCommand = program
    .command('down')
    .description('Tear down the development services')
    .action(() => {
      down()
    })

  const logsCommand = program
    .command('logs')
    .description('View logs')
    .argument('[string]', 'Service to view logs for')
    .option('-f, --follow', 'Follow logs')
    .option('--since <value>', 'Only show logs since a specific time ago')
    .option('-n, --tail', 'Follow logs')
    .action((service, options) => {
      logs(service, options)
    })

  const runCommand = program
    .command('run')
    .description('Run tool commands')
    .action(() => {})

  const runMeltanoCommand = runCommand
    .command('meltano')
    .description('Run Meltano commands')
    .argument('<string...>', 'Command to run')
    .action((meltanoCmd) => {
      runMeltano(meltanoCmd, process.argv.slice(4))
    })

  const runTrinoCommand = runCommand.command('trino').description('Run Trino commands')

  const runTrinoShellCommand = runTrinoCommand
    .command('shell')
    .description('Enter Trino shell')
    .action(() => {
      runTrinoShell()
    })

  // Track every command
  program.hook('postAction', async (thisCommand, actionCommand) => {
    const trackingPayload = { command: actionCommand.name() }
    track(trackingPayload)
  })

  program.parse(process.argv)
}
