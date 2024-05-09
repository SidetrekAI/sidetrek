# sidetrek-cli

## Development

- Run `bun run dev` to watch for changes
- Run `./build/sidetrek <command>` to test out the changes
- NOTE: use the name `test_proj*` for testing the CLI - it's added to .gitignore

## Release

- Run `bun run release` to test things locally before release
- Run `bun run prod-release` to create a release for production

## Commands

- Run `sidetrek --help` to see all available commands and options

## Gotchas
- Port conflicts between trino (8080) and superset websocket
  - Solution: change trino host port to 8081
- rest-iceberg cannot access minio (`UNKNOWN_HOST error: lakehouse.minio`) due to awd sdk default changes to path-style-access
  - Solution: In minio docker-compose service, set `MINIO_DOMAIN=minio` and add network alias `'${LAKEHOUSE_NAME}.minio'`
