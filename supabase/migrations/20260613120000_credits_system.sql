-- ============================================================
-- Credits System Migration
-- Free tier: 5 script_generation credits + 3 tweaks per thread
-- Paid credits top up the balance
-- Admin email bypasses all limits
-- ============================================================

-- 1. User credits wallet
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance integer not null default 5,        -- free scripts remaining
  total_purchased integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_credits enable row level security;
create policy "owner_all" on public.user_credits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create wallet on new user signup
create or replace function public.handle_new_user_credits()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 5)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;
create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credits();

-- Back-fill wallet for existing users
insert into public.user_credits (user_id, balance)
select id, 5 from auth.users
on conflict (user_id) do nothing;

-- 2. Tweak counter per thread
-- Each thread already exists in threads table; we track tweaks inline via a column
alter table public.threads
  add column if not exists tweak_count integer not null default 0;

-- 3. Credit transaction log (for audit + future billing)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,                   -- positive = add, negative = consume
  reason text not null,                      -- 'script_generation' | 'tweak' | 'purchase' | 'free_grant'
  thread_id uuid references public.threads(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;
create policy "owner_read" on public.credit_transactions
  for select using (auth.uid() = user_id);
