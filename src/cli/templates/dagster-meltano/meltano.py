import os
from pathlib import Path

from dagster import job, Config, RunConfig
from dagster_meltano import meltano_resource, meltano_run_op


meltano_project_dir = str(
    Path(__file__).joinpath("..", "..", "..", "..", "meltano").resolve()
)


class MeltanoJobConfig(Config):
    project_dir: str


# Must provide meltano project dir as Dagster runtime config so dagster can find meltano
default_config = RunConfig(
    resources={"meltano": MeltanoJobConfig(project_dir=meltano_project_dir)},
)


# Example usage of meltano run op
@job(resource_defs={"meltano": meltano_resource}, config=default_config)
def run_csv_to_iceberg_meltano_job():
    tap_done = meltano_run_op("tap-csv target-iceberg")()
    
