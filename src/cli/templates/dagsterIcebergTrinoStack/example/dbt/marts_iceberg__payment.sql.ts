const sql = `{{
  config(
    file_format='iceberg',
    on_schema_change='sync_all_columns',
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    properties={
      "format": "'PARQUET'",
      "partitioning": "ARRAY['payment_method']"
    }
  )
}}
 
with final as (
  select
    order_id,
    order_created_at,
    product_id,
    qty,
    unit_shipping_cost,
    tax_rate,
    total_price_with_shipping,
    total_price_with_tax,
    product_price,
    total_product_price,
    payment_method
  from {{ ref('int_iceberg__denormalized_orders') }}
)
 
select *
from final`

export default sql