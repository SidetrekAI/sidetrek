import * as p from '@clack/prompts'
import * as R from 'ramda'
import { setTimeout as sleep } from 'node:timers/promises'
import chalk from 'chalk'
import { colors } from '../constants'
import { buildProject, installPoetry } from './utils'
import { validateProjectName } from './validators'
import { clackLog, endStopwatch, startStopwatch } from '../utils'

export default async function init() {
  console.log('\n')
  const s = p.spinner()
  const log = console.log
  const requiredPythonVersion = '>= 3.10'

  await p.group(
    {
      intro: () => p.intro(colors.sidetrekPurple(`🔥 Let's create a new data project!`)),
      prerequisites: async () => {
        return await p.confirm({
          message: `Do you have python version ${requiredPythonVersion} and pip installed?`,
        })
      },
      projectName: async ({ results }) => {
        if (!results.prerequisites) {
          p.cancel(`No worries - please try again after installing python version ${requiredPythonVersion} and pip.`)
          process.exit(0)
        }

        return await p.text({
          message: 'Great! Now, what would you like to name your project?',
          validate: validateProjectName,
        })
      },
      confirmInstallPoetry: async ({ results }) => {
        return await p.confirm({
          message: 'Sidetrek init requires Poetry. Is it OK if we install it for you?',
        })
      },
      installPoetry: async ({ results }) => {
        if (!results.confirmInstallPoetry) {
          p.cancel('No worries - please try again after installing Poetry.')
          process.exit(0)
        }

        s.start('Installing Poetry...')
        const startTime = startStopwatch()

        const resp = await installPoetry()

        if (resp.error) {
          p.cancel('Sorry, something went wrong while installing Poetry. Please install Poetry and try again.')
          process.exit(0)
        } else {
          const endTime = endStopwatch(startTime)
          s.stop(chalk.green('Poetry successfully installed!') + chalk.gray(` [${endTime}ms]`))
        }
      },
      stack: async ({ results }) => {
        return await p.select({
          message: `Which data stack would you like to build?`,
          options: [
            {
              value: ['dagster', 'meltano', 'iceberg', 'dbt', 'trino', 'superset'],
              label: 'Dagster, Meltano, Iceberg, DBT, Trino, and Superset',
              hint: 'Sorry, this is the only option at the moment',
            },
          ],
        })
      },
      buildStack: async ({ results }) => {
        const dataStack = results.stack as string[]

        if (R.equals(dataStack, ['dagster', 'meltano', 'iceberg', 'dbt', 'trino', 'superset'])) {
          s.start('Initializing your project...')
          const startTime = startStopwatch()

          // Do something
          buildProject(dataStack)

          const endTime = endStopwatch(startTime)
          s.stop(chalk.green('Project successfully initialized!') + chalk.gray(` [${endTime}ms]`))
        }
      },
      outro: () => p.outro(colors.sidetrekPurple(`You're all set - enjoy building your new data project! 🚀`)),
    },
    {
      // On Cancel callback that wraps the group
      // So if the user cancels one of the prompts in the group this function will be called
      onCancel: ({ results }) => {
        p.cancel('Operation cancelled.')
        process.exit(0)
      },
    }
  )
}
