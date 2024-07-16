import { $ } from 'bun'

export default async function exportNotebooks(notebookToExport: string) {
  try {
    const optionNotebook = notebookToExport ? `--notebook ${notebookToExport}` : ''
    const cmd = `python .sidetrek/exportnbs.py ${optionNotebook}`
    await $`${{ raw: cmd }}`
  } catch (err: any) {
    // Silently exit
  }
}
