import path from 'path'

export const TEST_PROJECT_NAME = 'test_proj'
export const CWD = process.env.CUSTOM_ENV === 'development' ? path.resolve(process.cwd(), `../${TEST_PROJECT_NAME}`) : process.cwd()
export const SIDETREK_DIRNAME = '.sidetrek'
export const SIDETREK_CONFIG_FILENAME = 'sidetrek.config.yaml'