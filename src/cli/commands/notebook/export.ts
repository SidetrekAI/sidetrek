import path from 'path'
import fs from 'node:fs'
import { $ } from 'bun'
import * as p from '@clack/prompts'
import { execShell, getProjectName, getSidetrekHome } from '@cli/utils'
import exportNbsPyModule from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/scripts/export_nbs.py'
import { colors } from '@cli/constants'

export default async function exportNotebooks(notebookToExport: string) {
  const cwd = process.cwd()
  const sidetrekHome = getSidetrekHome()
  const projectName = getProjectName()

  console.log('\n')
  const s = p.spinner()

  let exportedNotebookPaths: any = undefined
  await p.group(
    {
      intro: () => p.intro(colors.sidetrekPurple(`Let's create a new notebook`)),
      notebookPath: async ({ results }) => {
        return await p.text({
          message: 'Which notebook would you like to export? (Type "all" to export all notebooks)',
          placeholder: './jupyterlab/my_notebook.ipynb',
          initialValue: 'all',
        })
      },
      export: async ({ results }) => {
        const notebookToExport = results.notebookPath as string

        if (notebookToExport !== 'all' && !fs.existsSync(path.resolve(cwd, notebookToExport))) {
          p.cancel(`Notebook not found: ${notebookToExport}`)
          process.exit(0)
        }

        s.start('Exporting notebook(s)...')
        try {
          // Create a temporary script in .sidetrek/scripts
          const tempScriptFilepath = `${sidetrekHome}/.sidetrek/scripts/export_nbs.py`
          await Bun.write(tempScriptFilepath, exportNbsPyModule)

          const optionNotebook = notebookToExport.toLowerCase() === 'all' ? '' : `--notebook ${notebookToExport}`
          const cmd = `poetry run python3 ${tempScriptFilepath} --rootdir ${sidetrekHome} ${optionNotebook}`
          const exportedNotebookPathsStr = await $`${{ raw: cmd }}`.cwd(sidetrekHome).text()
          exportedNotebookPaths = exportedNotebookPathsStr.split(',')
        } catch (err) {
          p.cancel(JSON.stringify(err))
          process.exit(0)
        }
        s.stop('Notebook(s) successfully exported')
      },
      outro: async ({ results }) => {
        const outroMessage = colors.sidetrekPurple(
          'The following notebook(s) were exported:' +
            '\n' +
            exportedNotebookPaths.map((_path: string) => `   - ${_path.replace(sidetrekHome, '')}`).join('\n')
        )
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
