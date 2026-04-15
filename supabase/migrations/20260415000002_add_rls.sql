-- Enable RLS
alter table roast_confirmations enable row level security;

-- Allow anyone to read the counter
create policy "public read" on roast_confirmations
  for select using (true);

-- Recreate the increment function as SECURITY DEFINER so it can bypass
-- RLS and update the row even though the anon role has no UPDATE policy
create or replace function increment_roast_count()
returns integer
language sql
security definer
set search_path = public
as $$
  update roast_confirmations set count = count + 1 where id = 1 returning count;
$$;
