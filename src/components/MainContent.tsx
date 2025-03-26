const appVersion = "Version 1.2.1";

{/* Version History Section */}
<div className="mt-6 p-4 bg-cyrus-dark-light rounded-md">
  <h2 className="text-xl font-bold text-cyrus-gold mb-2">Änderungshistorie</h2>
  <div className="space-y-2">
    <div>
      <h3 className="text-lg font-semibold text-cyrus-gold">Version 1.2.1</h3>
      <ul className="list-disc list-inside pl-4 text-gray-300">
        <li>Performance-Optimierung für große Dateien (spec_item.txt)</li>
        <li>Verbesserte Chunk-Verarbeitung für 20MB+ Dateien</li>
        <li>Reduzierter Speicherverbrauch bei der Dateianalyse</li>
        <li>Optimierte Ladezeiten durch effizientere Datenverarbeitung</li>
        <li>Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen</li>
        <li>Unterstützung für verschiedene Datei-Kodierungen (UTF-8, UTF-16)</li>
        <li>Automatische Erkennung und Entfernung von BOM in Textdateien</li>
        <li>Electron-Unterstützung für direktes Laden von lokalen Dateien</li>
        <li>Robustere Datei-Header-Erkennung bei nicht standardisierten Dateien</li>
        <li>Load-More-Funktion für schrittweises Laden großer Datensätze</li>
      </ul>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-cyrus-gold">Version 1.2.0</h3>
      <ul className="list-disc list-inside pl-4 text-gray-300">
        <li>Anzeige von Dateinamen für Waffen im Waffen-Tab</li>
        <li>Verbesserte Parsierung der mdlDyna.inc Datei</li>
        <li>Hinzufügung von Modellnamen für Rüstungsgegenstände</li>
        <li>Bug-Fixes und Stabilitätsverbesserungen</li>
      </ul>
    </div>
  </div>
</div> 