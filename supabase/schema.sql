-- TradeInsides.com database schema
-- Run this once in the Supabase SQL Editor (Supabase dashboard -> SQL Editor -> New query).

create table if not exists transactions (
  id bigserial primary key,
  source_country text not null default 'US',

  -- Filing / issuer / owner identifiers (currently SEC-shaped; revisited when Europe is added)
  accession_number text not null,
  issuer_cik text not null,
  issuer_name text not null,
  issuer_ticker text,
  owner_cik text not null,
  owner_name text not null,
  owner_title text,
  is_ceo boolean not null default false,
  -- 'management_board' (Vorstand/CEO) | 'supervisory_board' (Aufsichtsrat) | 'politician'
  role text not null default 'management_board',

  -- Transaction details
  transaction_date date not null,
  transaction_code text not null,
  shares numeric,
  price_per_share numeric,
  currency text not null default 'USD',
  -- Computed by Postgres (exact decimal math) rather than in application code,
  -- to avoid floating-point rounding artifacts (e.g. 15794.999999999998).
  total_value numeric generated always as (shares * price_per_share) stored,
  -- Fallback display value for sources that only disclose a dollar range
  -- (e.g. US congressional PTRs), where shares/price_per_share are null
  -- and so total_value is null too.
  amount_range text,
  shares_owned_after numeric,
  -- 0-100 signal-strength score for Vorstand/Aufsichtsrat purchases only (role
  -- in management_board/supervisory_board, transaction_code='P'); null for
  -- sales, politicians and hedge funds, where the factors it's built from
  -- (seniority, position increase, cluster buying) don't apply the same way.
  -- Computed once at ingest, not on every page load. See scripts/lib/insiderScore.ts.
  insider_score smallint,

  -- Provenance
  filing_url text not null,
  filed_at timestamptz,
  ingested_at timestamptz not null default now(),

  -- Dedupe key: accession_number + owner_cik + index of this transaction within the filing
  dedupe_key text not null unique
);

-- Needed for the trigram index below (fast ILIKE '%...%' search)
create extension if not exists pg_trgm;

create index if not exists transactions_transaction_date_idx on transactions (transaction_date desc);
create index if not exists transactions_is_ceo_code_idx on transactions (is_ceo, transaction_code);
create index if not exists transactions_role_idx on transactions (role, source_country, transaction_code);
create index if not exists transactions_issuer_name_idx on transactions using gin (issuer_name gin_trgm_ops);
create index if not exists transactions_issuer_ticker_idx on transactions (issuer_ticker);

-- Row Level Security: the public website only ever needs to READ.
-- Writes happen exclusively from the ingestion script using the service role key,
-- which bypasses RLS entirely, so no INSERT/UPDATE policy is needed here.
alter table transactions enable row level security;

-- Lese-Policies für transactions folgen weiter unten nach public.is_pro()
-- (Abschnitt `profiles`), weil sie darauf aufbauen.

