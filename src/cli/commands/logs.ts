import * as p from '@clack/prompts'
import type { SidetrekConfigServices } from '@cli/types'
import { $ } from 'bun'
import * as R from 'ramda'
import YAML from 'yaml'
import { getProjectName, getSidetrekHome } from '@cli/utils'

const sidetrekHome = getSidetrekHome()

export default async function logs(service: string | undefined, options: any) {
  const logCmdOptions = R.isEmpty(options)
    ? ''
    : R.compose(
        R.join(' '),
        R.map(([opt, val]: [string, any]) => {
          return typeof val == 'boolean' ? `--${opt}` : `--${opt} ${val}`
        }),
        R.toPairs
      )(options)

  if (!service) {
    console.log('\n')
    const s = p.spinner()

    const sidetrekConfigYamlJson = YAML.parse(await $`cat ./sidetrek.config.yaml`.text())
    const services: SidetrekConfigServices = sidetrekConfigYamlJson.services
    const servicesWithLogs = R.compose(
      R.map(([svc, svcObj]) => svc) as any,
      R.filter(([svc, svcObj]) => svcObj.logs === true),
      R.toPairs as any
    )(services) as string[]

    if (R.isEmpty(servicesWithLogs)) {
      p.cancel('No services have logs enabled.')
      process.exit(0)
    }

    const serviceOptions = servicesWithLogs.map((svcName: string) => {
      const svc = services[svcName]
      return { label: svc.title, value: svcName as any }
    })

    await p.group({
      service: async () => {
        return await p.select({
          message: `Which service would you like to view the logs for?`,
          options: serviceOptions,
        })
      },
      runLogs: async ({ results }) => {
        const _service = results.service as unknown as string
        await runLogsCommand(_service, logCmdOptions)
      },
    })
  } else {
    await runLogsCommand(service, logCmdOptions)
  }
}

const runLogsCommand = async (service: string, options: string) => {
  try {
    if (service === 'superset') {
      // Superset runs separately from the other services
      const cmd = `docker compose logs superset ${options}`
      await $`${{ raw: cmd }}`.cwd(`${sidetrekHome}/superset`)
    } else {
      const cmd = `docker compose logs ${service} ${options}`
      await $`${{ raw: cmd }}`
    }
  } catch (err) {
    // Silently exit since docker will print the error
  }
}
