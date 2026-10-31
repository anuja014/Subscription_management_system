-- 002_rls.sql
-- Row Level Security policies
-- Run AFTER 001_schema.sql

-- ============================================================
-- Helper function: current role of the logged-in user
-- Renamed from current_role() because that is a built-in Postgres function.
-- ============================================================
create or replace function app_current_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r text;
begin
  select role into r from profiles where id = auth.uid();
  return coalesce(r, 'customer');
end;
$$;

-- ============================================================
-- profiles
-- ============================================================
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_select_admin_staff" on profiles
  for select using (app_current_role() in ('admin','staff'));

-- ============================================================
-- customers
-- ============================================================
create policy "customers_all_admin_staff" on customers
  for all using (app_current_role() in ('admin','staff'));

create policy "customers_select_own" on customers
  for select using (
    profile_id = auth.uid() or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'customer'
      and p.id = customers.profile_id)
  );

-- ============================================================
-- products / variants / plans / taxes (catalog)
-- ============================================================
create policy "products_all_admin_staff" on products for all using (app_current_role() in ('admin','staff'));
create policy "product_variants_all_admin_staff" on product_variants for all using (app_current_role() in ('admin','staff'));
create policy "plans_all_admin_staff" on plans for all using (app_current_role() in ('admin','staff'));
create policy "taxes_all_admin_staff" on taxes for all using (app_current_role() in ('admin','staff'));
create policy "product_taxes_all_admin_staff" on product_taxes for all using (app_current_role() in ('admin','staff'));

create policy "products_select_public" on products for select using (is_active = true);
create policy "product_variants_select_public" on product_variants for select using (
  exists (select 1 from products p where p.id = product_id and p.is_active = true)
);
create policy "plans_select_public" on plans for select using (is_active = true);
create policy "taxes_select_public" on taxes for select using (is_active = true);
create policy "product_taxes_select_public" on product_taxes for select using (true);

-- ============================================================
-- discounts
-- ============================================================
create policy "discounts_all_admin" on discounts for all using (app_current_role() = 'admin');
create policy "discount_products_all_admin" on discount_products for all using (app_current_role() = 'admin');
create policy "discounts_select_public" on discounts for select using (
  is_active = true and start_date <= current_date and end_date >= current_date
);

-- ============================================================
-- quotation templates
-- ============================================================
create policy "quotation_templates_all_admin_staff" on quotation_templates for all using (app_current_role() in ('admin','staff'));
create policy "quotation_template_lines_all_admin_staff" on quotation_template_lines for all using (app_current_role() in ('admin','staff'));
create policy "quotation_templates_select_public" on quotation_templates for select using (true);

-- ============================================================
-- subscriptions
-- ============================================================
create policy "subscriptions_all_admin_staff" on subscriptions for all using (app_current_role() in ('admin','staff'));

create policy "subscriptions_select_own" on subscriptions
  for select using (
    customer_id in (
      select id from customers where profile_id = auth.uid()
    )
  );

create policy "subscriptions_insert_own" on subscriptions
  for insert with check (
    app_current_role() in ('admin','staff') or
    customer_id in (select id from customers where profile_id = auth.uid())
  );

-- ============================================================
-- subscription_lines
-- ============================================================
create policy "subscription_lines_all_admin_staff" on subscription_lines for all using (app_current_role() in ('admin','staff'));

create policy "subscription_lines_select_own" on subscription_lines
  for select using (
    subscription_id in (
      select id from subscriptions where customer_id in (
        select id from customers where profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- invoices
-- ============================================================
create policy "invoices_all_admin_staff" on invoices for all using (app_current_role() in ('admin','staff'));

create policy "invoices_select_own" on invoices
  for select using (
    customer_id in (
      select id from customers where profile_id = auth.uid()
    )
  );

-- ============================================================
-- invoice_lines
-- ============================================================
create policy "invoice_lines_all_admin_staff" on invoice_lines for all using (app_current_role() in ('admin','staff'));

create policy "invoice_lines_select_own" on invoice_lines
  for select using (
    invoice_id in (
      select id from invoices where customer_id in (
        select id from customers where profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- payments
-- ============================================================
create policy "payments_all_admin_staff" on payments for all using (app_current_role() in ('admin','staff'));

create policy "payments_select_own" on payments
  for select using (
    invoice_id in (
      select id from invoices where customer_id in (
        select id from customers where profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Trigger: auto-update invoice paid status when payment recorded
-- ============================================================
create or replace function update_invoice_paid_status()
returns trigger as $$
declare
  inv_total numeric(12,2);
  inv_paid numeric(12,2);
begin
  select total, amount_paid into inv_total, inv_paid
  from invoices where id = new.invoice_id;

  update invoices
  set amount_paid = inv_paid + new.amount
  where id = new.invoice_id;

  select amount_paid + new.amount into inv_paid from invoices where id = new.invoice_id;

  if inv_paid >= inv_total then
    update invoices set status = 'paid' where id = new.invoice_id;
  end if;

  return new;
end;
$$ language plpgsql;

do $$
begin
  drop trigger if exists trg_update_invoice_paid on payments;
  create trigger trg_update_invoice_paid
  after insert on payments
  for each row
  execute function update_invoice_paid_status();
end $$;