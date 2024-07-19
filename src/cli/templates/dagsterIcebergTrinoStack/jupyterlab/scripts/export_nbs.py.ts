const pyContent = `import argparse
from glob import glob
from sidetrek.nvdev.export import nb_export_dbt
from nbdev.export import nb_export


def export_notebook(notebook_path: str | None) -> None:
    if notebook_path:
        nb_export(notebook_path)
        nb_export_dbt(notebook_path)

    for matched_notebook_path in glob("**/*.ipynb", recursive=True):
        nb_export(matched_notebook_path)
        nb_export_dbt(matched_notebook_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", "--notebook", required=False, type=str)
    args = parser.parse_args()
    notebook_to_export = args.notebook if args.notebook else None

    export_notebook(notebook_path=notebook_to_export)
`

export default pyContent