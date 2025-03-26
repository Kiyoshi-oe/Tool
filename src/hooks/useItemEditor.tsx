import { useState, useCallback, useMemo, useEffect } from "react";
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

// Lookup-Cache: Map-Objekt für schnellen Zugriff auf Items nach ID
const itemCache = new Map<string, ResourceItem>();
// Flag, ob ein Cache-Update notwendig ist
let cacheNeedsUpdate = true;

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
  
  // Cache für schnellen Zugriff auf Items nach ID aktualisieren
  useMemo(() => {
    if (fileData && cacheNeedsUpdate) {
      itemCache.clear();
      fileData.items.forEach(item => {
        itemCache.set(item.id, item);
      });
      cacheNeedsUpdate = false;
    }
  }, [fileData]);
  
  // Performance-Optimierung: handleUpdateItem memoisieren
  const handleUpdateItem = useCallback((updatedItem: ResourceItem, field?: string, oldValue?: any) => {
    if (!fileData || !editMode) return;
    
    // Performance-Optimierung: Keine vollständige Array-Iteration für Updating
    const updatedItems = [...fileData.items];
    const itemIndex = updatedItem.id ? 
      updatedItems.findIndex(item => item.id === updatedItem.id) : -1;
    
    if (itemIndex >= 0) {
      updatedItems[itemIndex] = updatedItem;
      
      // Cache aktualisieren
      itemCache.set(updatedItem.id, updatedItem);
    } else {
      // Fallback: Map über das gesamte Array
      const newItems = fileData.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      
      // Nur aktualisieren, wenn sich tatsächlich etwas geändert hat
      if (JSON.stringify(newItems) !== JSON.stringify(fileData.items)) {
        updatedItems.splice(0, updatedItems.length, ...newItems);
        
        // Cache aktualisieren
        itemCache.set(updatedItem.id, updatedItem);
      }
    }
    
    // Performance-Optimierung: Nur aktualisieren, wenn sich etwas geändert hat
    if (itemIndex >= 0 || JSON.stringify(updatedItems) !== JSON.stringify(fileData.items)) {
      // Deferred state update für bessere UI-Reaktionsfähigkeit
      setTimeout(() => {
        setFileData({
          ...fileData,
          items: updatedItems
        });
      }, 0);
    }
    
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
  }, [fileData, editMode, settings, setFileData, setLogEntries, setSelectedItem, updateTabItem]);
  
  // Performance-Optimierung: handleSelectItem memoisieren
  const handleSelectItem = useCallback((item: ResourceItem, showSettings: boolean, showToDoPanel: boolean) => {
    if (showSettings || showToDoPanel) return;
    
    // Vor der Auswahl den UndoState speichern
    saveUndoState();
    
    // Performance-Optimierung: Wenn das Item bereits ausgewählt ist, nichts tun
    if (selectedItem && selectedItem.id === item.id) return;
    
    // Priorität mit queueMicrotask erhöhen
    queueMicrotask(() => {
      setSelectedItem(item);
    });
  }, [selectedItem, setSelectedItem, saveUndoState]);
  
  // Performance-Optimierung: handleToggleEditMode memoisieren
  const handleToggleEditMode = useCallback(() => {
    setEditMode(prevMode => {
      const newMode = !prevMode;
      toast.info(newMode ? "Switched to Edit mode" : "Switched to View mode");
      return newMode;
    });
  }, []);

  // Cache invalidieren wenn sich fileData ändert
  useEffect(() => {
    cacheNeedsUpdate = true;
  }, [fileData]);

  return {
    editMode,
    handleUpdateItem,
    handleSelectItem,
    handleToggleEditMode
  };
};
