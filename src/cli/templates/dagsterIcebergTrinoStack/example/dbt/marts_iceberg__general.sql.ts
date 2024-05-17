const sql = `{{
  config(
    file_format='iceberg',
    on_schema_change='sync_all_columns',
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    properties={
      "format": "'PARQUET'",
      "partitioning": "ARRAY['traffic_source']"
    }
  )
}}
 
with final as (
  select * from {{ ref('int_iceberg__denormalized_orders') }}
)
 
select *
from final`

export default sql