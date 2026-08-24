export function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted">
      <p className="mx-auto max-w-2xl px-4">
        Daten von{" "}
        <a
          href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&count=100"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          SEC EDGAR
        </a>{" "}
        (Form-4-Meldungen). Nur zu Informationszwecken — keine Anlageberatung. Bitte immer die
        verlinkte Original-Meldung prüfen. Nicht verbunden mit der U.S. Securities and Exchange
        Commission.
      </p>
    </footer>
  );
}
