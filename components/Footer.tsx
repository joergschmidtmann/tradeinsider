export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 py-6 text-center text-xs text-black/50 dark:border-white/10 dark:text-white/40">
      <p>
        Data sourced from{" "}
        <a
          href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&count=100"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          SEC EDGAR
        </a>{" "}
        (Form 4 filings). For informational purposes only — not investment advice. Always verify
        against the original SEC filing linked above. Not affiliated with the U.S. Securities and
        Exchange Commission.
      </p>
    </footer>
  );
}
