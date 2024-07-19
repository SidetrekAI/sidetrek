import { $ } from 'bun'
import * as R from 'ramda'
import YAML from 'yaml'
import type { ShellResponse } from './types'
import { createOrUpdateEnvFile, execShell } from './utils'
import {
  AWS_ACCESS_KEY_ID_ENVNAME,
  AWS_REGION_ENVNAME,
  AWS_SECRET_ACCESS_KEY_ENVNAME,
  DAGSTER_DBT_VERSION,
  DAGSTER_HOST_PORT,
  DAGSTER_MELTANO_VERSION,
  DAGSTER_VERSION,
  DBT_CORE_VERSION,
  DBT_TRINO_VERSION,
  ICEBERG_PG_CATALOG_DB_ENVNAME,
  ICEBERG_PG_CATALOG_PASSWORD_ENVNAME,
  ICEBERG_PG_CATALOG_USER_ENVNAME,
  ICEBERG_PG_CATALOG_VOLUME_NAME,
  ICEBERG_PG_CONTAINER_PORT,
  ICEBERG_PG_HOST_PORT,
  ICEBERG_REST_CONTAINER_PORT,
  ICEBERG_REST_HOST_PORT,
  JUPYTERLAB_CONTAINER_PORT,
  JUPYTERLAB_CONTAINER_VOLUME_PATH,
  JUPYTERLAB_HOST_PORT,
  JUPYTERLAB_TOKEN,
  LAKEHOUSE_NAME_ENVNAME,
  MELTANO_VERSION,
  MINIO_SERVER_CONTAINER_PORT,
  MINIO_SERVER_HOST_PORT,
  MINIO_UI_CONTAINER_PORT,
  MINIO_UI_HOST_PORT,
  MINIO_VOLUME_NAME,
  RAW_ICEBERG_TABLE_NAME,
  S3_ENDPOINT_ENVNAME,
  SHARED_NETWORK_NAME,
  TRINO_CONTAINER_PORT,
  TRINO_HOST_PORT,
  TRINO_USER,
  TRINO_VERSION,
} from './constants'
import dagsterMeltanoMeltanoPy from '@cli/templates/dagsterIcebergTrinoStack/dagster-meltano/meltano.py'
import dagsterDbtDbtAssetsPy from '@cli/templates/dagsterIcebergTrinoStack/dagster-dbt/dbt_assets.py'
import dagsterDbtInitPy from '@cli/templates/dagsterIcebergTrinoStack/dagster-dbt/__init__.py'
import jupyterlabDockerfile from '@cli/templates/jupyterlabDockerfile'
import jupyterlabMagicsPy from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/magics/magics.py'
import jupyterlabDirectivesPy from '@cli/templates/dagsterIcebergTrinoStack/jupyterlab/nbdev_extensions/directives.py'

const cwd = process.cwd()

export interface ToolConfig {
  id: string
  name: string
  desc?: string
  version?: string
  install?: () => Promise<ShellResponse>
  init?: () => Promise<ShellResponse>
  postInit?: () => any
  run?: () => any
  ui?: () => any
}

type MinimalToolConfig = Omit<ToolConfig, 'install' | 'init' | 'postInit' | 'run' | 'ui'>

// Dagster
export interface DagsterConfig extends MinimalToolConfig {
  install: () => Promise<ShellResponse>
  init: () => Promise<ShellResponse>
  postInit: () => any
  run: () => any
  ui: () => any
}

export const getDagsterConfig = (projectName: string): DagsterConfig => {
  return {
    id: 'dagster',
    name: 'Dagster',
    desc: 'A data orchestrator for machine learning, analytics, and ETL.',
    version: DAGSTER_VERSION,
    install: async () => {
      return await execShell(`poetry add dagster@${DAGSTER_VERSION} dagster-webserver@${DAGSTER_VERSION}`, {
        cwd: `${cwd}/${projectName}`,
      })
    },
    init: async () => {
      // Scaffold the dagster project
      return await execShell(
        `mkdir dagster && cd dagster && poetry run dagster project scaffold --name ${projectName}`,
        {
          cwd: `${cwd}/${projectName}/${projectName}`,
        }
      )
    },
    postInit: async () => {
      // NOTE: .env will be copied from root later
      // Add .gitignore
      await Bun.write(`./${projectName}/${projectName}/dagster/${projectName}/.gitignore`, '/history\n/storage\n/logs')
    },
    run: async () => {
      await $`DAGSTER_DBT_PARSE_PROJECT_ON_LOAD=1 poetry run dagster dev -h 0.0.0.0 -p ${DAGSTER_HOST_PORT}`
    },
    ui: async () => {
      await execShell(`open http://localhost:${DAGSTER_HOST_PORT}`)
    },
  }
}

