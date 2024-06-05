const sql = `{{
  config(
    file_format='iceberg',
    on_schema_change='sync_all_columns',
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='order_id',
    properties={
      "format": "'PARQUET'",
      "sorted_by": "ARRAY['order_id']",
    }
  )
}}
 
with source as (
  select
    CAST(id AS VARCHAR) AS order_id,
    CAST(created_at AS TIMESTAMP) AS order_created_at,
    CAST(qty AS DECIMAL) AS qty,
    CAST(product_id AS VARCHAR) AS product_id,
    CAST(customer_id AS VARCHAR) AS customer_id,
    CAST(store_id AS VARCHAR) AS store_id
  from {{ source('stg_iceberg', 'orders') }}
)
 
select * from source`

export default sql