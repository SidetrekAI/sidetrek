const pyContent = `import os
import argparse
from pathlib import Path
from glob import glob
from sidetrek.nbdev.export import nb_export_dbt
from nbdev.export import nb_export


def export_notebook(rootdir: str, notebook_path: str | None) -> None:
    if notebook_path:
        notebook_abspath = str(Path(os.getcwd()) / notebook_path)
        nb_export(notebook_abspath)
        nb_export_dbt(notebook_abspath)
        return [notebook_abspath]

    exported_notebook_paths = []
    for matched_notebook_path in glob(f"{rootdir}/**/*.ipynb", recursive=True):
        nb_export(matched_notebook_path)
        nb_export_dbt(matched_notebook_path)
        exported_notebook_paths.append(matched_notebook_path)
    return exported_notebook_paths


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-r", "--rootdir", required=False, type=str)
    parser.add_argument("-n", "--notebook", required=False, type=str)
    args = parser.parse_args()
    rootdir = args.rootdir if args.rootdir else os.getcwd()
    notebook_to_export = args.notebook if args.notebook else None

    exported_notebook_paths = export_notebook(rootdir=rootdir, notebook_path=notebook_to_export)
    print(','.join(exported_notebook_paths))
`

export default pyContent