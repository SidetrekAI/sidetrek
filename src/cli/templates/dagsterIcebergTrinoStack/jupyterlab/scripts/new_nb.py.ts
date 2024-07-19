const pyContent = `import argparse
from glob import glob
from nbdev.export import nb_export
from nbdev.processors import mk_cell
from nbdev.process import NBProcessor, dict2nb
from execnb.nbio import write_nb

def create_notebook(notebook_path: str | None) -> None:
    nb = {
        "cells": [
            mk_cell("from sidetrek import trino", "code"),
            mk_cell("%%writefile_dbt stg_iceberg__orders.sql\n#|export_dbt stg_iceberg__orders.sql", "code"),
            mk_cell('%%sh\nsidetrek run dbt run --select "+stg_iceberg__orders"', "code"),
            mk_cell("trino.connect()\n", "code"),
        ]
    }
    processor = NBProcessor(nb=dict2nb(nb))
    processor.process()
    write_nb(processor.nb, notebook_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", "--notebook", required=False, type=str)
    args = parser.parse_args()
    notebook_to_export = args.notebook if args.notebook else None

    create_notebook(notebook_path=notebook_to_export)
`

export default pyContent