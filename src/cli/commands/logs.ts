import * as p from '@clack/prompts'
import { colors } from '@cli/constants'
import type { ShellResponse, SidetrekConfigServices } from '@cli/types'
import { $ } from 'bun'
import * as R from 'ramda'
import YAML from 'yaml'

const cwd = process.cwd()

export default async function logs(service: string | undefined, options: any) {
  const logCmdOptions = R.compose(
    R.join(' '),
    R.map(([opt, val]: [string, any]) => {
      return typeof val == 'boolean' ? `--${opt}` : `--${opt} ${val}`
    }),
    R.toPairs
  )(options)

  if (!service) {
    console.log('\n')
    const s = p.spinner()

    const sidetrekConfigYamlJson = YAML.parse(await $`cat ./sidetrek.config.yml`.text())
    const services: SidetrekConfigServices = sidetrekConfigYamlJson.services
    const servicesWithLogs = R.compose(
      R.dissoc('dagster'), // exclude dagster as it's run separately and doesn't have logs cli command
      R.pickBy((svc) => 'port' in svc, services) as any
    )

    const serviceOptions = R.compose(
      R.map((svcName: string) => {
        const svc = services[svcName]
        return { label: svc.title, value: svcName as any }
      }),
      R.keys as any
    )(servicesWithLogs)

    await p.group({
      service: async () => {
        return await p.select({
          message: `Which service would you like to view the logs for?`,
          options: serviceOptions,
        })
      },
      runLogs: async ({ results }) => {
        const service = results.service as unknown as string
        await runLogsCommand(service, logCmdOptions)
      },
    })
  } else {
    await runLogsCommand(service, logCmdOptions)
  }
}

const runLogsCommand = async (service: string, options: string) => {
  console.log('service in logs command', service)
  console.log('options in logs command', options)

  if (service === 'superset') {
    // Superset runs separately from the other services
    await $`docker compose logs superset ${options}`.cwd(`${cwd}/superset`)
  } else {
    await $`docker compose logs ${service} ${options}`
  }
}
