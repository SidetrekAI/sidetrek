const sql = `{{
  config(
    file_format='iceberg',
    on_schema_change='sync_all_columns',
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='id',
    properties={
      "format": "'PARQUET'",
      "partitioning": "ARRAY['state']",
      "sorted_by": "ARRAY['id']",
    }
  )
}}
 
with source as (
  select
    CAST(id AS VARCHAR) AS id,
    CAST(name AS VARCHAR) AS name,
    CAST(city AS VARCHAR) AS city,
    CAST(state AS VARCHAR) AS state,
    CAST(tax_rate AS DECIMAL(10, 8)) AS tax_rate
  from {{ source('stg_iceberg', 'stores') }}
)
 
select * from source`

export default sql