const pyContent = `import argparse
from glob import glob
from nbdev.export import nb_export
from nbdev.processors import mk_cell
from nbdev.process import NBProcessor, dict2nb
from execnb.nbio import write_nb


def create_notebook(notebook_path: str | None, template: str | None) -> None:
    nbdict_default = {
        "cells": [
            mk_cell("", "code"),
        ]
    }

    nbdict_dbt = {
        "cells": [
            mk_cell("from sidetrek import trino\\nimport pandas as pd", "code"),
            mk_cell("%%writefile_dbt stg_iceberg__your_model.sql\\n#|export_dbt stg_iceberg__your_model.sql\\n# Your DBT code goes here", "code"),
            mk_cell('%%sh\\nsidetrek run dbt run --select "+stg_iceberg__your_model"', "code"),
            mk_cell('conn = trino.connect(catalog="iceberg", schema="project_staging")\\ncur = conn.cursor()\\ncur.execute("SELECT * FROM stg_iceberg__your_model LIMIT 10")\\nrows = cur.fetchall()', "code"),
            mk_cell('df = pd.DataFrame(rows)\\nprint(df.head(5))', "code"),
        ]
    }

    nbdict_templates = {"default": nbdict_default, "dbt": nbdict_dbt}

    nbdict = nbdict_templates[template]

    write_nb(dict2nb(nbdict), notebook_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", "--notebook", required=True, type=str)
    parser.add_argument("-t", "--template", required=False, type=str)
    args = parser.parse_args()
    notebook_to_export = args.notebook
    template = args.template or "default"

    create_notebook(notebook_path=notebook_to_export, template=template)
`

export default pyContent
