-- 004_seed.sql
-- Demo seed data
-- Run AFTER 001_schema.sql, 002_rls.sql, 003a_discount_rules.sql, 003_billing.sql
-- PREREQUISITE: Create these 3 users in Supabase Authentication first:
--   admin@brightloop.test
--   staff@brightloop.test
--   customer@brightloop.test
-- WARNING: This inserts seed data. Do not run on production.

-- ============================================================
-- Staff profiles (link to existing auth.users by email)
-- ============================================================
DO $$
DECLARE
    v_admin_id uuid;
    v_staff_id uuid;
    v_customer_id uuid;
BEGIN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@brightloop.test';
    SELECT id INTO v_staff_id FROM auth.users WHERE email = 'staff@brightloop.test';
    SELECT id INTO v_customer_id FROM auth.users WHERE email = 'customer@brightloop.test';

    IF v_admin_id IS NOT NULL THEN
        INSERT INTO profiles (id, full_name, email, role, phone)
        VALUES (v_admin_id, 'Admin User', 'admin@brightloop.test', 'admin', '+1-555-0100')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone;
    END IF;

    IF v_staff_id IS NOT NULL THEN
        INSERT INTO profiles (id, full_name, email, role, phone)
        VALUES (v_staff_id, 'Staff Rep', 'staff@brightloop.test', 'staff', '+1-555-0101')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone;
    END IF;

    IF v_customer_id IS NOT NULL THEN
        INSERT INTO profiles (id, full_name, email, role, phone)
        VALUES (v_customer_id, 'Customer One', 'customer@brightloop.test', 'customer', '+1-555-0102')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone;
    END IF;
END $$;

-- ============================================================
-- Customers
-- ============================================================
insert into customers (id, profile_id, name, email, company, address, tax_id)
values
  (gen_random_uuid(), (select id from profiles where email = 'customer@brightloop.test' limit 1), 'Customer One','customer@brightloop.test','Acme Corp','123 Main St','TAX-001'),
  (gen_random_uuid(), null,'Beta Logistics','ops@beta.test','Beta Logistics','456 Oak Ave','TAX-002'),
  (gen_random_uuid(), null,'Gamma Design','hello@gamma.test','Gamma Design','789 Pine Rd','TAX-003'),
  (gen_random_uuid(), null,'Delta Retail','billing@delta.test','Delta Retail','321 Elm St','TAX-004'),
  (gen_random_uuid(), null,'Epsilon Services','pay@epsilon.test','Epsilon Services','654 Maple Dr','TAX-005');

-- ============================================================
-- Products
-- ============================================================
insert into products (id, name, type, sales_price, cost_price, notes, is_active)
values
  (gen_random_uuid(),'Odoo ERP Core','software',1200,400,'Core ERP module',true),
  (gen_random_uuid(),'CRM Module','addon',560,150,'Customer relationship module',true),
  (gen_random_uuid(),'Implementation','service',1500,600,'One-time setup',true),
  (gen_random_uuid(),'Support Plan','service',200,50,'Annual support',true),
  (gen_random_uuid(),'Hosting','addon',300,100,'Cloud hosting',true)
on conflict (id) do nothing;

-- Product variants (e.g. Odoo +560)
insert into product_variants (product_id, attribute, value, extra_price)
select p.id, 'Brand', 'Odoo', 560 from products p where p.name = 'Odoo ERP Core'
on conflict do nothing;

-- ============================================================
-- Plans
-- ============================================================
insert into plans (id, name, price, billing_period, min_quantity, available_from, available_to,
                   auto_close, allow_early_close, allow_pause, allow_renew, is_active)
values
  (gen_random_uuid(),'Starter Monthly',99,'monthly',1,current_date, null,false,true,true,true,true),
  (gen_random_uuid(),'Professional Monthly',299,'monthly',1,current_date, null,false,true,true,true,true),
  (gen_random_uuid(),'Enterprise Yearly',2999,'yearly',1,current_date, (current_date + interval '1 year')::date,true,true,true,true,true)
on conflict (id) do nothing;

-- ============================================================
-- Taxes
-- ============================================================
insert into taxes (id, name, type, rate, is_active)
values
  (gen_random_uuid(),'VAT 20%','percentage',20,true),
  (gen_random_uuid(),'GST 18%','percentage',18,true),
  (gen_random_uuid(),'Flat $50','fixed',50,true)
on conflict (id) do nothing;

