import { $ } from 'bun'
import { create as createTar } from 'tar'

const tempBuildDirPath = './temp/sidetrek'
const cwd = process.cwd()

const build = async () => {
  try {
    // Build
    // await $`npm version patch && bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildFilePath}`
    await $`bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildDirPath}/sidetrek`
    console.log('Packaged built successfully.')
  } catch (error) {
    console.error('Error building package:', error)
  }
}

const getPackageVersion = async () => {
  const file = Bun.file(`${cwd}/package.json`)
  const contents = await file.json()
  return contents.version
}

const tar = async () => {
  try {
    const version = await getPackageVersion()

    // Copy the release script
    await $`cp ./src/scripts/install.sh ${tempBuildDirPath}/install.sh`
    console.log('Copied release script.')

    // Tar
    await createTar({ gzip: true, file: `sidetrek.${version}.tar.gz` }, [tempBuildDirPath])
    console.log('Tar created successfully.')
  } catch (error) {
    console.error('Error creating tar:', error)
  }
}

async function main() {
  await $`mkdir -p ./temp/sidetrek`

  await build()
  await tar()

  // Clean up
  // await $`rm -rf ${tempBuildDirPath}`.text()
  console.log('Done!')
}

main()
