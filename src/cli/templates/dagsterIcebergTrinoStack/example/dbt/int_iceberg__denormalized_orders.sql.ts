const sql = `{{
  config(
    file_format='iceberg',
    materialized='incremental',
    on_schema_change='sync_all_columns',
    unique_key='order_id',
    incremental_strategy='merge',
    properties={
    "format": "'PARQUET'",
    "sorted_by": "ARRAY['order_id']",
    "partitioning": "ARRAY['device_type']",
    }
  )
}}
  
with denormalized_data as (
  select
    o.order_id,
    o.order_created_at,
    o.qty,
    o.product_id,
    o.customer_id,
    o.store_id,
    c.acc_created_at,
    c.first_name,
    c.last_name,
    --  Concatenated columns
    CONCAT(c.first_name, ' ', c.last_name) as full_name,
    c.gender,
    c.country,
    c.address,
    c.phone,
    c.email,
    c.payment_method,
    c.traffic_source,
    c.referrer,
    c.customer_age,
    c.device_type,
    p.name as product_name,
    p.category as product_category,
    (p.price/100) as product_price,
    p.description as product_description,
    p.unit_shipping_cost,
    s.name as store_name,
    s.city as store_city,
    s.state as store_state,
    s.tax_rate,
    -- Calculated columns
    (p.price/100) * o.qty as total_product_price,
    ((p.price/100) * o.qty) + p.unit_shipping_cost as total_price_with_shipping,
    (((p.price/100) * o.qty) + p.unit_shipping_cost) * (1 + s.tax_rate) as total_price_with_tax
  from {{ ref('stg_iceberg__orders') }} o
  left join {{ ref('stg_iceberg__customers') }} c
    on o.customer_id = c.id
  left join {{ ref('stg_iceberg__products') }} p
    on o.product_id = p.id
  left join {{ ref('stg_iceberg__stores') }} s
    on o.store_id = s.id
)
   
select *
from denormalized_data`

export default sql