-- Latest known price per US ticker, used to show "performance since insider
-- purchase" next to a transaction (price_per_share on that row is already
-- the price at purchase time, so no historical price series is needed here —
-- just the most recent quote). One row per ticker, overwritten on refresh
-- rather than a time series, since only the current price is ever displayed.
create table if not exists stock_quotes (
  ticker text primary key,
  price numeric not null,
  currency text not null,
  quoted_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table stock_quotes enable row level security;

create policy "Public can read stock_quotes"
  on stock_quotes for select
  using (true);

-- Wirtschaftsnews: a separate, much simpler table — general news items don't
-- fit the transactions shape (no shares/price/role), and `url` alone is a
-- natural unique dedupe key (unlike transactions, which need a composite key).
create table if not exists news_items (
  id bigserial primary key,
  source text not null, -- 'ecb' | 'destatis' | 'eqs_corporate'
  headline text not null,
  summary text,
  url text not null unique,
  published_at timestamptz not null,
  ingested_at timestamptz not null default now()
);

create index if not exists news_items_published_at_idx on news_items (published_at desc);
create index if not exists news_items_source_idx on news_items (source);

alter table news_items enable row level security;

create policy "Public can read news_items"
  on news_items for select
  using (true);

-- Hedgefonds (SEC Form 13F): quarterly holdings snapshots per (manager, security).
-- Buy/sell signals aren't reported directly — they're derived at ingest time by
-- diffing a new quarter's holdings against the previous one, then written as
-- normal role='hedge_fund' rows in `transactions`. This table is purely the
-- internal state needed to compute that diff; the frontend never reads it
-- directly, so — unlike every other table here — it deliberately has RLS
-- enabled with NO select policy, meaning only the service role key can access it.
create table if not exists institutional_holdings (
  id bigserial primary key,
  manager_cik text not null,
  manager_name text not null,
  cusip text not null,
  issuer_name text not null,
  period_of_report date not null,
  shares numeric not null,
  value_usd numeric not null,
  filing_url text not null,
  ingested_at timestamptz not null default now(),
  unique (manager_cik, cusip, period_of_report)
);

create index if not exists institutional_holdings_lookup_idx
  on institutional_holdings (manager_cik, cusip, period_of_report desc);

alter table institutional_holdings enable row level security;

-- One row per auth.users user, tracking subscription tier and the Stripe
-- identifiers needed to look the user up again from a webhook event (which
-- only carries Stripe IDs, not the Supabase user id, after checkout).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  -- User-editable display name shown by the dashboard greeting (falls back
  -- to a name derived from the email address when unset).
  display_name text,
  updated_at timestamptz not null default now()
);

-- Safe to re-run against a database that already has `profiles` without
-- this column (this file otherwise only runs once via `create table if not
-- exists`, which won't retrofit new columns onto an existing table).
alter table profiles add column if not exists display_name text;

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users may update only their own display_name — never tier or the Stripe
-- identifiers, which stay exclusively under service-role control via the
-- trigger/webhook below. The RLS policy alone only scopes *rows*, not
-- columns, so the actual column restriction comes from the grants: revoke
-- Supabase's default broad UPDATE grant, then grant back just this column.
create policy "Users can update their own display name"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;

-- No insert/delete policy: rows are created by the trigger below and
-- kept in sync exclusively by the Stripe webhook using the service role key,
-- which bypasses RLS. Users never write their own tier or Stripe fields.

-- search_path during an auth.users insert doesn't include `public`, so the
-- target table must be schema-qualified here or the insert silently can't
-- find it and the whole signup fails with a generic "Database error".
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- true, wenn der eingeloggte Nutzer ein Pro-Abo hat — Grundlage der
-- Pro-Policies auf transactions und stock_analysis. SECURITY DEFINER, damit
-- die Prüfung nicht von den RLS-Regeln auf `profiles` abhängt.
create or replace function public.is_pro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and tier = 'pro');
$$;

grant execute on function public.is_pro() to anon, authenticated;

-- Vorstand/Aufsichtsrat ist Pro-Inhalt: öffentlich lesbar sind nur die
-- übrigen Rollen (Politiker, Hedgefonds), Pro-Nutzer sehen alles.
create policy "Public can read non-board transactions"
  on transactions for select
  using (role not in ('management_board', 'supervisory_board'));

create policy "Pro can read board transactions"
  on transactions for select
  to authenticated
  using ((select public.is_pro()));

-- Eng begrenzte Ausnahmen für Startseite und Dashboard (lib/boardTransactions.ts):
-- Startseite (öffentlich): nur Volumen und Währung der Vorstandskäufe im Zeitraum.
create or replace function public.board_purchase_values(p_from date, p_to date)
returns table (total_value numeric, currency text)
language sql
stable
security definer
set search_path = public
as $$
  select total_value, currency from public.transactions
  where role in ('management_board', 'supervisory_board') and transaction_code = 'P'
    and transaction_date between p_from and p_to;
$$;

grant execute on function public.board_purchase_values(date, date) to anon, authenticated;

