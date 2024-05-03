import { $ } from 'bun'
import { parseArgs } from 'util'
import { getPackageVersion } from '../cli/utils'

// bun run args
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    production: {
      type: 'boolean',
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
})
const { production } = values
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
  try {
    // Build
    await $`bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildDirPath}/sidetrek`
    console.log('Packaged built successfully.')
  } catch (err) {
    console.error('Error building package')
    handleError(err)
  }
}

const runGithubRelease = async () => {
  
}

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