// Meltano
export interface MeltanoConfig extends MinimalToolConfig {
  install: () => Promise<ShellResponse>
  init: () => Promise<ShellResponse>
  postInit: () => any
}

export const getMeltanoConfig = (projectName: string): MeltanoConfig => {
  return {
    id: 'meltano',
    name: 'Meltano',
    desc: 'An open-source ingestion tool implementing Singer protocol.',
    version: MELTANO_VERSION,
    install: async () => {
      return await execShell(`poetry add meltano@${MELTANO_VERSION}`, { cwd: `${cwd}/${projectName}` })
    },
    init: async () => {
      return await execShell(`poetry run meltano init meltano`, { cwd: `${cwd}/${projectName}/${projectName}` })
    },
    postInit: async () => {
      // NOTE: .env will be copied from root later

      // Add .gitignore
      await Bun.write(`./${projectName}/${projectName}/meltano/.gitignore`, '/.meltano')
    },
  }
}

// DBT
export interface DbtConfig extends MinimalToolConfig {
  install: () => Promise<ShellResponse>
  init: () => Promise<ShellResponse>
  postInit: () => any
}

export const getDbtConfig = (projectName: string): DbtConfig => {
  return {
    id: 'dbt',
    name: 'DBT',
    desc: 'An open source data transformation tool.',
    version: DBT_CORE_VERSION,
    install: async () => {
      return await execShell(`poetry add dbt-core@${DBT_CORE_VERSION} dbt-trino@${DBT_TRINO_VERSION}`, {
        cwd: `${cwd}/${projectName}`,
      })
    },
    init: async () => {
      return await execShell(`mkdir dbt && cd dbt && poetry run dbt init --skip-profile-setup ${projectName}`, {
        cwd: `${cwd}/${projectName}/${projectName}`,
      })
    },
    postInit: async () => {
      // NOTE: dbt adds .gitignore by default - so no need to add it here

      // Remove default dbt example code
      await execShell(`rm -rf ./${projectName}/${projectName}/dbt/${projectName}/models/example`)

      // Add trino profile
      const trinoDbtProfile = {
        dbt_project: {
          target: 'trino',
          outputs: {
            trino: {
              type: 'trino',
              user: TRINO_USER,
              host: 'localhost',
              port: parseInt(TRINO_HOST_PORT),
              database: 'iceberg',
              schema: 'project',
              http_scheme: 'http',
              threads: 1,
              session_properties: {
                query_max_run_time: '5d',
              },
            },
          },
        },
      }
      const trinoDbtProfileYaml = YAML.stringify(trinoDbtProfile)
      await Bun.write(`./${projectName}/${projectName}/dbt/${projectName}/profiles.yml`, trinoDbtProfileYaml)

      // Update dbt_project.yml to 1) use trino profile, 2) remove example code, and 3) add automatic schema generation
      const dbtProjectYamlJson = YAML.parse(
        await $`cat ./${projectName}/${projectName}/dbt/${projectName}/dbt_project.yml`.text()
      )
      const updatedDbtProjectYamlJson = R.compose(
        R.assoc('on-run-start', [
          `CREATE SCHEMA IF NOT EXISTS ${RAW_ICEBERG_TABLE_NAME}`,
          'CREATE SCHEMA IF NOT EXISTS {{ schema }}',
        ]), // Add automatic schema generation
        R.dissocPath(['models', projectName, 'example']), // Remove example code
        R.assocPath(['profile'], 'dbt_project') // Use the created profile above
      )(dbtProjectYamlJson)
      const updatedDbtProjectYaml = YAML.stringify(updatedDbtProjectYamlJson)
      await Bun.write(`./${projectName}/${projectName}/dbt/${projectName}/dbt_project.yml`, updatedDbtProjectYaml)
    },
  }
}

