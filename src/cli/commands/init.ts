import * as p from '@clack/prompts'
import * as R from 'ramda'
import { setTimeout as sleep } from 'node:timers/promises'
import chalk from 'chalk'
import { colors } from '../constants'
import { validateProjectName } from '../validators'
import { clackLog, endStopwatch, startStopwatch } from '../utils'
import { buildDagsterIcebergTrinoStack } from './stacks/dagsterIcebergTrinoStack'

export default async function init(options: any) {
  /**
   *
   * PREREQUISITES
   *
   *    - Python 3.10-3.11
   *    - Poetry
   *
   */

  console.log('\n')
  const s = p.spinner()

  await p.group(
    {
      intro: () => p.intro(colors.sidetrekPurple(`🔥 Let's create a new data project!`)),
      prerequisites: async ({ results }) => {
        return await p.confirm({
          message: `Sidetrek currently requires ${chalk.underline.yellow('Python 3.10-3.11')} (defaults to 3.10) and ${chalk.underline.yellow('Poetry')}. Are you ready to continue?`,
        })
      },
      pythonVersion: async ({ results }) => {
        if (!results.prerequisites) {
          p.cancel('No worries - please try again after installing the prerequisites.')
          process.exit(0)
        }

        return await p.select({
          message: `Which python version would you like to use?`,
          options: [
            { value: '3.10', label: '3.10' },
            { value: '3.11', label: '3.11' },
          ],
        })
      },
      projectName: async ({ results }) => {
        return await p.text({
          message: 'Awesome! What would you like to name your project?',
          validate: validateProjectName,
        })
      },
      stack: async ({ results }) => {
        return await p.select({
          message: `Which data stack would you like to build?`,
          options: [
            {
              value: 'dagsterIcebergTrinoStack',
              label: 'Dagster, Meltano, DBT, Iceberg, Trino, and Superset',
              hint: 'Sorry, this is the only option at the moment',
            },
          ],
        })
      },
      buildStack: async ({ results }) => {
        const dataStack = results.stack as string

        if (R.equals(dataStack, 'dagsterIcebergTrinoStack')) {
          // Build the data stack
          await buildDagsterIcebergTrinoStack(results)
        }
      },
      outro: async () => {
        const outroMessage = `You're all set - enjoy building your new data project! 🚀`
        return await p.outro(outroMessage)
      },
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
