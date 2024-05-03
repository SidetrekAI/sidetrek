import { $ } from 'bun'
import * as R from 'ramda'
import YAML from 'yaml'
import type { ShellResponse } from './types'
import { execShell } from './utils'
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
  LAKEHOUSE_NAME_ENVNAME,
  MELTANO_VERSION,
  MINIO_SERVER_CONTAINER_PORT,
  MINIO_SERVER_HOST_PORT,
  MINIO_UI_CONTAINER_PORT,
  MINIO_UI_HOST_PORT,
  MINIO_VOLUME,
  MINIO_VOLUME_NAME,
  RAW_ICEBERG_TABLE_NAME,
  S3_ENDPOINT_ENVNAME,
  SHARED_NETWORK_NAME,
  SUPERSET_CACHE_VOLUME_NAME,
  SUPERSET_DB_HOME_VOLUME_NAME,
  SUPERSET_HOME_VOLUME_NAME,
  TRINO_CONTAINER_PORT,
  TRINO_HOST_PORT,
  TRINO_VERSION,
} from './constants'
import dagsterMeltanoMeltanoPy from './templates/dagster-meltano/meltano'
import dagsterDbtDbtAssetsPy from './templates/dagster-dbt/dbt_assets'
import dagsterDbtInitPy from './templates/dagster-dbt/__init__'

export interface ToolConfig {
  id: string
  name: string
  desc?: string
  version?: string
  install?: () => Promise<ShellResponse>
  init?: () => Promise<ShellResponse>
  postInit?: () => any
  run?: () => Promise<ShellResponse>
  ui?: () => any
  shell?: () => Promise<ShellResponse>
  dockerComposeObj?: any
}

// Dagster
export const getDagsterConfig = (projectName: string): ToolConfig => {
  return {
    id: 'dagster',
    name: 'Dagster',
    desc: 'A data orchestrator for machine learning, analytics, and ETL.',
    version: DAGSTER_VERSION,
    install: async () => {
      return await execShell(
        `cd ${projectName} && poetry add dagster@${DAGSTER_VERSION} dagster-webserver@${DAGSTER_VERSION}`
      )
    },
    init: async () => {
      return await execShell(
        `cd ${projectName}/${projectName} && mkdir dagster && cd dagster && poetry run dagster project scaffold --name ${projectName}`
      )
    },
    postInit: async () => {
      // NOTE: .env will be copied from root later

      // Add .gitignore
      await Bun.write(`./${projectName}/${projectName}/dagster/${projectName}/.gitignore`, '/history\n/storage\n/logs')
    },
    run: async () => {
      return await execShell(`poetry run dagster dev -h 0.0.0.0 -p ${DAGSTER_HOST_PORT}`)
    },
    ui: async () => {
      await execShell(`open http://localhost:${DAGSTER_HOST_PORT}`)
    },
  }
}

// Meltano
export const getMeltanoConfig = (projectName: string): ToolConfig => {
  return {
    id: 'meltano',
    name: 'Meltano',
    desc: 'An open-source ingestion tool implementing Singer protocol.',
    version: MELTANO_VERSION,
    install: async () => {
      return await execShell(`cd ${projectName} && poetry add meltano@${MELTANO_VERSION}`)
    },
    init: async () => {
      return await execShell(`cd ${projectName}/${projectName} && poetry run meltano init meltano`)
    },
    postInit: async () => {
      // NOTE: .env will be copied from root later

      // Add .gitignore
      await Bun.write(`./${projectName}/${projectName}/meltano/.gitignore`, '/.meltano')
    },
  }
}

