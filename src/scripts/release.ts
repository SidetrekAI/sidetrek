import { $ } from 'bun'

async function main() {
  try {
    // Build
    const tempBuildFilePath = './temp/sidetrek'
    await $`npm version patch && bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildFilePath}`
    console.log('Packaged built successfully.')
  } catch (error) {
    console.error('Error building package:', error)
  }

  try {
    const version = await $`cat package.json | jq -r '.version'`.text()

    // Copy the release script
    await $`cp ./src/scripts/install.sh ${tempBuildFilePath}`
    console.log('Copied release script.')

    // Tar
    await $`tar -czvf sidetrek.${version}.tar.gz ${tempBuildFilePath}`
    console.log('Tar created successfully.')
  } catch (error) {
    console.error('Error creating tar:', error)
  }

  // Clean up
  // await $`rm -rf ${tempBuildFilePath}`.text()
  console.log('Done!')
}

main()
