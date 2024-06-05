const yamlContent = `version: 1
default_environment: dev
project_id: 88b4347e-06a3-4b77-98cf-e800e3f7a37f
environments:
  - name: dev
  - name: staging
  - name: prod
plugins:
  extractors:
    - name: tap-csv
      variant: meltanolabs
      pip_url: git+https://github.com/MeltanoLabs/tap-csv.git
      config:
        csv_files_definition: extract/csv_files_def.json
  loaders:
    - name: target-iceberg
      namespace: target_iceberg
      pip_url: git+https://github.com/SidetrekAI/target-iceberg@bugfix/nested-dictionary-issues
      executable: target-iceberg
      config:
        add_record_metadata: true
        aws_access_key_id: $AWS_ACCESS_KEY_ID
        aws_secret_access_key: $AWS_SECRET_ACCESS_KEY
        s3_endpoint: http://localhost:9000
        s3_bucket: lakehouse
        iceberg_rest_uri: http://localhost:8181
        iceberg_catalog_name: icebergcatalog
        iceberg_catalog_namespace_name: raw
`

export default yamlContent