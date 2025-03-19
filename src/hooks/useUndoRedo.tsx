
import { useState } from "react";
import { FileData, ResourceItem } from "../types/fileTypes";
import { toast } from "sonner";

interface UndoRedoState {
  items: ResourceItem[];
  selectedItem: ResourceItem | null;
}

export const useUndoRedo = (
  fileData: FileData | null, 
  selectedItem: ResourceItem | null, 
  setFileData: React.Dispatch<React.SetStateAction<FileData | null>>, 
  setSelectedItem: React.Dispatch<React.SetStateAction<ResourceItem | null>>
) => {
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);

  const saveUndoState = () => {
    if (!fileData) return;
    
    setUndoStack(prev => [
      ...prev, 
      { 
        items: JSON.parse(JSON.stringify(fileData.items)),
        selectedItem: selectedItem ? JSON.parse(JSON.stringify(selectedItem)) : null
      }
    ]);
    setRedoStack([]);
  };
  
  const handleUndo = () => {
    if (undoStack.length === 0 || !fileData) return;
    
    const currentState = {
      items: JSON.parse(JSON.stringify(fileData.items)),
      selectedItem: selectedItem ? JSON.parse(JSON.stringify(selectedItem)) : null
    };
    
    const prevState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    if (fileData) {
      setFileData({
        ...fileData,
        items: prevState.items
      });
    }
    
    setSelectedItem(prevState.selectedItem);
    toast.info("Undo successful");
  };
  
  const handleRedo = () => {
    if (redoStack.length === 0 || !fileData) return;
    
    const currentState = {
      items: JSON.parse(JSON.stringify(fileData.items)),
      selectedItem: selectedItem ? JSON.parse(JSON.stringify(selectedItem)) : null
    };
    
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    if (fileData) {
      setFileData({
        ...fileData,
        items: nextState.items
      });
    }
    
    setSelectedItem(nextState.selectedItem);
    toast.info("Redo successful");
  };

  return {
    undoStack,
    redoStack,
    saveUndoState,
    handleUndo,
    handleRedo
  };
};