// Minio
export interface MinioConfig extends MinimalToolConfig {
  dockerComposeObj: any
}

export const getMinioConfig = (projectName: string): MinioConfig => {
  const dockerComposeObj = {
    minio: {
      image: 'minio/minio',
      container_name: 'minio',
      command: `server --address "0.0.0.0:${MINIO_SERVER_HOST_PORT}" --console-address "0.0.0.0:${MINIO_UI_HOST_PORT}" /data`,
      restart: 'always',
      environment: [
        'MINIO_ROOT_USER=${' + AWS_ACCESS_KEY_ID_ENVNAME + '}',
        'MINIO_ROOT_PASSWORD=${' + AWS_SECRET_ACCESS_KEY_ENVNAME + '}',
        'MINIO_DOMAIN=minio', // This is required to allow iceberg-rest to connect to minio
      ],
      ports: [
        `${MINIO_SERVER_HOST_PORT}:${MINIO_SERVER_CONTAINER_PORT}`,
        `${MINIO_UI_HOST_PORT}:${MINIO_UI_CONTAINER_PORT}`,
      ],
      volumes: [`${MINIO_VOLUME_NAME}:/data`],
      networks: {
        [SHARED_NETWORK_NAME]: {
          // This is required to allow iceberg-rest to connect to minio (due to path-style-access setting changes in aws sdk)
          // See: https://github.com/tabular-io/docker-spark-iceberg/pull/72
          aliases: ['${LAKEHOUSE_NAME}.minio'],
        },
      },
    },
    mc: {
      image: 'minio/mc',
      container_name: 'mc',
      hostname: 'mc',
      environment: [
        'AWS_ACCESS_KEY_ID=${' + AWS_ACCESS_KEY_ID_ENVNAME + '}',
        'AWS_SECRET_ACCESS_KEY=${' + AWS_SECRET_ACCESS_KEY_ENVNAME + '}',
      ],
      entrypoint:
        '/bin/sh -c "\nuntil (/usr/bin/mc config host add minio ' +
        '${' +
        S3_ENDPOINT_ENVNAME +
        '} ' +
        '${' +
        AWS_ACCESS_KEY_ID_ENVNAME +
        '} ' +
        '${' +
        AWS_SECRET_ACCESS_KEY_ENVNAME +
        "}) do echo '...waiting...' && sleep 1; done;\n/usr/bin/mc mb minio/${" +
        LAKEHOUSE_NAME_ENVNAME +
        '};\n/usr/bin/mc policy set public minio/${' +
        LAKEHOUSE_NAME_ENVNAME +
        '};\ntail -f /dev/null;\n"',
      networks: [SHARED_NETWORK_NAME],
      depends_on: ['minio'],
    },
  }

  return {
    id: 'minio',
    name: 'Minio',
    desc: 'An open-source object storage.',
    dockerComposeObj,
  }
}

// Iceberg
export interface IcebergConfig extends MinimalToolConfig {
  dockerComposeObj: any
}

