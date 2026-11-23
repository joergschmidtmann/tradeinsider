-- Paywall auf Datenbankebene (einmalig im Supabase SQL Editor ausführen).
--
-- Bisher waren `transactions` und `stock_analysis` per Anon-Key vollständig
-- lesbar — die Paywall existierte nur in der Oberfläche und ließ sich mit dem
-- öffentlichen Supabase-Key direkt umgehen. Ab jetzt prüft Postgres selbst:
--   - Vorstands-/Aufsichtsrats-Transaktionen: nur für Pro-Nutzer
--   - Politiker-/Hedgefonds-Transaktionen: weiterhin öffentlich
--   - Aktien-Analysen (stock_analysis, stock_analysis_history): nur für Pro;
--     öffentlich bleibt nur Name/Ticker/Börse über stock_analysis_preview()
--
-- Legt außerdem die Tabellen der Aktien-Analyse an, falls noch nicht
-- geschehen. Idempotent: kann gefahrlos mehrfach ausgeführt werden. Für
-- Neuinstallationen ist derselbe Stand bereits in supabase/schema.sql enthalten.

-- Tabellen der Aktien-Analyse (falls noch nicht vorhanden) --------------------
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

-- true, wenn der aufrufende, eingeloggte Nutzer ein Pro-Abo hat. SECURITY
-- DEFINER, damit die Prüfung nicht von den RLS-Regeln auf `profiles` abhängt.
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

-- transactions ---------------------------------------------------------------
drop policy if exists "Public can read transactions" on transactions;
drop policy if exists "Public can read non-board transactions" on transactions;
drop policy if exists "Pro can read board transactions" on transactions;

create policy "Public can read non-board transactions"
  on transactions for select
  using (role not in ('management_board', 'supervisory_board'));

-- (select ...) statt direktem Aufruf: Postgres wertet is_pro() so einmal pro
-- Abfrage aus statt einmal pro Zeile.
create policy "Pro can read board transactions"
  on transactions for select
  to authenticated
  using ((select public.is_pro()));

-- stock_analysis / stock_analysis_history -----------------------------------
drop policy if exists "Public can read stock_analysis" on stock_analysis;
drop policy if exists "Pro can read stock_analysis" on stock_analysis;
create policy "Pro can read stock_analysis"
  on stock_analysis for select
  to authenticated
  using ((select public.is_pro()));

drop policy if exists "Public can read stock_analysis_history" on stock_analysis_history;
drop policy if exists "Pro can read stock_analysis_history" on stock_analysis_history;
create policy "Pro can read stock_analysis_history"
  on stock_analysis_history for select
  to authenticated
  using ((select public.is_pro()));

-- Öffentliche Vorschau (Seitentitel + Paywall-Kopf der Einzelanalyse):
-- ausschließlich Name, Ticker und Börse, keine Analyseinhalte.
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
