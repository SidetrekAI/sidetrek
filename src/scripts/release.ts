import { $ } from 'bun'

async function main() {
  const tempBuildFilePath = './temp/sidetrek'
  await $`npm version patch && bun build ./index.ts --compile --minify --sourcemap --outfile ${tempBuildFilePath}`.text()
  
  const version = await $`cat package.json | jq -r '.version'`.text()
  const tarResp = await $`tar -czvf sidetrek.${version}.tar.gz ${tempBuildFilePath}`.text()
  console.log(tarResp)

  // Clean up
  await $`rm -rf ${tempBuildFilePath}`.text()
  console.log('Done!')
}

main()