export const getIcebergConfig = (projectName: string): IcebergConfig => {
  const dockerComposeObj = {
    'iceberg-rest': {
      image: 'tabulario/iceberg-rest',
      container_name: 'iceberg_rest',
      ports: [`${ICEBERG_REST_HOST_PORT}:${ICEBERG_REST_CONTAINER_PORT}`],
      environment: [
        'AWS_REGION=${' + AWS_REGION_ENVNAME + '}',
        'AWS_ACCESS_KEY_ID=${' + AWS_ACCESS_KEY_ID_ENVNAME + '}',
        'AWS_SECRET_ACCESS_KEY=${' + AWS_SECRET_ACCESS_KEY_ENVNAME + '}',
        'CATALOG_WAREHOUSE=s3a://${' + LAKEHOUSE_NAME_ENVNAME + '}/',
        'CATALOG_IO__IMPL=org.apache.iceberg.aws.s3.S3FileIO',
        'CATALOG_S3_ENDPOINT=${' + S3_ENDPOINT_ENVNAME + '}',
        'CATALOG_CATALOG__IMPL=org.apache.iceberg.jdbc.JdbcCatalog',
        'CATALOG_URI=jdbc:postgresql://iceberg-pg-catalog:5432/${' + ICEBERG_PG_CATALOG_DB_ENVNAME + '}',
        'CATALOG_JDBC_USER=${' + ICEBERG_PG_CATALOG_USER_ENVNAME + '}',
        'CATALOG_JDBC_PASSWORD=${' + ICEBERG_PG_CATALOG_PASSWORD_ENVNAME + '}',
      ],
      networks: [SHARED_NETWORK_NAME],
      depends_on: {
        'iceberg-pg-catalog': {
          condition: 'service_healthy',
          restart: true,
        },
      },
    },
    'iceberg-pg-catalog': {
      image: 'postgres:15-alpine',
      container_name: 'iceberg_pg_catalog',
      environment: [
        'POSTGRES_USER=${' + ICEBERG_PG_CATALOG_USER_ENVNAME + '}',
        'POSTGRES_PASSWORD=${' + ICEBERG_PG_CATALOG_PASSWORD_ENVNAME + '}',
        'POSTGRES_DB=${' + ICEBERG_PG_CATALOG_DB_ENVNAME + '}',
      ],
      healthcheck: {
        test: ['CMD', 'pg_isready', '-U', '${' + ICEBERG_PG_CATALOG_USER_ENVNAME + '}'],
        interval: '5s',
        retries: 5,
      },
      ports: [`${ICEBERG_PG_HOST_PORT}:${ICEBERG_PG_CONTAINER_PORT}`],
      volumes: [`${ICEBERG_PG_CATALOG_VOLUME_NAME}:/var/lib/postgresql/data`],
      networks: [SHARED_NETWORK_NAME],
    },
  }

  return {
    id: 'iceberg',
    name: 'Iceberg',
    desc: 'An open table format for large analytical datasets.',
    dockerComposeObj,
  }
}

// Trino
export interface TrinoConfig extends MinimalToolConfig {
  dockerComposeObj: any
  postInit: () => any
  shell: () => any
}

