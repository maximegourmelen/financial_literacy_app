create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null check (role in ('child', 'admin')),
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  account_type text not null check (account_type in ('checking', 'savings', 'investment_cash')),
  entry_type text not null check (
    entry_type in ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'interest_credit', 'buy', 'sell')
  ),
  amount_hkd numeric(18, 4) not null,
  business_date date not null,
  description text,
  group_id uuid,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.savings_rates (
  id uuid primary key default gen_random_uuid(),
  apr_percent numeric(8, 4) not null check (apr_percent >= 0 and apr_percent <= 100),
  effective_date date not null,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_catalog (
  symbol text primary key,
  name text not null,
  asset_type text not null check (asset_type in ('stock', 'etf', 'crypto')),
  quote_symbol text not null,
  is_active boolean not null default true,
  display_order integer not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quotes_cache (
  symbol text primary key references public.asset_catalog(symbol) on delete cascade,
  price_usd numeric(18, 6) not null,
  fx_usd_hkd numeric(18, 6) not null,
  price_hkd numeric(18, 4) not null,
  fetched_at timestamptz not null,
  source text not null
);

create table if not exists public.investment_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  symbol text not null references public.asset_catalog(symbol) on delete restrict,
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(24, 8) not null check (quantity > 0),
  gross_hkd numeric(18, 4) not null check (gross_hkd > 0),
  price_usd numeric(18, 6) not null check (price_usd > 0),
  price_hkd numeric(18, 4) not null check (price_hkd > 0),
  fx_usd_hkd numeric(18, 6) not null check (fx_usd_hkd > 0),
  order_mode text not null check (order_mode in ('amount', 'quantity')),
  requested_amount_hkd numeric(18, 4),
  requested_quantity numeric(24, 8),
  executed_at timestamptz not null default timezone('utc', now()),
  ledger_entry_id uuid references public.ledger_entries(id) on delete set null
);

create table if not exists public.interest_runs (
  business_date date primary key,
  applied_apr_percent numeric(8, 4) not null default 0,
  status text not null check (status in ('completed')),
  completed_at timestamptz not null default timezone('utc', now())
);

create index if not exists ledger_entries_user_created_at_idx
  on public.ledger_entries (user_id, created_at desc);

create index if not exists ledger_entries_user_account_business_date_idx
  on public.ledger_entries (user_id, account_type, business_date);

create index if not exists investment_trades_user_executed_at_idx
  on public.investment_trades (user_id, executed_at desc);

create index if not exists savings_rates_effective_date_idx
  on public.savings_rates (effective_date desc);

create index if not exists app_users_auth_user_id_idx
  on public.app_users (auth_user_id);

alter table public.app_users enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.savings_rates enable row level security;
alter table public.asset_catalog enable row level security;
alter table public.quotes_cache enable row level security;
alter table public.investment_trades enable row level security;
alter table public.interest_runs enable row level security;

insert into public.asset_catalog (symbol, name, asset_type, quote_symbol, display_order)
values
  ('VOO', 'Vanguard S&P 500 ETF', 'etf', 'VOO', 1),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 'QQQ', 2),
  ('AAPL', 'Apple', 'stock', 'AAPL', 3),
  ('MSFT', 'Microsoft', 'stock', 'MSFT', 4),
  ('NVDA', 'NVIDIA', 'stock', 'NVDA', 5),
  ('AMZN', 'Amazon', 'stock', 'AMZN', 6),
  ('GOOG', 'Alphabet', 'stock', 'GOOG', 7),
  ('META', 'Meta', 'stock', 'META', 8),
  ('BRK.B', 'Berkshire Hathaway Class B', 'stock', 'BRK.B', 9),
  ('TSLA', 'Tesla', 'stock', 'TSLA', 10),
  ('JPM', 'JPMorgan Chase', 'stock', 'JPM', 11),
  ('AVGO', 'Broadcom', 'stock', 'AVGO', 12),
  ('BTC', 'Bitcoin', 'crypto', 'BTC/USD', 13),
  ('ETH', 'Ethereum', 'crypto', 'ETH/USD', 14),
  ('SOL', 'Solana', 'crypto', 'SOL/USD', 15),
  ('XRP', 'XRP', 'crypto', 'XRP/USD', 16)
on conflict (symbol) do update
set
  name = excluded.name,
  asset_type = excluded.asset_type,
  quote_symbol = excluded.quote_symbol,
  display_order = excluded.display_order,
  is_active = true;

insert into public.savings_rates (apr_percent, effective_date)
select 2.5000, current_date
where not exists (select 1 from public.savings_rates);
