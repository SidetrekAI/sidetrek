# Sidetrek CLI development

## Development

- Run `bun run dev` to watch for changes
- Run `./build/sidetrek <command>` to test out the changes
- NOTE: use the name `test_proj*` for testing the CLI - it's added to .gitignore

### To test tracking
Inside sidetrek-cli-tracking repo:
- Run `docker compose up` to start the tracking DB
- Run the dev server
- (Optional) Run the migration if required

## Release

- Run `bun run release` to test things locally before release
- Run `bun run prod-release` to create a release for production

## Commands

- Run `sidetrek --help` to see all available commands and options

## Demo

- Start recording: `asciinema rec demo.cast`
- Stop recording: `ctrl + d`
- Replay in terminal: `asciinema play demo.cast`
- Convert to gif: `agg --font-family Hack --no-loop demo.cast demo.gif`

## Gotchas

- rest-iceberg cannot access minio (`UNKNOWN_HOST error: lakehouse.minio`) due to awd sdk default changes to path-style-access
  - Solution: In minio docker-compose service, set `MINIO_DOMAIN=minio` and add network alias `'${LAKEHOUSE_NAME}.minio'`