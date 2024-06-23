import { $ } from 'bun'

const cwd = process.cwd()

// Need to build the UI first since /dist assets are imported in the CLI index.ts
// await $`bun run build`.cwd(`${cwd}/ui`)
await $`bun build --compile --sourcemap ./index.ts --outfile ./build/sidetrek`