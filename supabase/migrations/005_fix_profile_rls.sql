-- Prevent profile lookups from recursively evaluating the profiles policies.
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
