import { $ } from 'bun'
import { parseArgs } from 'util'
import { getPackageVersion } from '../cli/utils'

const cwd = process.cwd()

type Arch = 'linux-x64' | 'linux-arm64' | 'windows-x64' | 'darwin-x64' | 'darwin-arm64'

// bun run args
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    arch: {
      type: 'string',
      required: true,
    },
    production: {
      type: 'boolean',
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
})

const arch = values.arch as Arch
const production = values.production

console.log('Is production release:', production)

const tempBuildDirPath = './temp/sidetrek'

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

const build = async () => {
  if (!arch) {
    console.error('--arch is required')
    process.exit(1)
  }

  try {
    const archToBunTarget = {
      'linux-x64': 'bun-linux-x64',
      'linux-arm64': 'bun-linux-arm64',
      'windows-x64': 'bun-windows-x64',
      'darwin-x64': 'bun-darwin-x64',
      'darwin-arm64': 'bun-darwin-arm64',
    }
    const target = archToBunTarget[arch]

    if (!target) {
      console.error('Invalid --arch: please use one of linux-x64, linux-arm64, windows-x64, darwin-x64, darwin-arm64')
      process.exit(1)
    }

    // Build
    await $`bun build ./index.ts --compile --minify --sourcemap --target=${target} --outfile ${tempBuildDirPath}/sidetrek`.cwd(cwd)
    console.log('Packaged built successfully.')
  } catch (err) {
    console.error('Error building package')
    handleError(err)
  }
}

const runGithubRelease = async () => {}

const tar = async () => {
  try {
    const version = await getPackageVersion()

    // Copy the release script
    await $`cp ./src/scripts/install.sh ${tempBuildDirPath}/install.sh`
    console.log('Copied release script.')

    // Tar
    await $`tar -czvf ./release/sidetrek.${version}.tar.gz -C ${tempBuildDirPath} .`
    console.log('Tar created successfully.')
  } catch (err) {
    console.error('Error creating tar')
    handleError(err)
  }
}

async function main() {
  await createDirs()
  await incrementVersion()
  await build()
  await tar()

  if (production) {
    await runGithubRelease()
  }

  // Clean up
  await $`rm -rf ${tempBuildDirPath}`
  console.log('Done!')
}

await main()
