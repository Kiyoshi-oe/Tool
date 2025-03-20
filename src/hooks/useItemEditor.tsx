
import { useState } from "react";
import { FileData, LogEntry, ResourceItem } from "../types/fileTypes";
import { toast } from "sonner";
import { trackModifiedFile, trackPropItemChanges } from "../utils/file/fileOperations";

interface ItemEditorProps {
  fileData: FileData | null;
  setFileData: React.Dispatch<React.SetStateAction<FileData | null>>;
  selectedItem: ResourceItem | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<ResourceItem | null>>;
  settings: any;
  setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  updateTabItem: (item: ResourceItem) => void;
  saveUndoState: () => void;
}

export const useItemEditor = ({
  fileData,
  setFileData,
  selectedItem,
  setSelectedItem,
  settings,
  setLogEntries,
  updateTabItem,
  saveUndoState
}: ItemEditorProps) => {
  const [editMode, setEditMode] = useState(false);
  
  const handleUpdateItem = (updatedItem: ResourceItem, field?: string, oldValue?: any) => {
    if (!fileData || !editMode) return;
    
    const updatedItems = fileData.items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    setFileData({
      ...fileData,
      items: updatedItems
    });
    
    updateTabItem(updatedItem);
    
    if (settings.enableLogging && field && oldValue !== undefined) {
      const newLogEntry: LogEntry = {
        timestamp: Date.now(),
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        field,
        oldValue,
        newValue: field === 'displayName' 
          ? updatedItem.displayName 
          : field === 'description' 
          ? updatedItem.description 
          : updatedItem.data[field] || ''
      };
      
      setLogEntries(prev => [newLogEntry, ...prev]);
    }
    
    setSelectedItem(updatedItem);
    
    // Track that the Spec_Item.txt file has been modified
    // Mark this as a spec item file to ensure it's preserved exactly
    const serializedData = JSON.stringify({
      ...fileData,
      items: updatedItems,
      isSpecItemFile: true,
      originalContent: fileData.originalContent // Pass through the original content if it exists
    });
    
    // Log the presence of originalContent for debugging
    if (fileData.originalContent) {
      console.log("Original content is present, length:", fileData.originalContent.length);
      console.log("First 100 chars:", fileData.originalContent.substring(0, 100));
    } else {
      console.warn("No original content found for Spec_Item.txt");
    }
    
    trackModifiedFile("Spec_Item.txt", serializedData);
    
    // Also track propItem changes if this is a displayName or description change
    if (field === 'displayName' || field === 'description') {
      trackPropItemChanges(
        updatedItem.id,
        updatedItem.name,
        updatedItem.displayName || '',
        updatedItem.description || ''
      );
    }
  };
  
  const handleSelectItem = (item: ResourceItem, showSettings: boolean, showToDoPanel: boolean) => {
    if (showSettings || showToDoPanel) return;
    
    saveUndoState();
    setSelectedItem(item);
  };
  
  const handleToggleEditMode = () => {
    setEditMode(!editMode);
    toast.info(editMode ? "Switched to View mode" : "Switched to Edit mode");
  };

  return {
    editMode,
    handleUpdateItem,
    handleSelectItem,
    handleToggleEditMode
  };
};