export const getTrinoConfig = (projectName: string): TrinoConfig => {
  const dockerComposeObj = {
    trino: {
      image: `trinodb/trino:${TRINO_VERSION}`,
      container_name: 'trino',
      ports: [`${TRINO_HOST_PORT}:${TRINO_CONTAINER_PORT}`],
      environment: [
        'AWS_REGION=${' + AWS_REGION_ENVNAME + '}',
        'AWS_ACCESS_KEY_ID=${' + AWS_ACCESS_KEY_ID_ENVNAME + '}',
        'AWS_SECRET_ACCESS_KEY=${' + AWS_SECRET_ACCESS_KEY_ENVNAME + '}',
        'S3_ENDPOINT=${' + S3_ENDPOINT_ENVNAME + '}',
        'LAKEHOUSE_NAME=${' + LAKEHOUSE_NAME_ENVNAME + '}',
      ],
      volumes: ['./trino/etc:/etc/trino'],
      networks: [SHARED_NETWORK_NAME],
      depends_on: ['minio'],
    },
  }

  return {
    id: 'trino',
    name: 'Trino',
    desc: 'A distributed SQL query engine for big data.',
    dockerComposeObj,
    postInit: async () => {
      const trinoInitFiles = {
        'node.properties': 'node.environment=development',
        'jvm.config':
          '-server\n' +
          '-Xmx16G\n' +
          '-XX:InitialRAMPercentage=80\n' +
          '-XX:MaxRAMPercentage=80\n' +
          '-XX:G1HeapRegionSize=32M\n' +
          '-XX:+ExplicitGCInvokesConcurrent\n' +
          '-XX:+ExitOnOutOfMemoryError\n' +
          '-XX:+HeapDumpOnOutOfMemoryError\n' +
          '-XX:-OmitStackTraceInFastThrow\n' +
          '-XX:ReservedCodeCacheSize=512M\n' +
          '-XX:PerMethodRecompilationCutoff=10000\n' +
          '-XX:PerBytecodeRecompilationCutoff=10000\n' +
          '-Djdk.attach.allowAttachSelf=true\n' +
          '-Djdk.nio.maxCachedBufferSize=2000000\n' +
          '-Dfile.encoding=UTF-8\n' +
          '# Reduce starvation of threads by GClocker, recommend to set about the number of cpu cores (JDK-8192647)\n' +
          '-XX:+UnlockDiagnosticVMOptions\n' +
          '-XX:GCLockerRetryAllocationCount=32\n',
        'config.properties':
          'coordinator=true\n' +
          'node-scheduler.include-coordinator=true\n' +
          'http-server.http.port=8080\n' +
          'discovery.uri=http://trino:8080\n',
      }

      const trinoIcebergCatalogFile = {
        'iceberg.properties':
          'connector.name=iceberg\n' +
          'iceberg.catalog.type=rest\n' +
          'iceberg.rest-catalog.uri=http://iceberg-rest:8181/\n' +
          'iceberg.rest-catalog.warehouse=s3a://${ENV:LAKEHOUSE_NAME}\n' +
          'hive.s3.aws-access-key=${ENV:AWS_ACCESS_KEY_ID}\n' +
          'hive.s3.aws-secret-key=${ENV:AWS_SECRET_ACCESS_KEY}\n' +
          'hive.s3.region=${ENV:AWS_REGION}\n' +
          'hive.s3.endpoint=${ENV:S3_ENDPOINT}\n' +
          'hive.s3.path-style-access=true\n',
      }

      // Create 1) trino dir, 2) add init files, 3) add iceberg catalog file
      await execShell(`cd ${projectName} && mkdir -p trino/etc/catalog`)
      await Bun.write(`./${projectName}/trino/etc/node.properties`, trinoInitFiles['node.properties'])
      await Bun.write(`./${projectName}/trino/etc/jvm.config`, trinoInitFiles['jvm.config'])
      await Bun.write(`./${projectName}/trino/etc/config.properties`, trinoInitFiles['config.properties'])
      await Bun.write(
        `./${projectName}/trino/etc/catalog/iceberg.properties`,
        trinoIcebergCatalogFile['iceberg.properties']
      )
    },
    shell: async () => {
      return await execShell(`docker exec -it trino trino`)
    },
  }
}

// Superset
interface SupersetConfigRunOptions {
  build?: boolean
}

export interface SupersetConfig extends MinimalToolConfig {
  init: () => any
  postInit: () => any
  run: (options?: SupersetConfigRunOptions) => any
}

export const getSupersetConfig = (projectName: string): SupersetConfig => {
  return {
    id: 'superset',
    name: 'Superset',
    desc: 'An open-source data exploration and visualization platform.',
    init: async () => {
      return await execShell(`cd ${projectName} && git clone --depth=1 https://github.com/apache/superset.git`)
    },
    postInit: async () => {
      // Update docker .env
      await createOrUpdateEnvFile(`./${projectName}/superset/docker/.env`, {
        SUPERSET_LOAD_EXAMPLES: 'no',
        SUPERSET_ENV: 'production',
      })

      // Add requirements-local.txt with trino
      await Bun.write(`${projectName}/superset/docker/requirements-local.txt`, 'trino')

      // Add extra_host to superset docker-compose-image-tag.yml
      const dockerComposeImageTagFile = await Bun.file(`${projectName}/superset/docker-compose-image-tag.yml`).text()
      const dockerComposeImageTagJson = YAML.parse(dockerComposeImageTagFile)
      const updatedDockerComposeImageTagJson = R.compose(
        R.assocPath(['services', 'superset', 'extra_hosts'], ['host.docker.internal:host-gateway']),
        R.assocPath(['services', 'superset-worker', 'extra_hosts'], ['host.docker.internal:host-gateway'])
      )(dockerComposeImageTagJson)
      const updatedDockerComposeImageTagYaml = YAML.stringify(updatedDockerComposeImageTagJson)
      await Bun.write(`${projectName}/superset/docker-compose-image-tag.yml`, updatedDockerComposeImageTagYaml)

      // Remove .git
      await execShell(`rm -rf ./${projectName}/superset/.git`)
    },
    run: async (options?: SupersetConfigRunOptions) => {
      const { build = false } = options || {}
      await $`docker compose -f docker-compose-image-tag.yml up -d ${build ? '--build' : ''}`.cwd(`${cwd}/superset`)
    },
  }
}

