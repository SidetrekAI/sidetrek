import * as p from '@clack/prompts'
import { $} from 'bun'

export default async function logs(service: string | undefined, options: any) {
  const { follow, since } = options
  
  // console.log('\n')
  // const s = p.spinner()

  // // TODO: need to find out the services for this user - create sidetrek.yaml
  // const serviceOptions = [
  //   { value: 'dagster', label: 'Dagster' },
  //   { value: 'trino', label: 'Trino' },
  //   { value: 'dagster', label: 'Dagster' },
  //   { value: 'dagster', label: 'Dagster' },
  //   { value: 'dagster', label: 'Dagster' },
  // ]

  // await p.group(
  //   {
  //     service: async () => {
  //       return await p.select({
  //         message: `Which service would you like to view the logs for?`,
  //         options: serviceOptions,
  //       })
  //     },
  //   }
  // )
  // // REMEMBER that Superset is running separately
  // const cwd = service === 'superset' ? process.cwd() + '/superset' : process.cwd()
  // $`docker-compose logs ${service}`.cwd(cwd)
}
