import { $ } from 'bun'

async function main() {
  // Build
  const tempBuildFilePath = './temp/sidetrek'
  await $`npm version patch && bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildFilePath}`

  // Copy the release script
  await $`cp ./src/scripts/install.sh ${tempBuildFilePath}`

  // Tar
  const version = await $`cat package.json | jq -r '.version'`.text()
  console.log(`version=${version}`)
  const tarResp = await $`tar -czvf sidetrek.${version}.tar.gz ${tempBuildFilePath}`.text()
  console.log(tarResp)

  // Clean up
  // await $`rm -rf ${tempBuildFilePath}`.text()
  console.log('Done!')
}

main()