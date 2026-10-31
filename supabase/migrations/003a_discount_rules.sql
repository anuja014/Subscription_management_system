-- 003a_discount_rules.sql
-- Discount helper function used by run_billing()
-- Owner: Member 2 (Pricing)
-- Run AFTER 001_schema.sql and 002_rls.sql

-- Returns all valid discounts applicable to a subscription on a given date.
-- Signature: valid_discounts_for(subscription_id uuid, check_date date) returns setof discounts
create or replace function valid_discounts_for(p_subscription_id uuid, p_check_date date)
returns setof discounts
language plpgsql
stable
as $$
declare
  v_sub_total numeric(12,2);
  v_sub_qty int;
begin
  -- Get subscription total and quantity for min checks
  select coalesce(sum(amount),0), coalesce(sum(quantity),0)
  into v_sub_total, v_sub_qty
  from subscription_lines where subscription_id = p_subscription_id;

  return query
  select d.*
  from discounts d
  where d.is_active = true
    and d.start_date <= p_check_date
    and d.end_date >= p_check_date
    and (d.usage_limit is null or d.times_used < d.usage_limit)
    and (d.applies_to = 'subscription' or
         exists (select 1 from discount_products dp
                 join subscription_lines sl on sl.product_id = dp.product_id
                 where dp.discount_id = d.id and sl.subscription_id = p_subscription_id))
    and (d.min_purchase is null or d.min_purchase = 0 or v_sub_total >= d.min_purchase)
    and (d.min_quantity is null or d.min_quantity = 0 or v_sub_qty >= d.min_quantity);
end;
$$;
