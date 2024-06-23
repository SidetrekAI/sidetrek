import { $ } from 'bun'

const cwd = process.cwd()
await Promise.all([
  // $`bun run build -- --watch`.cwd(`${cwd}/ui`),
  $`CUSTOM_ENV=development bun build --compile --sourcemap ./index.ts --outfile ./build/sidetrek --watch && rm -rf ./.*.bun-build`,
])
