-- 001_schema.sql
-- Core schema for Brightloop Billing
-- Owner: Member 1 (Foundation)
-- Run this FIRST on your Supabase project

-- Enable extensions
create extension if not exists pgcrypto;

-- ============================================================
-- Core tables
-- ============================================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'customer' check (role in ('admin','staff','customer')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  company text,
  address text,
  tax_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('service','software','addon','physical')) default 'service',
  sales_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references products(id) on delete cascade,
  attribute text not null,
  value text not null,
  extra_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric(12,2) not null default 0,
  billing_period text not null check (billing_period in ('daily','weekly','monthly','yearly')) default 'monthly',
  min_quantity int not null default 1,
  available_from date,
  available_to date,
  auto_close boolean not null default false,
  allow_early_close boolean not null default true,
  allow_pause boolean not null default true,
  allow_renew boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists taxes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('percentage','fixed')) default 'percentage',
  rate numeric(12,4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_taxes (
  product_id uuid not null references products(id) on delete cascade,
  tax_id uuid not null references taxes(id) on delete cascade,
  primary key (product_id, tax_id)
);

create table if not exists discounts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('fixed','percentage')) default 'percentage',
  value numeric(12,4) not null default 0,
  min_purchase numeric(12,2) default 0,
  min_quantity int default 1,
  start_date date not null,
  end_date date not null,
  usage_limit int,
  times_used int not null default 0,
  applies_to text not null check (applies_to in ('product','subscription')) default 'subscription',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists discount_products (
  discount_id uuid not null references discounts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (discount_id, product_id)
);

create table if not exists quotation_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plan_id uuid not null references plans(id) on delete cascade,
  validity_days int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotation_template_lines (
  id uuid default gen_random_uuid() primary key,
  template_id uuid not null references quotation_templates(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  number text unique,
  customer_id uuid not null references customers(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  status text not null check (status in ('draft','quotation','confirmed','active','closed')) default 'draft',
  start_date date,
  expiry_date date,
  payment_terms text,
  next_billing_date date,
  discount_id uuid references discounts(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_lines (
  id uuid default gen_random_uuid() primary key,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_id uuid references taxes(id) on delete set null,
  amount numeric(12,2) not null default 0
);

create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  number text unique,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null check (status in ('draft','confirmed','paid','cancelled')) default 'draft',
  issue_date date not null default current_date,
  due_date date not null,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_no_double_billing unique (subscription_id, period_start)
);

create table if not exists invoice_lines (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);

create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid not null references invoices(id) on delete cascade,
  method text not null check (method in ('card','bank transfer','upi','cash','cheque')) default 'card',
  amount numeric(12,2) not null default 0,
  payment_date date not null default current_date,
  note text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Sequences for auto numbers
-- ============================================================

create sequence if not exists subscription_number_seq start 1 increment 1;
create sequence if not exists invoice_number_seq start 1 increment 1;

-- ============================================================
-- Indexes for performance
-- ============================================================

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_customers_profile on customers(profile_id);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_product_variants_product on product_variants(product_id);
create index if not exists idx_plans_active on plans(is_active);
create index if not exists idx_taxes_active on taxes(is_active);
create index if not exists idx_discounts_active on discounts(is_active);
create index if not exists idx_subscriptions_customer on subscriptions(customer_id);
create index if not exists idx_subscriptions_status on subscriptions(status);
create index if not exists idx_subscriptions_next_billing on subscriptions(next_billing_date);
create index if not exists idx_subscriptions_plan on subscriptions(plan_id);
create index if not exists idx_invoices_subscription on invoices(subscription_id);
create index if not exists idx_invoices_customer on invoices(customer_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_due_date on invoices(due_date);
create index if not exists idx_invoices_period on invoices(subscription_id, period_start);
create index if not exists idx_payments_invoice on payments(invoice_id);

-- ============================================================
-- Updated at triggers
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare tbl text;
begin
  for tbl in
    select tablename from pg_tables where schemaname='public'
      and tablename in ('profiles','customers','products','product_variants','plans','taxes',
                        'discounts','quotation_templates','quotation_template_lines',
                        'subscriptions','invoices')
  loop
    execute format('create trigger if not exists %I_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- ============================================================
-- RLS: enable on all tables (policies in 002)
-- ============================================================

alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table plans enable row level security;
alter table taxes enable row level security;
alter table product_taxes enable row level security;
alter table discounts enable row level security;
alter table discount_products enable row level security;
alter table quotation_templates enable row level security;
alter table quotation_template_lines enable row level security;
alter table subscriptions enable row level security;
alter table subscription_lines enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table payments enable row level security;
