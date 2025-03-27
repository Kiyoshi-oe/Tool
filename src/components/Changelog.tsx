import { CheckCircle2 } from "lucide-react";

interface VersionProps {
  number: string;
  date: string;
  changes: string[];
}

const Version = ({ number, date, changes }: VersionProps) => (
  <div className="space-y-4 mb-8">
    <div className="flex items-center gap-2">
      <h3 className="text-xl font-semibold text-cyrus-blue">Version {number}</h3>
      <span className="text-sm text-gray-400">- {date}</span>
    </div>
    <div className="space-y-2">
      {changes.map((change, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="mt-1">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          </div>
          <p className="text-gray-300">{change}</p>
        </div>
      ))}
    </div>
  </div>
);

const Changelog = () => {
  return (
    <div className="p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">Änderungsprotokoll</h1>
      
      <Version 
        number="1.2.2" 
        date="2024-06-05"
        changes={[
          "Verbesserte DDS-Texturlader mit automatischer Formatwechsel-Funktion",
          "Robustere Modulladelogik für dynamische Komponenten",
          "Implementierung von Error Boundaries für Fehlertoleranz",
          "Verbesserte Fehlerbehandlung bei Ressourcen-Ladefehlern",
          "Optimierte Anzeige von Fallback-Grafiken bei Ladefehlern",
          "Verbesserte Performanz bei großen Datenmengen",
          "Erweiterte Diagnosefunktionen für DDS-Ladeprobleme",
          "Unterstützung für TogglerTree-Fallback bei fehlenden Komponenten",
          "Zuverlässigere Anzeige der Artikel-Icons"
        ]}
      />
      
      <Version 
        number="1.2.1" 
        date="2024-05-29"
        changes={[
          "Performance-Optimierung für große Dateien (spec_item.txt)",
          "Verbesserte Chunk-Verarbeitung für 20MB+ Dateien",
          "Reduzierter Speicherverbrauch bei der Datenanalyse",
          "Optimierte Ladezeiten durch effizientere Datenverarbeitung",
          "Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen",
          "Verbesserte Parser-Logik für mdlDyna.inc-Datei",
          "Korrekte Anzeige von Dateinamen für alle Waffen-Items",
          "Implementierung von Modellnamen-Anzeige für Armor-Items",
          "Optimierte Verarbeitung der Datenstruktur mit robusterer Fehlerbehandlung",
          "Entfernung des \"Viewing\"-Texts aus der Titelleiste",
          "Dynamische Erkennung von Item-Eigenschaften ohne fest kodierte Listen"
        ]}
      />
      
      <Version 
        number="1.2.0" 
        date="2023-11-15"
        changes={[
          "Added support for parsing defineItem.h to extract item IDs",
          "Added support for parsing mdlDyna.inc to get model filenames",
          "Reorganized the General section with a new field order",
          "Moved icon display from Visual Properties to General section",
          "Improved image loading with support for DDS files",
          "Changed the Tradable control to a modern toggle button",
          "Updated the Change Log with a grouped accordion view",
          "Added a dedicated Changelog page",
          "Updated color scheme to use #707070 for text inputs and #007BFF for highlights",
          "Added maximum stack size limit (9999) with a helper text"
        ]}
      />
      
      <Version 
        number="1.1.0" 
        date="2023-10-01"
        changes={[
          "Added support for DDS image format",
          "Fixed triple quotes in file paths",
          "Improved error handling for image loading",
          "Added detailed logging for better debugging",
          "Added maximum stack size limit (9999) with a helper text"
        ]}
      />
      
      <Version 
        number="1.0.1" 
        date="2024-03-21"
        changes={[
          "Optimierte Verarbeitung großer Dateien (spec_item.txt) für bessere Performance",
          "Implementierung eines \"Load More\" Features in der Sidebar für bessere Übersichtlichkeit",
          "Anpassung der Beschreibungsfeld-Höhe für konsistentes Layout",
          "Verbesserte Benutzeroberfläche durch Entfernung überflüssiger Elemente in der Sidebar"
        ]}
      />
      
      <Version 
        number="1.0.0" 
        date="2023-09-15"
        changes={[
          "Initial release of Cyrus Resource Tool",
          "Basic item editing functionality",
          "Support for loading and saving Spec_Item.txt files",
          "Implemented dark mode UI"
        ]}
      />
    </div>
  );
};

export default Changelog; 