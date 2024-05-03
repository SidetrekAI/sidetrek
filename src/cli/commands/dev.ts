import path from 'path'
import { $ } from 'bun'
import { DAGSTER_HOST_PORT } from '../constants'

// NOTE: cwd is the root project dir
export default async function dev(options: { [key: string]: any }) {
  const { build } = options
  
  const projectName = path.basename(process.cwd())

  // Run the core services
  await $`docker-compose up -d` + (build ? ' --build' : '')

  // Run superset
  await $`cd superset && docker-compose up -d` + (build ? ' --build' : '')

  // Run the dagster dev server
  await $`cd ${projectName}/dagster/${projectName} && DAGSTER_DBT_PARSE_PROJECT_ON_LOAD=1 dagster dev -h 0.0.0.0 -p ${DAGSTER_HOST_PORT}`
}
