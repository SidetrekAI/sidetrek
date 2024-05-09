const pyContent = `import os

from dagster import Definitions
from dagster_dbt import DbtCliResource

from .dbt_assets import dbt_project_assets, dbt_project_dir

defs = Definitions(
    assets=[dbt_project_assets],
    jobs=[],
    resources={
        "dbt": DbtCliResource(project_dir=os.fspath(dbt_project_dir)),
    },
)`

export default pyContent