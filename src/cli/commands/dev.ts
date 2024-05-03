import path from 'path'
import { $ } from 'bun'
import { DAGSTER_HOST_PORT } from '../constants'

export default async function dev() {
  const projectName = path.basename(process.cwd())

  await $`docker-compose up -d`
  await $`cd ${projectName}/dagster/${projectName} && DAGSTER_DBT_PARSE_PROJECT_ON_LOAD=1 dagster dev -h 0.0.0.0 -p ${DAGSTER_HOST_PORT}`
}
