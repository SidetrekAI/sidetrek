import { $ } from 'bun'
import { getProjectName, getSidetrekHome } from '@cli/utils'
import newNbPyModule from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/scripts/new_nb.py'

const sidetrekHome = getSidetrekHome()
const projectName = getProjectName()

export default async function createNotebook(notebookPath: string) {
  try {
    // Create a temporary script in .sidetrek/scripts
    await $`mkdir -p .sidetrek/scripts`.cwd(sidetrekHome)
    await Bun.write(`${sidetrekHome}/.sidetrek/scripts/new_nb.py`, newNbPyModule)

    const cmd = `python3 .sidetrek/scripts/newnb.py --path ${notebookPath}`
    await $`${{ raw: cmd }}`.cwd(sidetrekHome)
  } catch (err: any) {
    // Silently exit
  }
}
