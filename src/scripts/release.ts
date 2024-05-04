import { $ } from 'bun'
import { parseArgs } from 'util'
import { getPackageVersion } from '../cli/utils'

const cwd = process.cwd()

// bun run args
const { values: options, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    arch: {
      type: 'string',
    },
    production: {
      type: 'boolean',
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
})

const availableArchs = ['linux-x64', 'linux-arm64', 'windows-x64', 'darwin-x64', 'darwin-arm64'] as const
type Arch = (typeof availableArchs)[number]
const archOption = options.arch as Arch | undefined

const productionOption = options.production as boolean
const version = await getPackageVersion()
const tempBuildDirPath = './temp/sidetrek'

console.log('Is production release:', productionOption)

const handleError = (err: any) => {
  console.log(`Failed with code ${err.exitCode}`)
  console.log(err.stdout.toString())
  console.log(err.stderr.toString())
  process.exit(err.exitCode)
}

const createDirs = async () => {
  try {
    // Create temp build dir - will be cleaned up after
    await $`mkdir -p ${tempBuildDirPath}`

    // Create release dir
    await $`mkdir -p ./release`
  } catch (err) {
    console.error('Error creating temp build dir')
    handleError(err)
  }
}

const incrementVersion = async () => {
  try {
    // Increment version
    await $`npm version patch`
  } catch (err) {
    console.error('Error incrementing the version')
    handleError(err)
  }
}

const build = async (arch: Arch) => {
  const target = `bun-${arch}`

  if (!target) {
    console.error('Invalid --arch: please use one of linux-x64, linux-arm64, windows-x64, darwin-x64, darwin-arm64')
    process.exit(1)
  }

  try {
    // Build
    await $`bun build ./index.ts --compile --minify --sourcemap --target=${target} --outfile ${tempBuildDirPath}/${version}-${arch}/sidetrek`.cwd(
      cwd
    )
    console.log('Packaged built successfully.')
  } catch (err) {
    console.error('Error building package')
    handleError(err)
  }
}

const runGithubRelease = async () => {}

const tar = async (arch: Arch) => {
  try {
    // Copy the release script
    await $`cp ./src/scripts/install.sh ${tempBuildDirPath}/${version}-${arch}/install.sh`
    console.log('Copied release script.')

    // Tar
    await $`tar -czvf ./release/sidetrek.${version}-${arch}.tar.gz -C ${tempBuildDirPath}/${version}-${arch} .`
    console.log('Tar created successfully.')
  } catch (err) {
    console.error('Error creating tar')
    handleError(err)
  }
}

const buildAndTar = async (arch: Arch) => {
  await build(arch)
  await tar(arch)
}

async function main() {
  await createDirs()
  // await incrementVersion()

  const archsToRelease = archOption ? [archOption] : availableArchs
  const promises = archsToRelease.map((_arch) => buildAndTar(_arch))
  await Promise.all(promises)

  if (productionOption) {
    await runGithubRelease()
  }

  // Clean up
  await $`rm -rf ${tempBuildDirPath}`
  console.log('Done!')
}

await main()
