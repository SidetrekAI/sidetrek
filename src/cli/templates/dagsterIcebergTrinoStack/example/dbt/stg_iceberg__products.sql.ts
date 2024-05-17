const sql =`{{
  config(
    file_format='iceberg',
    on_schema_change='sync_all_columns',
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='id',
    properties={
      "format": "'PARQUET'",
      "partitioning": "ARRAY['category']",
      "sorted_by": "ARRAY['id']",
    }
  )
}}
 
with source as (
  select
    CAST(id AS VARCHAR) AS id,
    CAST(name AS VARCHAR) AS name,
    CAST(category AS VARCHAR) AS category,
    CAST(price AS DECIMAL(10,2)) AS price,
    CAST(description AS VARCHAR) AS description,
    CAST(unit_shipping_cost AS DECIMAL(4, 2)) AS unit_shipping_cost
  from {{ source('stg_iceberg', 'products') }}
)
 
select * from source`

export default sql