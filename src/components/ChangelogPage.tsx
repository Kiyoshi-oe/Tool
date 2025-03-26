import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: "1.2.1",
    date: "2024-05-29",
    changes: [
      "Performance-Optimierung für große Dateien (spec_item.txt)",
      "Verbesserte Chunk-Verarbeitung für 20MB+ Dateien",
      "Reduzierter Speicherverbrauch bei der Dateianalyse",
      "Optimierte Ladezeiten durch effizientere Datenverarbeitung",
      "Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen",
      "Verbesserte Parser-Logik für mdlDyna.inc-Datei",
      "Korrekte Anzeige von Dateinamen für alle Waffen-Items",
      "Implementierung von Modellnamen-Anzeige für Armor-Items",
      "Optimierte Verarbeitung der Dateistruktur mit robusterer Fehlerbehandlung",
      "Entfernung des 'Viewing:'-Texts aus der Titelleiste",
      "Dynamische Erkennung von Item-Eigenschaften ohne fest kodierte Listen"
    ]
  },
  {
    version: "1.2.0",
    date: "2023-11-15",
    changes: [
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
    ]
  },
  {
    version: "1.1.0",
    date: "2023-10-01",
    changes: [
      "Added support for DDS image format",
      "Fixed triple quotes in file paths",
      "Improved error handling for image loading",
      "Added detailed logging for better debugging"
    ]
  },
  {
    version: "1.0.0",
    date: "2023-09-15",
    changes: [
      "Initial release of Cyrus Resource Tool",
      "Basic item editing functionality",
      "Support for loading and saving Spec_Item.txt files",
      "Implemented dark mode UI"
    ]
  }
];

interface ChangelogPageProps {
  onClose: () => void;
}

const ChangelogPage = ({ onClose }: ChangelogPageProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center p-4 border-b border-gray-700">
        <button
          onClick={onClose}
          className="mr-2 text-gray-400 hover:text-white focus:outline-none"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[#007BFF]">Changelog</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {changelogData.map((entry, index) => (
          <div key={index} className="mb-8">
            <div className="flex items-baseline mb-2">
              <h2 className="text-lg font-semibold text-[#007BFF] mr-2">
                Version {entry.version}
              </h2>
              <span className="text-sm text-gray-400">{entry.date}</span>
            </div>
            
            <ul className="list-disc pl-5 space-y-1">
              {entry.changes.map((change, changeIndex) => (
                <li key={changeIndex} className="text-gray-300">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangelogPage;
