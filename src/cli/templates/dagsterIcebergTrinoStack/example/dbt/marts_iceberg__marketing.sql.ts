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
  select
    order_id,
    order_created_at,
    qty,
    product_id,
    customer_id,
    store_id,
    traffic_source,
    referrer,
    product_name,
    product_category,
    product_description,
    unit_shipping_cost,
    store_name,
    store_city,
    store_state,
    tax_rate,
    total_price_with_shipping,
    total_price_with_tax,
    product_price,
    total_product_price
  from {{ ref('int_iceberg__denormalized_orders') }}
)
 
select *
from final`

export default sql