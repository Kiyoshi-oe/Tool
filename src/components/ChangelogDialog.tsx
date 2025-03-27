import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { CheckCircle2, Plus, Trash2, Wrench, Bolt, Bug, ArrowUpCircle } from "lucide-react";

type ChangeType = "added" | "changed" | "removed" | "fixed" | "improved" | "updated";

interface BulletPointProps {
  text: string;
  type: ChangeType;
}

const BulletPoint = ({ text, type }: BulletPointProps) => {
  // Icon auswählen je nach Änderungstyp
  const getIcon = () => {
    switch (type) {
      case "added":
        return <Plus className="h-4 w-4 text-green-500 flex-shrink-0" />;
      case "removed":
        return <Trash2 className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case "changed":
        return <Wrench className="h-4 w-4 text-orange-400 flex-shrink-0" />;
      case "fixed":
        return <Bug className="h-4 w-4 text-purple-400 flex-shrink-0" />;
      case "improved":
        return <ArrowUpCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />;
      case "updated":
        return <Bolt className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-start gap-2">
      <div className="mt-1">
        {getIcon()}
      </div>
      <p className="text-gray-300">{text}</p>
    </div>
  );
};

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangelogDialog = ({ open, onOpenChange }: ChangelogDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-cyrus-dark-light border-cyrus-dark-lightest text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cyrus-gold">Changelog</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Plus className="h-3 w-3 text-green-500" /> <span className="text-xs text-gray-300">Added</span>
          </div>
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3 text-orange-400" /> <span className="text-xs text-gray-300">Changed</span>
          </div>
          <div className="flex items-center gap-1">
            <Trash2 className="h-3 w-3 text-red-500" /> <span className="text-xs text-gray-300">Removed</span>
          </div>
          <div className="flex items-center gap-1">
            <Bug className="h-3 w-3 text-purple-400" /> <span className="text-xs text-gray-300">Fixed</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpCircle className="h-3 w-3 text-blue-400" /> <span className="text-xs text-gray-300">Improved</span>
          </div>
          <div className="flex items-center gap-1">
            <Bolt className="h-3 w-3 text-yellow-400" /> <span className="text-xs text-gray-300">Updated</span>
          </div>
        </div>
        
        {/* Version 1.2.4 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.4</h3>
            <span className="text-sm text-gray-400">- 2024-06-25</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="improved" text="Completely redesigned DDS texture preview with expanded zoom options (1x-10x)" />
            <BulletPoint type="improved" text="Optimized rendering of DDS textures with pixel-perfect scaling" />
            <BulletPoint type="added" text="Dynamic size adjustment of the preview window based on zoom level and image content" />
            <BulletPoint type="improved" text="Enhanced dialog user interface with clearer layout and better accessibility" />
            <BulletPoint type="fixed" text="Eliminated duplicate close buttons in the preview window" />
            <BulletPoint type="changed" text="Optimized dialog size for various zoom levels" />
            <BulletPoint type="improved" text="More precise image rendering function for DDS textures" />
            <BulletPoint type="fixed" text="Improved dialog interaction preventing accidental dismissal" />
            <BulletPoint type="improved" text="Consistent dark mode styling across all preview window components" />
          </div>
        </div>
        
        {/* Version 1.2.3 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.3</h3>
            <span className="text-sm text-gray-400">- 2024-06-20</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="added" text="Enhanced DDS texture preview with zoom controls" />
            <BulletPoint type="added" text="Added detailed tooltips explaining DDS format options" />
            <BulletPoint type="improved" text="Improved transparency handling for DDS textures with pink backgrounds" />
            <BulletPoint type="added" text="Implemented intelligent format detection for better DDS rendering" />
            <BulletPoint type="improved" text="Added pixel-perfect rendering for clearer icon display" />
            <BulletPoint type="changed" text="Consistent dark mode styling across all dialog components" />
            <BulletPoint type="removed" text="Removed Item Rarity field from editor UI" />
            <BulletPoint type="improved" text="Optimized changelog display with improved layout" />
            <BulletPoint type="fixed" text="Fixed various UI styling inconsistencies" />
          </div>
        </div>
        
        {/* Version 1.2.2 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.2</h3>
            <span className="text-sm text-gray-400">- 2024-06-05</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="improved" text="Verbesserte DDS-Texturlader mit automatischer Formatwechsel-Funktion" />
            <BulletPoint type="improved" text="Robustere Modulladelogik für dynamische Komponenten" />
            <BulletPoint type="added" text="Implementierung von Error Boundaries für Fehlertoleranz" />
            <BulletPoint type="improved" text="Verbesserte Fehlerbehandlung bei Ressourcen-Ladefehlern" />
            <BulletPoint type="improved" text="Optimierte Anzeige von Fallback-Grafiken bei Ladefehlern" />
            <BulletPoint type="improved" text="Verbesserte Performanz bei großen Datenmengen" />
            <BulletPoint type="added" text="Erweiterte Diagnosefunktionen für DDS-Ladeprobleme" />
            <BulletPoint type="added" text="Unterstützung für TogglerTree-Fallback bei fehlenden Komponenten" />
            <BulletPoint type="improved" text="Zuverlässigere Anzeige der Artikel-Icons" />
          </div>
        </div>
        
        {/* Version 1.2.1 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.1</h3>
            <span className="text-sm text-gray-400">- 2024-05-29</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="improved" text="Performance-Optimierung für große Dateien (spec_item.txt)" />
            <BulletPoint type="improved" text="Verbesserte Chunk-Verarbeitung für 20MB+ Dateien" />
            <BulletPoint type="improved" text="Reduzierter Speicherverbrauch bei der Datenanalyse" />
            <BulletPoint type="improved" text="Optimierte Ladezeiten durch effizientere Datenverarbeitung" />
            <BulletPoint type="fixed" text="Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen" />
            <BulletPoint type="improved" text="Verbesserte Parser-Logik für mdlDyna.inc-Datei" />
            <BulletPoint type="fixed" text="Korrekte Anzeige von Dateinamen für alle Waffen-Items" />
            <BulletPoint type="added" text="Implementierung von Modellnamen-Anzeige für Armor-Items" />
            <BulletPoint type="improved" text="Optimierte Verarbeitung der Datenstruktur mit robusterer Fehlerbehandlung" />
            <BulletPoint type="removed" text="Entfernung des 'Viewing'-Texts aus der Titelleiste" />
            <BulletPoint type="added" text="Dynamische Erkennung von Item-Eigenschaften ohne fest kodierte Listen" />
          </div>
        </div>
        
        {/* Version 1.2.0 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.2.0</h3>
            <span className="text-sm text-gray-400">- 2023-11-15</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="added" text="Added support for parsing defineItem.h to extract item IDs" />
            <BulletPoint type="added" text="Added support for parsing mdlDyna.inc to get model filenames" />
            <BulletPoint type="changed" text="Reorganized the General section with a new field order" />
            <BulletPoint type="changed" text="Moved icon display from Visual Properties to General section" />
            <BulletPoint type="improved" text="Improved image loading with support for DDS files" />
            <BulletPoint type="changed" text="Changed the Tradable control to a modern toggle button" />
            <BulletPoint type="updated" text="Updated the Change Log with a grouped accordion view" />
            <BulletPoint type="added" text="Added a dedicated Changelog page" />
            <BulletPoint type="updated" text="Updated color scheme to use #707070 for text inputs and #007BFF for highlights" />
            <BulletPoint type="added" text="Added maximum stack size limit (9999) with a helper text" />
          </div>
        </div>
        
        {/* Version 1.1.0 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.1.0</h3>
            <span className="text-sm text-gray-400">- 2023-10-01</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="added" text="Added support for DDS image format" />
            <BulletPoint type="fixed" text="Fixed triple quotes in file paths" />
            <BulletPoint type="improved" text="Improved error handling for image loading" />
            <BulletPoint type="added" text="Added detailed logging for better debugging" />
          </div>
        </div>
        
        {/* Version 1.0.1 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.0.1</h3>
            <span className="text-sm text-gray-400">- 2024-03-21</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="improved" text="Optimierte Verarbeitung großer Dateien für bessere Performance" />
            <BulletPoint type="added" text="Implementierung des Load More Features in der Sidebar" />
            <BulletPoint type="changed" text="Anpassung der Beschreibungsfeld-Höhe für konsistentes Layout" />
            <BulletPoint type="improved" text="Verbesserte Benutzeroberfläche der Sidebar" />
          </div>
        </div>
        
        {/* Version 1.0.0 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-cyrus-blue">Version 1.0.0</h3>
            <span className="text-sm text-gray-400">- 2023-09-15</span>
          </div>
          <div className="space-y-2">
            <BulletPoint type="added" text="Initial release of Cyrus Resource Tool" />
            <BulletPoint type="added" text="Basic item editing functionality" />
            <BulletPoint type="added" text="Support for loading and saving Spec_Item.txt files" />
            <BulletPoint type="added" text="Implemented dark mode UI" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogDialog; 