# sidetrek-cli

## Commands
- init
  - selection
- dev
- ui
  - <TOOL_NAME> or selection
- deploy

## Iceberg stack
- Initialize the project
  - `poetry new`
  - Build project Dockerfile
- Set up each tool separately (dagster, dbt, meltano, minio, iceberg, trino, superset)
  - Initialize the project
  - Create a separate docker-compose file
  - Update Dockerfile
- Connect the tools
  - Add code for tool connections
- Add example code

