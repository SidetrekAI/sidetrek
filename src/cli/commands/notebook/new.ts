import { $ } from 'bun'
import * as p from '@clack/prompts'
import { execShell, getProjectName, getSidetrekHome } from '@cli/utils'
import newNbPyModule from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/scripts/new_nb.py'
import { colors } from '@cli/constants'

export default async function createNotebook() {
  const sidetrekHome = getSidetrekHome()
  const projectName = getProjectName()

  console.log('\n')
  const s = p.spinner()

  await p.group(
    {
      intro: () => p.intro(colors.sidetrekPurple(`Let's create a new notebook`)),
      template: async ({ results }) => {
        return await p.select({
          message: `What type of notebook would you like to create?`,
          options: [
            { value: 'default', label: 'Blank python notebook' },
            { value: 'dbt', label: 'DBT notebook' },
          ],
        })
      },
      notebookPath: async ({ results }) => {
        const templates: any = {
          default: './jupyterlab/my_notebook.ipynb',
          dbt: `./${projectName}/dbt/${projectName}/models/my_model_notebook.ipynb`,
        }
        const initialValue = templates[results.template as string]

        return await p.text({
          message: 'What is the full file path of the notebook you want to create?',
          placeholder: './jupyterlab/my_shiny_new_notebook.ipynb',
          initialValue,
        })
      },
      checkPath: async ({ results }) => {
        const notebookPath = results.notebookPath as string
        const notebookExists = await Bun.file(notebookPath).exists()
        if (notebookExists) {
          return await p.select({
            message: `A notebook already exists at ${notebookPath}. Do you want to overwrite it?`,
            options: [
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ],
          })
        }
      },
      create: async ({ results }) => {
        if (results.checkPath === 'no') {
          p.cancel('No worries - please try another path.')
          process.exit(0)
        }

        s.start('Creating notebook...')
        try {
          // Create a temporary script in .sidetrek/scripts
          const tempScriptFilepath = `${sidetrekHome}/.sidetrek/scripts/new_nb.py`
          await Bun.write(tempScriptFilepath, newNbPyModule)

          const optionTemplate = `--template ${results.template as string}`
          const cmd = `poetry run python3 ${tempScriptFilepath} --notebook ${results.notebookPath} ${optionTemplate}`
          // await execShell(cmd, { cwd: sidetrekHome })
          await $`${{ raw: cmd }}`.cwd(sidetrekHome)
        } catch (err) {
          p.cancel(JSON.stringify(err))
          process.exit(0)
        }
        s.stop('Notebook successfully created')
      },
      outro: async ({ results }) => {
        const outroMessage = colors.sidetrekPurple(`New notebook created - ${results.notebookPath}`)
        await p.outro(outroMessage)
        process.exit(0)
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
