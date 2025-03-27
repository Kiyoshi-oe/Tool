import { CheckCircle2 } from "lucide-react";

const BulletPoint = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    <div className="mt-1">
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
    </div>
    <p className="text-gray-300">{text}</p>
  </div>
);

const ChangelogPage = () => {
  return (
    <div className="p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">Änderungsprotokoll</h1>
      
      {/* Version 1.2.2 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.2</h3>
          <span className="text-sm text-gray-400">- 2024-06-05</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Verbesserte DDS-Texturlader mit automatischer Formatwechsel-Funktion" />
          <BulletPoint text="Robustere Modulladelogik für dynamische Komponenten" />
          <BulletPoint text="Implementierung von Error Boundaries für Fehlertoleranz" />
          <BulletPoint text="Verbesserte Fehlerbehandlung bei Ressourcen-Ladefehlern" />
          <BulletPoint text="Optimierte Anzeige von Fallback-Grafiken bei Ladefehlern" />
          <BulletPoint text="Verbesserte Performanz bei großen Datenmengen" />
          <BulletPoint text="Erweiterte Diagnosefunktionen für DDS-Ladeprobleme" />
          <BulletPoint text="Unterstützung für TogglerTree-Fallback bei fehlenden Komponenten" />
          <BulletPoint text="Zuverlässigere Anzeige der Artikel-Icons" />
        </div>
      </div>
      
      {/* Version 1.2.1 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.1</h3>
          <span className="text-sm text-gray-400">- 2024-05-29</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Performance-Optimierung für große Dateien (spec_item.txt)" />
          <BulletPoint text="Verbesserte Chunk-Verarbeitung für 20MB+ Dateien" />
          <BulletPoint text="Reduzierter Speicherverbrauch bei der Datenanalyse" />
          <BulletPoint text="Optimierte Ladezeiten durch effizientere Datenverarbeitung" />
          <BulletPoint text="Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen" />
          <BulletPoint text="Verbesserte Parser-Logik für mdlDyna.inc-Datei" />
          <BulletPoint text="Korrekte Anzeige von Dateinamen für alle Waffen-Items" />
          <BulletPoint text="Implementierung von Modellnamen-Anzeige für Armor-Items" />
          <BulletPoint text="Optimierte Verarbeitung der Datenstruktur mit robusterer Fehlerbehandlung" />
          <BulletPoint text="Entfernung des 'Viewing'-Texts aus der Titelleiste" />
          <BulletPoint text="Dynamische Erkennung von Item-Eigenschaften ohne fest kodierte Listen" />
        </div>
      </div>
      
      {/* Version 1.2.0 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.0</h3>
          <span className="text-sm text-gray-400">- 2023-11-15</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Added support for parsing defineItem.h to extract item IDs" />
          <BulletPoint text="Added support for parsing mdlDyna.inc to get model filenames" />
          <BulletPoint text="Reorganized the General section with a new field order" />
          <BulletPoint text="Moved icon display from Visual Properties to General section" />
          <BulletPoint text="Improved image loading with support for DDS files" />
          <BulletPoint text="Changed the Tradable control to a modern toggle button" />
          <BulletPoint text="Updated the Change Log with a grouped accordion view" />
          <BulletPoint text="Added a dedicated Changelog page" />
          <BulletPoint text="Updated color scheme to use #707070 for text inputs and #007BFF for highlights" />
          <BulletPoint text="Added maximum stack size limit (9999) with a helper text" />
        </div>
      </div>
      
      {/* Version 1.1.0 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.1.0</h3>
          <span className="text-sm text-gray-400">- 2023-10-01</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Added support for DDS image format" />
          <BulletPoint text="Fixed triple quotes in file paths" />
          <BulletPoint text="Improved error handling for image loading" />
          <BulletPoint text="Added detailed logging for better debugging" />
        </div>
      </div>
      
      {/* Version 1.0.1 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.0.1</h3>
          <span className="text-sm text-gray-400">- 2024-03-21</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Optimierte Verarbeitung großer Dateien für bessere Performance" />
          <BulletPoint text="Implementierung des Load More Features in der Sidebar" />
          <BulletPoint text="Anpassung der Beschreibungsfeld-Höhe für konsistentes Layout" />
          <BulletPoint text="Verbesserte Benutzeroberfläche der Sidebar" />
        </div>
      </div>
      
      {/* Version 1.0.0 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.0.0</h3>
          <span className="text-sm text-gray-400">- 2023-09-15</span>
        </div>
        <div className="space-y-2">
          <BulletPoint text="Initial release of Cyrus Resource Tool" />
          <BulletPoint text="Basic item editing functionality" />
          <BulletPoint text="Support for loading and saving Spec_Item.txt files" />
          <BulletPoint text="Implemented dark mode UI" />
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage; 