-- Dashboard (nur eingeloggte Nutzer): Vorstandskäufe/-verkäufe der letzten
-- Wochen, maximal 45 Tage zurück.
create or replace function public.dashboard_board_transactions(p_from date)
returns table (
  id bigint, issuer_name text, issuer_ticker text, owner_name text, owner_title text,
  source_country text, transaction_date date, transaction_code text, shares numeric,
  price_per_share numeric, total_value numeric, currency text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, issuer_name, issuer_ticker, owner_name, owner_title, source_country, transaction_date,
         transaction_code, shares, price_per_share, total_value, currency
  from public.transactions
  where role in ('management_board', 'supervisory_board') and transaction_code in ('P', 'S')
    and transaction_date >= greatest(p_from, current_date - 45)
  order by transaction_date desc, id desc;
$$;

revoke execute on function public.dashboard_board_transactions(date) from public, anon;
grant execute on function public.dashboard_board_transactions(date) to authenticated;

-- Backfill for accounts created before this trigger existed.
insert into profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Formal record of cancellation/withdrawal requests submitted via
-- /vertrag-kuendigen and /vertrag-widerrufen — the fallback, login-independent
-- channel (relevant for the §312k BGB "Kündigungsbutton" requirement). The
-- primary, immediately-effective cancellation path for logged-in Pro users
-- remains the Stripe Billing Portal (see app/[locale]/konto/actions.ts).
create table if not exists contract_requests (
  id bigserial primary key,
  type text not null check (type in ('cancellation', 'withdrawal')),
  email text not null,
  name text,
  plan text,
  -- Cancellation: 'asap' | 'date' | 'immediate'. Withdrawal: the order date, if given.
  requested_termination text,
  reason text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

alter table contract_requests enable row level security;
-- No select/insert policy for anon/authenticated: writes happen exclusively
-- via the Server Actions in app/[locale]/vertrag-kuendigen/actions.ts and
-- vertrag-widerrufen/actions.ts using the service role key
-- (lib/supabase/adminClient.ts), same pattern as the Stripe webhook writing
-- to `profiles`.

-- ============================================================================
-- ENTWURF, NICHT ANGEWENDET — Vorbereitung für die künftige TradeInsider-
-- Intelligence-Ratings-Funktion (siehe lib/analysis/types.ts, lib/methodology.ts).
-- Es gibt aktuell keine Seite, die diese Tabelle liest oder befüllt. Diesen
-- Block NICHT ausführen, bis die Methodik final festgelegt ist.
--
-- TODO – Methodik vor Launch final festlegen
-- TODO LEGAL REVIEW – Kapitalmarktrecht / MAR
--
-- create table if not exists stock_analyses (
--   analysis_id uuid primary key default gen_random_uuid(),
--   ticker text not null,
--   isin text,
--   company_name text not null,
--   analyst_name text not null,
--
--   methodology_version text not null,
--   data_timestamp timestamptz not null,
--   analysis_completed_at timestamptz not null,
--   published_at timestamptz,
--   investment_horizon_months smallint not null default 12,
--
--   rating text not null check (rating in ('BUY', 'HOLD', 'SELL')),
--   score_overall smallint not null check (score_overall between 0 and 100),
--   score_fundamental smallint not null check (score_fundamental between 0 and 100),
--   score_growth smallint not null check (score_growth between 0 and 100),
--   score_valuation smallint not null check (score_valuation between 0 and 100),
--   score_technical smallint not null check (score_technical between 0 and 100),
--   score_insider smallint not null check (score_insider between 0 and 100),
--
--   fair_value numeric,
--   price_at_analysis numeric not null,
--   currency text not null default 'USD',
--
--   bull_case text,
--   base_case text,
--   bear_case text,
--
--   source_list text[] not null default '{}',
--
--   operator_has_position boolean not null default false,
--   operator_position_type text check (operator_position_type in ('long', 'short')),
--   conflict_disclosure text not null,
--
--   sponsored_content boolean not null default false,
--   paid_relationship boolean not null default false,
--   affiliate_relationship boolean not null default false,
--
--   created_at timestamptz not null default now()
-- );
--
-- alter table stock_analyses enable row level security;
-- create policy "Public can read published analyses"
--   on stock_analyses for select
--   using (published_at is not null and published_at <= now());
-- ============================================================================

-- ============================================================================
-- Automatisierte Aktienanalyse (S&P 500, Nasdaq-100, STOXX Europe 600)
-- Befüllt täglich von scripts/ingest-analysis.ts (Service-Role-Key), gelesen
-- von /aktien-analyse. Berechnungslogik: lib/analysis/*, Gewichte und
-- Schwellen: lib/methodology.ts (Version wird je Zeile gespeichert).
-- ============================================================================

-- Aktueller Analysestand: eine Zeile pro Aktie, bei jedem Lauf überschrieben.
create table if not exists stock_analysis (
  -- Anbieter-Symbol inkl. Börse, z. B. 'AAPL.US', 'SAP.XETRA', 'NESN.SW'
  symbol text primary key,
  ticker text not null,
  name text not null,
  isin text,
  exchange text,
  country text,
  currency text,
  sector text,
  industry text,
  -- 'SP500' | 'NDX100' | 'STOXX600'
  indices text[] not null default '{}',

  recommendation text not null check (recommendation in ('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL')),
  score_overall smallint not null check (score_overall between 0 and 100),
  score_technical smallint,
  score_quality smallint,
  score_growth smallint,
  score_valuation smallint,
  score_analysts smallint,
  score_insider smallint,
  data_coverage numeric not null,

  -- Vorherige Empfehlung, um Hoch-/Herabstufungen anzuzeigen.
  previous_recommendation text,
  recommendation_changed_at date,

  price numeric,
  price_date date,
  return_1m numeric,
  return_3m numeric,
  return_12m numeric,

  analyst_count smallint,
  analyst_strong_buy smallint,
  analyst_buy smallint,
  analyst_hold smallint,
  analyst_sell smallint,
  analyst_strong_sell smallint,
  analyst_target numeric,
  analyst_upside numeric,

  market_cap numeric,
  -- Detaildaten für die Einzelseite (Kennzahlen, Befunde je Kategorie, Chart).
  fundamentals jsonb,
  technical jsonb,
  signals jsonb not null default '{}',
  chart jsonb,

  methodology_version text not null,
  analyzed_at timestamptz not null default now()
);

create index if not exists stock_analysis_score_idx on stock_analysis (score_overall desc);
create index if not exists stock_analysis_recommendation_idx on stock_analysis (recommendation, score_overall desc);
create index if not exists stock_analysis_indices_idx on stock_analysis using gin (indices);
create index if not exists stock_analysis_name_idx on stock_analysis using gin (name gin_trgm_ops);

alter table stock_analysis enable row level security;

-- Analysen sind Pro-Inhalt (Paywall auf Datenbankebene, nicht nur in der UI).
create policy "Pro can read stock_analysis"
  on stock_analysis for select
  to authenticated
  using ((select public.is_pro()));

-- Öffentliche Vorschau für Seitentitel und Paywall-Kopf: nur Name/Ticker/Börse.
create or replace function public.stock_analysis_preview(p_symbol text)
returns table (name text, ticker text, exchange text)
language sql
stable
security definer
set search_path = public
as $$
  select name, ticker, exchange from public.stock_analysis where symbol = p_symbol;
$$;

grant execute on function public.stock_analysis_preview(text) to anon, authenticated;

-- Historie: eine Zeile pro Aktie und Analysetag. Dokumentiert jede je
-- veröffentlichte Empfehlung (Nachvollziehbarkeit, MAR-Aufzeichnung) und
-- erlaubt später eine Erfolgsmessung der Empfehlungen.
create table if not exists stock_analysis_history (
  symbol text not null,
  analysis_date date not null,
  recommendation text not null,
  score_overall smallint not null,
  price numeric,
  methodology_version text not null,
  primary key (symbol, analysis_date)
);

alter table stock_analysis_history enable row level security;

create policy "Pro can read stock_analysis_history"
  on stock_analysis_history for select
  to authenticated
  using ((select public.is_pro()));
