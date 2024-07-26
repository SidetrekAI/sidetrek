import * as R from 'ramda'
import { $ } from 'bun'
import { Command } from 'commander'
import { colors } from './constants'
import { getPackageVersion, manuallyHandleVersion, track } from './utils'
import init from './commands/init/init'
import start from './commands/start'
import stop from './commands/stop'
import down from './commands/down'
import logs from './commands/logs'
import runMeltano from './commands/run/meltano'
import { runTrinoShell } from './commands/run/trino'
import runDbt from './commands/run/dbt'
import runDagster from './commands/run/dagster'
import exportNotebooks from './commands/notebook/export'
import createNotebook from './commands/notebook/new'

const program = new Command()

// NOTE: In commander js, [] means optional, <> means required

export default async function runCli() {
  const version = await getPackageVersion()

  program
    .option('--version', 'Show version') // set up a manual --version to avoid subcommand --version being overwritten
    .description(
      `🦄 ${colors.sidetrekPink('Sidetrek')} is the ${colors.sidetrekYellow(
        'fastest'
      )} way to build a ${colors.sidetrekPurple('modern data stack')}.`
    )
    .action((options) => {
      if (options.version) {
        console.log(version)
      }
    })

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
    // .option('--skip <value...>', 'Skip a specific service')
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

  const runCommand = program.command('run').description('Run tool commands')

  const runMeltanoCommand = runCommand
    .command('meltano')
    .description('Run Meltano commands')
    .helpOption(false)
    .argument('[string...]', 'Meltano command to run')
    .allowUnknownOption()
    .action(async (meltanoCmd) => {
      await manuallyHandleVersion('poetry run dagster --version')
      runMeltano(meltanoCmd)
    })

  const runDagsterCommand = runCommand
    .command('dagster')
    .description('Run Dagster commands')
    .helpOption(false)
    .argument('[string...]', 'Dagster command to run')
    .allowUnknownOption()
    .action(async (dagsterCmd) => {
      await manuallyHandleVersion('poetry run dagster --version')
      runDagster(dagsterCmd)
    })

  const runDbtCommand = runCommand
    .command('dbt')
    .description('Run DBT commands')
    .helpOption(false)
    .argument('[string...]', 'DBT command to run')
    .allowUnknownOption()
    .action(async (dbtCmd) => {
      await manuallyHandleVersion('poetry run dbt --version')
      runDbt(dbtCmd)
    })

  const runTrinoCommand = runCommand.command('trino').description('Run Trino commands')

  const runTrinoShellCommand = runTrinoCommand
    .command('shell')
    .description('Enter Trino shell')
    .action(() => {
      runTrinoShell()
    })

  const notebookCommand = program.command('notebook').description('Run notebook related commands')

  const notebookNewCommand = notebookCommand
    .command('new')
    .description('Create a new notebook')
    .action(() => {
      createNotebook()
    })

  const notebookExportCommand = notebookCommand
    .command('export')
    .description('Export notebooks as python modules or dbt files')
    .argument('[string]', 'Notebook to export')
    .action((notebookToExport) => {
      exportNotebooks(notebookToExport)
    })

  // Track every command
  program.hook('postAction', async (thisCommand, actionCommand) => {
    // Do not track top level commands (e.g. `sidetrek --version`); this can be run from any dir, which will create different generated user id
    if (R.isEmpty(thisCommand.args)) return

    // SPECIAL CASE: `sidetrek init` does not have a generated user id yet, so handle the tracking inside the command
    if (thisCommand.args[0] === 'init') return

    const argsStr = thisCommand.args.join(' ')

    track({
      command: `${thisCommand.name()} ${argsStr}`,
      metadata: { options: thisCommand.opts() },
    })
  })

  program.parse(process.argv)
}
