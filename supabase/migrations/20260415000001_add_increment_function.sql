create or replace function increment_roast_count()
returns integer
language sql
as $$
  update roast_confirmations set count = count + 1 where id = 1 returning count;
$$;
