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

- Run `bun run release` to create release files in the local /release dir (it creates it from the local project dir)
- Create a PR and merge the latest changes to `dev` and then to `main`
- Go to Github Releases to create a new release with the same version and upload the generated executables in /release

When the user downloads the CLI from `curl` (`curl -fsSL https://sidetrek.com/cli | bash`), it automatically detects the latest version and downloads/installs them.

- NOTE: The `curl` command downloads the latest version excluding pre-releases

## Commands

- Run `sidetrek --help` to see all available commands and options

## Demo

- Open the Warp terminal and set the correct Zoom
- Record with quicktime (shift + cmd + 5)
- Go to veed.io and edit -> then 2x the video
- Convert the resulting mp4 to webp

## Gotchas

- rest-iceberg cannot access minio (`UNKNOWN_HOST error: lakehouse.minio`) due to awd sdk default changes to path-style-access
  - Solution: In minio docker-compose service, set `MINIO_DOMAIN=minio` and add network alias `'${LAKEHOUSE_NAME}.minio'`
