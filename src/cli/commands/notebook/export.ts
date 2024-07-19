import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'
import exportNbsPyModule from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/scripts/export_nbs.py'

const sidetrekHome = getSidetrekHome()

export default async function exportNotebooks(notebookToExport: string) {
  try {
    // Create a temporary script in .sidetrek/scripts
    await $`mkdir -p .sidetrek/scripts`.cwd(sidetrekHome)
    await Bun.write(`${sidetrekHome}/.sidetrek/scripts/export_nbs.py`, exportNbsPyModule)

    const optionNotebook = notebookToExport ? `--notebook ${notebookToExport}` : ''
    const cmd = `python3 .sidetrek/export_nbs.py ${optionNotebook}`
    await $`${{ raw: cmd }}`.cwd(sidetrekHome)
  } catch (err: any) {
    // Silently exit
  }
}