// DBT
export const getDbtConfig = (projectName: string): ToolConfig => {
  return {
    id: 'dbt',
    name: 'DBT',
    desc: 'An open source data transformation tool.',
    version: '0.21.0',
    install: async () => {
      return await execShell(`cd ${projectName} && poetry add dbt-core@${DBT_CORE_VERSION} dbt-trino@${DBT_TRINO_VERSION}`)
    },
    init: async () => {
      return await execShell(`cd ${projectName}/${projectName} && mkdir dbt && cd dbt && poetry run dbt init --skip-profile-setup ${projectName}`)
    },
    postInit: async () => {
      // NOTE: dbt adds .gitignore by default - so no need to add it here

      // Remove default dbt example code
      await execShell(`rm -rf ./${projectName}/${projectName}/dbt/${projectName}/models/example`)

      // Add trino profile
      const trinoDbtProfile = {
        trino: {
          target: 'dev',
          outputs: {
            dev: {
              type: 'trino',
              user: 'trino',
              host: 'trino',
              port: TRINO_HOST_PORT,
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
      const dbtProjectYamlJson = YAML.parse(await $`cat ./${projectName}/${projectName}/dbt/${projectName}/dbt_project.yml`.text())
      const updatedDbtProjectYamlJson = R.compose(
        R.assoc('on-run-start', [
          `CREATE SCHEMA IF NOT EXISTS ${RAW_ICEBERG_TABLE_NAME}`,
          'CREATE SCHEMA IF NOT EXISTS {{ schema }}',
        ]), // Add automatic schema generation
        R.dissocPath(['models', projectName, 'example']), // Remove example code
        R.assocPath(['profile'], 'trino') // Use trino profile
      )(dbtProjectYamlJson)
      const updatedDbtProjectYaml = YAML.stringify(updatedDbtProjectYamlJson)
      await Bun.write(`./${projectName}/${projectName}/dbt/${projectName}/dbt_project.yml`, updatedDbtProjectYaml)
    },
  }
}

// Minio
export const getMinioConfig = (projectName: string): ToolConfig => {
  const dockerComposeObj = {
    minio: {
      image: 'minio/minio',
      container_name: 'minio',
      command: `server --address "0.0.0.0:${MINIO_SERVER_HOST_PORT}" --console-address "0.0.0.0:${MINIO_UI_HOST_PORT}" /data`,
      restart: 'always',
      environment: [
        'MINIO_ROOT_USER=${' + AWS_ACCESS_KEY_ID_ENVNAME + '}',
        'MINIO_ROOT_PASSWORD=${' + AWS_SECRET_ACCESS_KEY_ENVNAME + '}',
      ],
      ports: [
        `${MINIO_SERVER_HOST_PORT}:${MINIO_SERVER_CONTAINER_PORT}`,
        `${MINIO_UI_HOST_PORT}:${MINIO_UI_CONTAINER_PORT}`,
      ],
      volumes: [`${MINIO_VOLUME_NAME}:/data`],
      networks: [SHARED_NETWORK_NAME],
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
        '/bin/sh -c "\nuntil (/usr/bin/mc config host add minio ${' +
        S3_ENDPOINT_ENVNAME +
        '} ' +
        AWS_ACCESS_KEY_ID_ENVNAME +
        '} ' +
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
export const getIcebergConfig = (projectName: string): ToolConfig => {
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
      depends_on: ['iceberg-pg-catalog'],
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
export const getTrinoConfig = (projectName: string): ToolConfig => {
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
      await Bun.write(`./${projectName}/trino/etc/catalog/iceberg.properties`, trinoIcebergCatalogFile['iceberg.properties'])
    },
    shell: async () => {
      return await execShell(`docker exec -it trino trino`)
    }
  }
}

// Superset
export const getSupersetConfig = (projectName: string): ToolConfig => {
  const supersetImage = 'apachesuperset.docker.scarf.sh/apache/superset:${TAG:-latest}'
  const supersetDependsOn = ['superset-db', 'superset-cache']
  const supersetVolumes = ['./superset/docker:/app/docker', `${SUPERSET_HOME_VOLUME_NAME}:/app/superset_home`]

  const dockerComposeObj = {
    'superset-cache': {
      image: 'redis:7',
      container_name: 'superset_cache',
      restart: 'unless-stopped',
      volumes: [`${SUPERSET_CACHE_VOLUME_NAME}:/data`],
      networks: [SHARED_NETWORK_NAME],
    },
    'superset-db': {
      env_file: 'superset/docker/.env',
      image: 'postgres:15',
      container_name: 'superset_db',
      restart: 'unless-stopped',
      volumes: [`${SUPERSET_DB_HOME_VOLUME_NAME}:/var/lib/postgresql/data`],
      networks: [SHARED_NETWORK_NAME],
    },
    superset: {
      env_file: 'superset/docker/.env',
      image: supersetImage,
      container_name: 'superset_app',
      command: ['/app/docker/docker-bootstrap.sh', 'app-gunicorn'],
      user: 'root',
      restart: 'unless-stopped',
      ports: ['8088:8088'],
      depends_on: supersetDependsOn,
      volumes: supersetVolumes,
      networks: [SHARED_NETWORK_NAME],
    },
    'superset-init': {
      image: supersetImage,
      container_name: 'superset_init',
      command: ['/app/docker/docker-init.sh'],
      env_file: 'superset/docker/.env',
      depends_on: supersetDependsOn,
      user: 'root',
      volumes: supersetVolumes,
      healthcheck: {
        disable: true,
      },
      networks: [SHARED_NETWORK_NAME],
    },
    'superset-worker': {
      image: supersetImage,
      container_name: 'superset_worker',
      command: ['/app/docker/docker-bootstrap.sh', 'worker'],
      env_file: 'superset/docker/.env',
      restart: 'unless-stopped',
      depends_on: supersetDependsOn,
      user: 'root',
      volumes: supersetVolumes,
      healthcheck: {
        test: ['CMD-SHELL', 'celery -A superset.tasks.celery_app:app inspect ping -d celery@$$HOSTNAME'],
      },
      networks: [SHARED_NETWORK_NAME],
    },
    'superset-worker-beat': {
      image: supersetImage,
      container_name: 'superset_worker_beat',
      command: ['/app/docker/docker-bootstrap.sh', 'beat'],
      env_file: 'superset/docker/.env',
      restart: 'unless-stopped',
      depends_on: supersetDependsOn,
      user: 'root',
      volumes: supersetVolumes,
      healthcheck: {
        disable: true,
      },
      networks: [SHARED_NETWORK_NAME],
    },
  }

  return {
    id: 'superset',
    name: 'Superset',
    desc: 'An open-source data exploration and visualization platform.',
    dockerComposeObj,
  }
}

// dagster-meltano connector
export const getDagsterMeltanoConfig = (projectName: string): ToolConfig => {
  return {
    id: 'dagster-meltano',
    name: 'Dagster-Meltano',
    desc: 'Dagster-Meltano connector.',
    version: DAGSTER_MELTANO_VERSION,
    install: async () => {
      return await execShell(`cd ${projectName} && poetry add dagster-meltano@${DAGSTER_MELTANO_VERSION}`)
    },
    postInit: async () => {
      // Add the connection code
      await Bun.write(`./${projectName}/${projectName}/dagster/${projectName}/${projectName}/meltano.py`, dagsterMeltanoMeltanoPy)
    },
  }
}

// dagster-dbt connector
export const getDagsterDbtConfig = (projectName: string): ToolConfig => {
  return {
    id: 'dagster-dbt',
    name: 'Dagster-DBT',
    desc: 'Dagster-DBT connector.',
    version: DAGSTER_DBT_VERSION,
    install: async () => {
      return await execShell(`cd ${projectName} && poetry add dagster-dbt@${DAGSTER_DBT_VERSION}`)
    },
    postInit: async () => {
      // Add the connection code
      await Bun.write(`./${projectName}/${projectName}/dagster/${projectName}/${projectName}/dbt_assets.py`, dagsterDbtDbtAssetsPy)
      await Bun.write(`./${projectName}/${projectName}/dagster/${projectName}/${projectName}/__init__.py`, dagsterDbtInitPy)
    },
  }
}