
import { useState } from "react";
import { ResourceItem, LogEntry } from "../types/fileTypes";
import { useUndoRedo } from "./useUndoRedo";
import { useTabs } from "./useTabs";
import { useFileLoader } from "./useFileLoader";
import { useItemEditor } from "./useItemEditor";

export const useResourceState = (settings: any, setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>) => {
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(null);
  
  const { fileData, setFileData, handleLoadFile } = useFileLoader(settings, setLogEntries);
  
  const { undoStack, redoStack, saveUndoState, handleUndo, handleRedo } = useUndoRedo(
    fileData,
    selectedItem,
    setFileData,
    setSelectedItem
  );
  
  const { openTabs, handleCloseTab, handleSelectTab, addTab, updateTabItem } = useTabs(
    selectedItem,
    setSelectedItem
  );
  
  const { editMode, handleUpdateItem, handleSelectItem, handleToggleEditMode } = useItemEditor({
    fileData,
    setFileData,
    selectedItem,
    setSelectedItem,
    settings,
    setLogEntries,
    updateTabItem,
    saveUndoState
  });
  
  // Extend handleSelectItem to also add the tab
  const handleSelectItemWithTab = (item: ResourceItem, showSettings: boolean, showToDoPanel: boolean) => {
    handleSelectItem(item, showSettings, showToDoPanel);
    if (!showSettings && !showToDoPanel) {
      addTab(item);
    }
  };
  
  return {
    fileData,
    setFileData,
    selectedItem,
    setSelectedItem,
    undoStack,
    redoStack,
    openTabs,
    editMode,
    saveUndoState,
    handleUndo,
    handleRedo,
    handleLoadFile,
    handleSelectItem: handleSelectItemWithTab,
    handleUpdateItem,
    handleCloseTab,
    handleSelectTab,
    handleToggleEditMode
  };
};
