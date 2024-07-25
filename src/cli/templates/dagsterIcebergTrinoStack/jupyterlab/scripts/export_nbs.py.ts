const pyContent = `import os
import argparse
from glob import glob
from sidetrek.nbdev.export import nb_export_dbt
from nbdev.export import nb_export


def export_notebook(rootdir: str, notebook_path: str | None) -> None:
    if notebook_path:
        nb_export(notebook_path)
        nb_export_dbt(notebook_path)

    for matched_notebook_path in glob(f"{rootdir}/**/*.ipynb", recursive=True):
        print("Exporting notebook: ", matched_notebook_path)
        nb_export(matched_notebook_path)
        nb_export_dbt(matched_notebook_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-r", "--rootdir", required=False, type=str)
    parser.add_argument("-n", "--notebook", required=False, type=str)
    args = parser.parse_args()
    rootdir = args.rootdir if args.rootdir else os.getcwd()
    notebook_to_export = args.notebook if args.notebook else None

    export_notebook(rootdir=rootdir, notebook_path=notebook_to_export)
`

export default pyContent