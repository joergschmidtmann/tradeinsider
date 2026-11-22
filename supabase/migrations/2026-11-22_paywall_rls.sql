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
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden. Für Neuinstallationen
-- ist derselbe Stand bereits in supabase/schema.sql enthalten.

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