-- Link taxes to products
insert into product_taxes (product_id, tax_id)
select p.id, t.id from products p cross join taxes t where t.name = 'VAT 20%'
on conflict do nothing;

-- ============================================================
-- Discounts
-- ============================================================
insert into discounts (id, name, type, value, min_purchase, min_quantity, start_date, end_date,
                       usage_limit, times_used, applies_to, is_active)
values
  (gen_random_uuid(),'Launch 10%','percentage',10,0,1,current_date, (current_date + interval '6 months')::date,
   100,0,'subscription',true),
  (gen_random_uuid(),'Fixed $100 off','fixed',100,500,1,current_date, (current_date + interval '6 months')::date,
   50,0,'subscription',true)
on conflict (id) do nothing;

-- ============================================================
-- Quotation templates
-- ============================================================
insert into quotation_templates (id, name, plan_id, validity_days)
select gen_random_uuid(),'Standard Monthly', p.id, 30 from plans p where p.name = 'Starter Monthly'
on conflict (id) do nothing;

insert into quotation_template_lines (template_id, product_id, variant_id, quantity)
select qt.id, p.id, null, 1 from quotation_templates qt
join products p on p.name = 'Odoo ERP Core'
on conflict do nothing;

-- ============================================================
-- 2,000 subscriptions for performance demo
-- ============================================================
do $$
declare
  cust_ids uuid[];
  plan_ids uuid[];
  i int;
  r_cust uuid;
  r_plan uuid;
  r_start date;
  r_next date;
  r_status text;
  sub_id uuid;
begin
  select array_agg(id) into cust_ids from customers;
  select array_agg(id) into plan_ids from plans;

  for i in 1..2000 loop
    r_cust := cust_ids[1 + (i % array_length(cust_ids,1))];
    r_plan := plan_ids[1 + (i % array_length(plan_ids,1))];
    r_start := current_date - (i % 365);
    r_next := current_date - (i % 30);
    r_status := case when i % 4 = 0 then 'closed'
                     when i % 4 = 1 then 'active'
                     when i % 4 = 2 then 'draft'
                     else 'confirmed' end;

    insert into subscriptions (id, number, customer_id, plan_id, status, start_date, next_billing_date, payment_terms)
    values (gen_random_uuid(), 'SUB-' || lpad(i::text, 6, '0'), r_cust, r_plan, r_status, r_start, r_next, 'Net 15')
    returning id into sub_id;

    insert into subscription_lines (subscription_id, product_id, quantity, unit_price, amount)
    select sub_id, p.id, 1 + (i % 3), p.sales_price, p.sales_price * (1 + (i % 3))
    from products p limit 2;
  end loop;
end $$;

-- ============================================================
-- Seed some invoices and payments
-- NOTE: 'overdue' is not a stored status. It is computed from
-- status='confirmed' + due_date < today + amount_paid < total.
-- ============================================================
do $$
declare
  sub_ids uuid[];
  i int;
  r_sub uuid;
  inv_id uuid;
begin
  select array_agg(id) into sub_ids from subscriptions where status = 'active' limit 500;

  for i in 1..500 loop
    r_sub := sub_ids[1 + (i % array_length(sub_ids,1))];
    insert into invoices (number, subscription_id, customer_id, period_start, period_end,
                          status, issue_date, due_date, subtotal, tax_total, total, amount_paid)
    select 'INV-' || lpad(i::text, 6, '0'), id, customer_id, current_date - 30, current_date,
           case when i % 5 = 0 then 'paid'
                when i % 5 = 1 then 'confirmed'
                when i % 5 = 2 then 'confirmed'
                else 'draft' end,
           current_date - 30, current_date - 15,
           100 + (i % 500), 20 + (i % 50), 120 + (i % 500),
           case when i % 5 = 0 then 120 + (i % 500) else 0 end
    from subscriptions where id = r_sub
    returning id into inv_id;

    if i % 5 = 0 then
      insert into payments (invoice_id, method, amount, payment_date, note)
      values (inv_id, 'card', (select total from invoices where id = inv_id), current_date, 'Demo payment');
    end if;
  end loop;
end $$;

-- ============================================================
-- Indexes for dashboard performance
-- ============================================================
create index if not exists idx_invoices_status_due on invoices(status, due_date);
create index if not exists idx_subscriptions_status_next on subscriptions(status, next_billing_date);
create index if not exists idx_payments_date on payments(payment_date);