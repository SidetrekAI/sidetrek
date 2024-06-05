const pyContent = `import os

from dagster import Definitions
from dagster_dbt import DbtCliResource

from .dbt_assets import dbt_project_assets, dbt_project_dir
from .meltano import run_csv_to_iceberg_meltano_job


defs = Definitions(
    assets=[dbt_project_assets],
    jobs=[run_csv_to_iceberg_meltano_job],
    resources={
        "dbt": DbtCliResource(project_dir=os.fspath(dbt_project_dir)),
    },
)`

export default pyContent