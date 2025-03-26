import { ResourceItem, FileData } from "../../types/fileTypes";
import ResourceEditor from "../ResourceEditor";
import SettingsPanel from "../SettingsPanel";
import ToDoPanel from "../ToDoPanel";
import { Database, Upload, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { RefreshCcw, Undo2, Redo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface MainContentProps {
  showSettings: boolean;
  showToDoPanel: boolean;
  selectedItem: ResourceItem | null;
  handleUpdateItem: (updatedItem: ResourceItem, field?: string, oldValue?: any) => void;
  editMode: boolean;
  undoStack: any[];
  redoStack: any[];
  handleUndo: () => void;
  handleRedo: () => void;
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  fileData: FileData | null;
  currentTab: string;
  themes: any[];
  fontOptions: any[];
  currentTheme: any;
  onShowFileUpload: () => void;
  onShowSettings: () => void;
  onShowChangelog?: () => void;
}

const ChangelogModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const changelogText = `# Changelog

## [1.2.2] - 2024-05-29
- Performance-Optimierung für große Dateien (spec_item.txt)
- Verbesserte Chunk-Verarbeitung für 20MB+ Dateien
- Reduzierter Speicherverbrauch bei der Datenanalyse
- Optimierte Ladezeiten durch effizientere Datenverarbeitung
- Verbesserte Fehlerbehandlung bei Out-of-Memory-Situationen
- Verbesserte Parser-Logik für modDyna.inc-Datei
- Korrekte Anzeige von Dateinamen für alle Waffen-Items
- Implementierung von Modellnamen-Anzeige für Armor-Items
- Optimierte Verarbeitung der Datenstruktur mit robusterer Fehlerbehandlung
- Entfernung des "Viewing"-Texts aus der Titelleiste
- Dynamische Erkennung von Item-Eigenschaften ohne fest kodierte Listen

## [1.2.1] - 2024-05-29
### Geändert
- Verbesserte Benutzeroberfläche und Navigation
- Optimierte Datenverarbeitung
- Erweiterte Fehlerbehandlung

### Behoben
- Verschiedene Bugfixes und Stabilitätsverbesserungen

## [1.2.0] - 2023-11-15
- Added support for parsing defineItem.h to extract item IDs
- Added support for parsing modDyna.inc to get model filenames
- Reorganized the General section with a new field order
- Moved icon display from Visual Properties to General section
- Improved image loading with support for DDS files
- Changed the Tradable control to a modern toggle button
- Updated the Change Log with a grouped accordion view
- Added a dedicated Changelog page
- Updated color scheme to use #707070 for text inputs and #007BFF for highlights
- Added maximum stack size limit (9999) with a helper text

## [1.1.0] - 2023-10-01
- Added support for DDS image format
- Fixed triple quotes in file paths
- Improved error handling for image loading
- Added detailed logging for better debugging

## [1.0.0] - 2023-09-15
- Initial release of Cyrus Resource Tool
- Basic item editing functionality
- Support for loading and saving Spec_Item.txt files
- Implemented dark mode UI`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Änderungsprotokoll</DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-white whitespace-pre-wrap">
          {changelogText}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const WelcomeScreen = ({ 
  onShowFileUpload, 
  onShowSettings,
  onShowChangelog
}: { 
  onShowFileUpload: () => void;
  onShowSettings: () => void;
  onShowChangelog?: () => void;
}) => {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <img
        src="/lovable-uploads/Icon_big.png"
        alt="Cyrus Resource Tool"
        className="w-32 h-32 mb-6"
      />
      <h1 className="text-2xl font-bold mb-2 text-[#007BFF]">Welcome to Cyrus Resource Tool</h1>
      <p className="text-gray-400 max-w-md mb-8">
        A modern editor for managing game resources and item data files.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <Button
          onClick={onShowFileUpload}
          className="bg-[#007BFF] hover:bg-[#0069d9] text-white flex items-center justify-center py-6"
        >
          <Upload className="mr-2 h-5 w-5" />
          <span>Load Resource File</span>
        </Button>
        
        <Button
          onClick={onShowSettings}
          className="bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center py-6"
          variant="outline"
        >
          <Database className="mr-2 h-5 w-5" />
          <span>Configure Settings</span>
        </Button>
        
        <Button
          onClick={() => setShowChangelog(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center py-6 col-span-2"
          variant="outline"
        >
          <Clock className="mr-2 h-5 w-5" />
          <span>View Changelog</span>
        </Button>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Version 1.2.2 - © 2023-2024 Cyrus Development Team</p>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
};

const MainContent = ({
  showSettings,
  showToDoPanel,
  selectedItem,
  handleUpdateItem,
  editMode,
  undoStack,
  redoStack,
  handleUndo,
  handleRedo,
  settings,
  setSettings,
  fileData,
  currentTab,
  themes,
  fontOptions,
  currentTheme,
  onShowFileUpload,
  onShowSettings,
  onShowChangelog
}: MainContentProps) => {
  
  if (showSettings) {
    return (
      <SettingsPanel
        settings={settings}
        onSaveSettings={setSettings}
        themes={themes}
        fontOptions={fontOptions}
      />
    );
  }
  
  if (showToDoPanel) {
    return <ToDoPanel />;
  }
  
  if (!fileData) {
    return <WelcomeScreen 
      onShowFileUpload={onShowFileUpload} 
      onShowSettings={onShowSettings} 
      onShowChangelog={onShowChangelog}
    />;
  }
  
  if (selectedItem) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-0 bg-cyrus-dark-lighter border-b border-cyrus-dark-lightest">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0 || !editMode}
              className="text-gray-400 hover:text-white mr-1"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0 || !editMode}
              className="text-gray-400 hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              
            </span>
          </div>
        </div>
        
        <ResourceEditor
          item={selectedItem}
          onUpdateItem={handleUpdateItem}
          editMode={editMode}
        />
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-gray-400 mb-4">
        {fileData.items.length > 0 ? (
          `Select an item from the ${currentTab} category to edit`
        ) : (
          "No items found in the loaded file"
        )}
      </p>
      <Button
        onClick={onShowFileUpload}
        className="bg-[#007BFF] hover:bg-[#0069d9] text-white"
      >
        <Upload className="mr-2 h-4 w-4" />
        <span>Load Different File</span>
      </Button>
      
      {onShowChangelog && (
        <Button
          onClick={onShowChangelog}
          className="bg-gray-700 hover:bg-gray-600 text-white mt-4"
          variant="outline"
        >
          <Clock className="mr-2 h-4 w-4" />
          <span>View Changelog</span>
        </Button>
      )}
    </div>
  );
};

export default MainContent;
