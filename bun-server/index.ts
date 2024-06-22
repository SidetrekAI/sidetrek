import path from 'path'
import { $ } from 'bun'
import { watch } from 'fs'
import { handleDAGChange, handleModelChange } from './utils'
import YAML from 'yaml'
import { CWD, SIDETREK_CONFIG_FILENAME } from './constants'

const sidetrekConfigExists = await Bun.file(path.resolve(CWD, SIDETREK_CONFIG_FILENAME)).exists()
if (!sidetrekConfigExists) {
  throw new Error(`${SIDETREK_CONFIG_FILENAME} not found. Are you sure you're in the root of a Sidetrek project?`)
}

const sidetrekConfig = YAML.parse(await Bun.file(path.resolve(CWD, SIDETREK_CONFIG_FILENAME)).text())
const projectName = sidetrekConfig.metadata.project_name
console.log('projectName', projectName)

const dbtProjectDir = path.resolve(CWD, `${projectName}/dbt/${projectName}`)
const dbtModelsDir = path.resolve(dbtProjectDir, `models`)
console.log('dbtModelsDir', dbtModelsDir)

// DEPLOY NOTES!!!
// Make sure to include dbt, LibYAML, python, and bun in the Dockerfile

const server = Bun.serve({
  async fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      // Run `dbt run` on server start (which parses the dbt project and runs all the models)
      try {
        await $`dbt run --fail-fast`.cwd(dbtProjectDir)
        console.log('dbt run complete')
      } catch (error) {
        console.error(error)
      }

      return // do not return a Response
    }
    return new Response('Upgrade failed', { status: 500 })
  },
  websocket: {
    async open(ws) {}, // a socket is opened
    message(ws, message) {
      const watcher = watch(dbtModelsDir, { recursive: true }, async (event, filename) => {
        console.log(`Detected ${event} in ${filename}`)

        /**
         *
         * Handle DAG changes
         *
         */
        handleDAGChange({ ws, dbtProjectDir })

        /**
         *
         * Handle model changes
         *
         */
        // handleModelChange({ ws, dbtProjectDir, filepath })
      })
    }, // a message is received
    close(ws, code, message) {}, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
    // enable compression and decompression
    perMessageDeflate: true,
  }, // handlers
})

console.log(`Listening on ${server.hostname}:${server.port}`)
