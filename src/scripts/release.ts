import { $ } from 'bun'

async function main() {
  // Build
  const tempBuildFilePath = './temp/sidetrek'
  await $`npm version patch && bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildFilePath}`
  console.log('Packaged built successfully.')

  const version = await $`cat package.json | jq -r '.version'`.text()
  console.log(`version=${version}`)

  // Copy the release script
  await $`cp ./src/scripts/install.sh ${tempBuildFilePath}`
  console.log('Copied release script.')

  // Tar
  const tarResp = await $`tar -czvf sidetrek.${version}.tar.gz ${tempBuildFilePath}`.text()
  console.log(tarResp)
  console.log('Tar created successfully.')

  // Clean up
  // await $`rm -rf ${tempBuildFilePath}`.text()
  console.log('Done!')
}

main()