// dagster-meltano connector
export interface DagsterMeltanoConfig extends MinimalToolConfig {
  install: () => Promise<ShellResponse>
  postInit: () => any
}

export const getDagsterMeltanoConfig = (projectName: string): DagsterMeltanoConfig => {
  return {
    id: 'dagster-meltano',
    name: 'Dagster-Meltano',
    desc: 'Dagster-Meltano connector.',
    version: DAGSTER_MELTANO_VERSION,
    install: async () => {
      return await execShell(`poetry add dagster-meltano@${DAGSTER_MELTANO_VERSION}`, { cwd: `${cwd}/${projectName}` })
    },
    postInit: async () => {
      // Add the connection code
      await Bun.write(
        `./${projectName}/${projectName}/dagster/${projectName}/${projectName}/meltano.py`,
        dagsterMeltanoMeltanoPy
      )
    },
  }
}

// dagster-dbt connector
export interface DagsterDbtConfig extends MinimalToolConfig {
  install: () => Promise<ShellResponse>
  postInit: () => any
}

export const getDagsterDbtConfig = (projectName: string): DagsterDbtConfig => {
  return {
    id: 'dagster-dbt',
    name: 'Dagster-DBT',
    desc: 'Dagster-DBT connector.',
    version: DAGSTER_DBT_VERSION,
    install: async () => {
      return await execShell(`poetry add dagster-dbt@${DAGSTER_DBT_VERSION}`, { cwd: `${cwd}/${projectName}` })
    },
    postInit: async () => {
      // Add the connection code
      await Bun.write(
        `./${projectName}/${projectName}/dagster/${projectName}/${projectName}/dbt_assets.py`,
        dagsterDbtDbtAssetsPy
      )
      await Bun.write(
        `./${projectName}/${projectName}/dagster/${projectName}/${projectName}/__init__.py`,
        dagsterDbtInitPy
      )
    },
  }
}

// Jupyterlab
export interface JupyterlabConfig extends MinimalToolConfig {
  init: () => Promise<ShellResponse>
  install: () => Promise<ShellResponse>
  postInit: () => any
  dockerComposeObj: any
}

export const getJupyterlabConfig = (projectName: string): JupyterlabConfig => {
  const dockerComposeObj = {
    jupyterlab: {
      container_name: 'jupyterlab',
      build: {
        context: '.',
        dockerfile: 'Dockerfile.jupyterlab',
      },
      ports: [`${JUPYTERLAB_HOST_PORT}:${JUPYTERLAB_CONTAINER_PORT}`],
      volumes: [`.:${JUPYTERLAB_CONTAINER_VOLUME_PATH}`],
      command: `start-notebook.py --NotebookApp.token='${JUPYTERLAB_TOKEN}'`,
      extra_hosts: ['host.docker.internal:host-gateway'],
      networks: [SHARED_NETWORK_NAME],
    },
  }

  return {
    id: 'jupyterlab',
    name: 'JupyterLab',
    desc: 'An open-source application for literate programming.',
    init: async () => {
      // Create jupyterlab dir
      return await execShell(`mkdir -p jupyterlab/magics`)
    },
    install: async () => {
      return await execShell(`poetry add nbdev nbdev-extensions`, { cwd: `${cwd}/${projectName}` })
    },
    postInit: async () => {
      // Add requirements.in (these are packages that are made available in the jupyterlab)
      const packages = [
        'poetry',
        'nbdev',
        'nbdev-extensions',
        'dagster',
        'dbt-core',
        'dbt-trino',
        'meltano',
        'trino',
        'duckdb',
        'pandas',
      ]

      await Bun.write(`./${projectName}/jupyterlab/requirements.in`, packages.join('\n'))

      // Add Dockerfile.jupyterlab
      await Bun.write(`./${projectName}/Dockerfile.jupyterlab`, jupyterlabDockerfile)

      // Add magics
      await Bun.write(`./${projectName}/jupyterlab/magics/magics.py`, jupyterlabMagicsPy)
    },
    dockerComposeObj,
  }
}
