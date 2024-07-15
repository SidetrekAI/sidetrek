import chalk from 'chalk'
import isUnicodeSupported from 'is-unicode-supported'

export const SIDETREK_DIRNAME = '.sidetrek'
export const SIDETREK_CONFIG_FILENAME = 'sidetrek.config.yaml'
export const USERINFO_FILEPATH = `${SIDETREK_DIRNAME}/userinfo.json`

export const colors = {
  sidetrekPink: chalk.hex('#fd6795'),
  sidetrekYellow: chalk.hex('#ffcc5a'),
  sidetrekPurple: chalk.hex('#9c85fc'),
  sidetrekLightPurple: chalk.hex('#b9aee8'),
  lightGray: chalk.hex('#a1a1a1'),
}

export const SUPPORTED_PYTHON_VERSIONS = ['3.7', '3.8']
export const SUPPORTED_PYTHON_VERSIONS_STR = '3.10-3.11'
export const SUPPORTED_DOCKER_VERSIONS_STR = '>24'

const unicode = isUnicodeSupported()
const s = (c: string, fallback: string) => (unicode ? c : fallback)
export const S_BAR = s('│', '|')

export const DAGSTER_HOST_PORT = '3000'
export const DAGSTER_CONTAINER_PORT = '3000'
export const DAGSTER_VERSION = '^1.6.3'
export const MELTANO_VERSION = '2.19.1'
export const DBT_CORE_VERSION = '^1.7.13'
export const DBT_TRINO_VERSION = '^1.7.1'
export const DAGSTER_MELTANO_VERSION = '^1.5.4'
export const DAGSTER_DBT_VERSION = '^0.23.4'

export const SHARED_NETWORK_NAME = 'shared_network'
export const MINIO_SERVER_HOST_PORT = '9000'
export const MINIO_SERVER_CONTAINER_PORT = '9000'
export const MINIO_UI_HOST_PORT = '9001'
export const MINIO_UI_CONTAINER_PORT = '9001'
export const MINIO_VOLUME_NAME = 'minio_data'
export const MINIO_VOLUME = { [MINIO_VOLUME_NAME]: null }
export const ICEBERG_REST_HOST_PORT = '8181'
export const ICEBERG_REST_CONTAINER_PORT = '8181'
export const ICEBERG_PG_HOST_PORT = '5433' // so as not to conflict with superset
export const ICEBERG_PG_CONTAINER_PORT = '5432'
export const ICEBERG_PG_CATALOG_VOLUME_NAME = 'iceberg_pg_catalog_data'
export const ICEBERG_PG_CATALOG_VOLUME = { [ICEBERG_PG_CATALOG_VOLUME_NAME]: null }
export const TRINO_VERSION = '437'
export const TRINO_HOST_PORT = '8080'
export const TRINO_CONTAINER_PORT = '8080'
export const SUPERSET_HOST_PORT = '8088'
export const JUPYTERLAB_HOST_PORT = '8889'
export const JUPYTERLAB_CONTAINER_PORT = '8888'
export const JUPYTERLAB_CONTAINER_VOLUME_PATH = '/home/jovyan/work'
export const JUPYTERLAB_TOKEN = 'admin_secret'

export const S3_ENDPOINT = `http://minio:${MINIO_SERVER_HOST_PORT}`
export const AWS_REGION = 'us-west-2'
export const AWS_ACCESS_KEY_ID = 'admin'
export const AWS_SECRET_ACCESS_KEY = 'admin_secret'
export const LAKEHOUSE_NAME = 'lakehouse'
export const ICEBERG_CATALOG_NAME = 'icebergcatalog'
export const RAW_ICEBERG_TABLE_NAME = 'raw'

export const AWS_REGION_ENVNAME = 'AWS_REGION'
export const AWS_ACCESS_KEY_ID_ENVNAME = 'AWS_ACCESS_KEY_ID'
export const AWS_SECRET_ACCESS_KEY_ENVNAME = 'AWS_SECRET_ACCESS_KEY'
export const LAKEHOUSE_NAME_ENVNAME = 'LAKEHOUSE_NAME'
export const S3_ENDPOINT_ENVNAME = 'S3_ENDPOINT'
export const ICEBERG_CATALOG_NAME_ENVNAME = 'ICEBERG_CATALOG_NAME'
export const ICEBERG_PG_CATALOG_USER_ENVNAME = 'ICEBERG_PG_CATALOG_USER'
export const ICEBERG_PG_CATALOG_PASSWORD_ENVNAME = 'ICEBERG_PG_CATALOG_PASSWORD'
export const ICEBERG_PG_CATALOG_DB_ENVNAME = 'ICEBERG_PG_CATALOG_DB'
export const PROJECT_DIRNAME_ENVNAME = 'PROJECT_DIRNAME'
export const DAGSTER_HOME_ENVNAME = 'DAGSTER_HOME'
export const TRINO_USER_ENVNAME = 'TRINO_USER'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__URI_ENVNAME = 'PYICEBERG_CATALOG__ICEBERGCATALOG__URI'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__S3__REGION_ENVNAME = 'PYICEBERG_CATALOG__ICEBERGCATALOG__S3__REGION'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ENDPOINT_ENVNAME = 'PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ENDPOINT'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__PY_IO_IMPL_ENVNAME = 'PYICEBERG_CATALOG__ICEBERGCATALOG__PY_IO_IMPL'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ACCESS_KEY_ID_ENVNAME =
  'PYICEBERG_CATALOG__ICEBERGCATALOG__S3__ACCESS_KEY_ID'
export const PYICEBERG_CATALOG__ICEBERGCATALOG__S3__SECRET_ACCESS_KEY_ENVNAME =
  'PYICEBERG_CATALOG__ICEBERGCATALOG__S3__SECRET_ACCESS_KEY'
