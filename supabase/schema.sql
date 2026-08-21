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

  -- Transaction details
  transaction_date date not null,
  transaction_code text not null,
  shares numeric,
  price_per_share numeric,
  -- Computed by Postgres (exact decimal math) rather than in application code,
  -- to avoid floating-point rounding artifacts (e.g. 15794.999999999998).
  total_value numeric generated always as (shares * price_per_share) stored,
  shares_owned_after numeric,

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
create index if not exists transactions_issuer_name_idx on transactions using gin (issuer_name gin_trgm_ops);
create index if not exists transactions_issuer_ticker_idx on transactions (issuer_ticker);

-- Row Level Security: the public website only ever needs to READ.
-- Writes happen exclusively from the ingestion script using the service role key,
-- which bypasses RLS entirely, so no INSERT/UPDATE policy is needed here.
alter table transactions enable row level security;

create policy "Public can read transactions"
  on transactions for select
  using (true);
