-- 003_billing.sql
-- Billing engine: run_billing() RPC, number sequences, status triggers
-- Owner: Member 3 (Subscriptions & Invoicing)
-- Run AFTER 001_schema.sql, 002_rls.sql, 003a_discount_rules.sql

-- ============================================================
-- Auto number for subscriptions
-- ============================================================
create or replace function generate_subscription_number()
returns text language plpgsql as $$
declare
  n int;
begin
  select nextval('subscription_number_seq') into n;
  return 'SUB-' || lpad(n::text, 4, '0');
end;
$$;

-- ============================================================
-- Auto number for invoices
-- ============================================================
create or replace function generate_invoice_number()
returns text language plpgsql as $$
declare
  n int;
begin
  select nextval('invoice_number_seq') into n;
  return 'INV-' || lpad(n::text, 4, '0');
end;
$$;

-- ============================================================
-- Status transition validation for subscriptions
-- Allowed: draft->quotation->confirmed->active->closed
-- ============================================================
create or replace function validate_subscription_transition()
returns trigger language plpgsql as $$
declare
  allowed text[];
begin
  if tg_op = 'UPDATE' then
    allowed := case old.status
      when 'draft' then array['quotation','draft']
      when 'quotation' then array['confirmed','quotation']
      when 'confirmed' then array['active','closed','confirmed']
      when 'active' then array['closed','active']
      when 'closed' then array['closed']
      else array[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'Invalid subscription status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_subscription_transition
before update of status on subscriptions
for each row
execute function validate_subscription_transition();

-- ============================================================
-- run_billing() RPC
-- Idempotent, set-based. Creates draft invoices for active
-- subscriptions whose next_billing_date <= today.
-- ============================================================
create or replace function run_billing(p_run_date date default current_date)
returns json language plpgsql as $$
declare
  v_created int := 0;
  v_skipped int := 0;
  v_errors text := '';
begin
  -- 1. Create invoices for subscriptions due (set-based, idempotent)
  with due_subs as (
    select s.id as sub_id, s.customer_id, s.plan_id, s.discount_id,
           p.billing_period, p.price as plan_price,
           s.next_billing_date as period_start,
           case p.billing_period
             when 'daily' then (s.next_billing_date + interval '1 day')::date
             when 'weekly' then (s.next_billing_date + interval '1 week')::date
             when 'monthly' then (s.next_billing_date + interval '1 month')::date
             when 'yearly' then (s.next_billing_date + interval '1 year')::date
           end as period_end,
           case p.billing_period
             when 'daily' then (s.next_billing_date + interval '1 day')::date
             when 'weekly' then (s.next_billing_date + interval '1 week')::date
             when 'monthly' then (s.next_billing_date + interval '1 month')::date
             when 'yearly' then (s.next_billing_date + interval '1 year')::date
           end as next_billing
    from subscriptions s
    join plans p on p.id = s.plan_id
    where s.status = 'active'
      and s.next_billing_date <= p_run_date
  ),
  inserted_invoices as (
    insert into invoices (number, subscription_id, customer_id, period_start, period_end,
                          status, issue_date, due_date, subtotal, discount_total, tax_total, total, amount_paid)
    select
      generate_invoice_number(),
      d.sub_id, d.customer_id, d.period_start, d.period_end,
      'draft', p_run_date,
      (d.period_start + interval '15 days')::date,
      0, 0, 0, 0, 0
    from due_subs d
    on conflict (subscription_id, period_start) do nothing
    returning id, sub_id
  )
  select count(*) into v_created from inserted_invoices;

  -- 2. Copy subscription lines into invoice lines with tax
  insert into invoice_lines (invoice_id, description, quantity, unit_price, tax_amount, amount)
    select ii.id, p.name || coalesce(' - ' || pv.value, ''),
           sl.quantity, sl.unit_price,
           round((sl.unit_price * sl.quantity) * coalesce(t.rate, 0) / 100, 2)::numeric(12,2),
           sl.amount
    from inserted_invoices ii
    join subscription_lines sl on sl.subscription_id = ii.sub_id
    join products p on p.id = sl.product_id
    left join product_variants pv on pv.id = sl.variant_id
    left join product_taxes pt on pt.product_id = p.id
    left join taxes t on t.id = pt.tax_id and t.is_active = true;

  -- 3. Recompute invoice totals from lines
  update invoices i
  set subtotal = coalesce(l.subtotal, 0),
      tax_total = coalesce(l.tax_sum, 0),
      total = coalesce(l.subtotal, 0) + coalesce(l.tax_sum, 0)
  from (
    select invoice_id,
           sum(amount) as subtotal,
           sum(tax_amount) as tax_sum
    from invoice_lines
    group by invoice_id
  ) l where i.id = l.invoice_id;

  -- 4. Apply discounts (percentage to subtotal, fixed off total, never below zero)
  update invoices i
  set discount_total = case d.type
                         when 'percentage' then round(i.subtotal * d.value / 100, 2)
                         when 'fixed' then least(d.value, i.subtotal + coalesce(i.tax_total,0))
                       end,
      total = greatest(
        i.subtotal + coalesce(i.tax_total,0) -
        case d.type
          when 'percentage' then round(i.subtotal * d.value / 100, 2)
          when 'fixed' then least(d.value, i.subtotal + coalesce(i.tax_total,0))
        end, 0)
  from inserted_invoices ii
  join valid_discounts_for(ii.sub_id, p_run_date) d on true
  where i.id = ii.id;

  -- 5. Advance next_billing_date
  update subscriptions s
  set next_billing_date = d.next_billing
  from due_subs d
  where s.id = d.sub_id;

  -- 6. Close auto-close plans whose end date passed
  update subscriptions s
  set status = 'closed'
  from plans p
  where s.plan_id = p.id
    and p.auto_close = true
    and p.available_to is not null
    and p.available_to < p_run_date
    and s.status = 'active';

  -- 7. Increment times_used for discounts used
  update discounts d
  set times_used = d.times_used + 1
  from inserted_invoices ii
  where d.id = ii.discount_id;

  -- Build result
  select count(*) into v_skipped from due_subs
  where not exists (select 1 from inserted_invoices ii where ii.sub_id = due_subs.sub_id);

  return json_build_object(
    'created', v_created,
    'skipped', v_skipped,
    'errors', v_errors,
    'run_date', p_run_date
  );
end;
$$;

-- Grant execute on the RPC to authenticated users
grant execute on function run_billing(date) to authenticated;
