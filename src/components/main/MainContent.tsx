import { ResourceItem, FileData } from "../../types/fileTypes";
import ResourceEditor from "../ResourceEditor";
import SettingsPanel from "../SettingsPanel";
import ToDoPanel from "../ToDoPanel";
import { Database, Upload, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { RefreshCcw, Undo2, Redo2 } from "lucide-react";
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

export const WelcomeScreen = ({ 
  onShowFileUpload, 
  onShowSettings,
  onShowChangelog
}: { 
  onShowFileUpload: () => void;
  onShowSettings: () => void;
  onShowChangelog?: () => void;
}) => {
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
          onClick={onShowChangelog}
          className="bg-cyrus-dark-light hover:bg-cyrus-dark-lighter text-white flex items-center justify-center py-6 col-span-2 border border-gray-700"
          variant="outline"
        >
          <Clock className="mr-2 h-5 w-5" />
          <span>View Changelog</span>
        </Button>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Version 1.2.2 - © 2023-2024 Cyrus Development Team</p>
      </div>
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
