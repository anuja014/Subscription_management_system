-- 004b_dashboard.sql
-- Dashboard RPC and performance indexes
-- Owner: Member 4 (Dashboard)
-- Run AFTER 001_schema.sql and 002_rls.sql

-- Dashboard summary RPC: single query returning counts and sums
create or replace function dashboard_summary(p_from date default null, p_to date default null)
returns json language plpgsql stable as $$
declare
  v_result json;
begin
  select json_build_object(
    'active_subscriptions', (select count(*) from subscriptions where status = 'active'),
    'revenue_collected', coalesce((select sum(amount) from payments where payment_date >= coalesce(p_from, '2000-01-01')
                                   and payment_date <= coalesce(p_to, current_date)), 0),
    'outstanding_amount', coalesce((select sum(total - amount_paid) from invoices where status in ('confirmed','draft')
                                    and total > amount_paid), 0),
    'overdue_count', (select count(*) from invoices where status = 'confirmed'
                      and due_date < current_date and amount_paid < total),
    'overdue_amount', coalesce((select sum(total - amount_paid) from invoices where status = 'confirmed'
                                and due_date < current_date and amount_paid < total), 0),
    'total_invoices', (select count(*) from invoices),
    'total_paid', coalesce((select sum(amount) from payments), 0)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function dashboard_summary(date, date) to authenticated;

-- Additional dashboard indexes
create index if not exists idx_payments_date_amount on payments(payment_date, amount);
create index if not exists idx_invoices_total_paid on invoices(total, amount_paid, status, due_date);
