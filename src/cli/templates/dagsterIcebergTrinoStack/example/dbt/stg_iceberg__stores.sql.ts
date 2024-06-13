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
  select *, row_number() over (partition by id order by id desc) as row_num
  from {{ source('stg_iceberg', 'stores') }}
),

deduped_and_renamed as (
  select
    CAST(id AS VARCHAR) AS id,
    CAST(name AS VARCHAR) AS name,
    CAST(city AS VARCHAR) AS city,
    CAST(state AS VARCHAR) AS state,
    CAST(tax_rate AS DECIMAL(10, 8)) AS tax_rate
  from source
  where row_num = 1
)
 
select * from deduped_and_renamed`

export default sql