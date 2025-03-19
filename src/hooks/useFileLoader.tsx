
import { useState, useEffect } from "react";
import { FileData, LogEntry } from "../types/fileTypes";
import { parseTextFile, getPropItemMappings } from "../utils/file";
import { parsePropItemFile } from "../utils/file/propItemUtils";
import { loadDefineItemFile } from "../utils/file/defineItemParser";
import { loadMdlDynaFile } from "../utils/file/mdlDynaParser";
import { toast } from "sonner";

export const useFileLoader = (
  settings: any, 
  setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>
) => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  
  // Load additional files when the component mounts
  useEffect(() => {
    loadAdditionalFiles();
  }, []);
  
  const loadAdditionalFiles = async () => {
    try {
      // Load defineItem.h
      await loadDefineItemFile();
      
      // Load mdlDyna.inc
      await loadMdlDynaFile();
    } catch (error) {
      console.error("Error loading additional files:", error);
    }
  };
  
  const handleLoadFile = (content: string, propItemContent?: string) => {
    try {
      console.log("handleLoadFile called with content length:", content.length);
      console.log("propItemContent provided:", !!propItemContent);
      
      if (propItemContent) {
        console.log("propItemContent provided, parsing...");
        parsePropItemFile(propItemContent);
        console.log("PropItem mappings loaded");
      }
      
      const data = parseTextFile(content);
      console.log("File data loaded:", data.items.length, "items");
      
      // Force a clean state update
      setFileData(null);
      
      // Then set the new data
      setTimeout(() => {
        if (data.items.length > 0) {
          const propMappings = getPropItemMappings();
          console.log("Available mappings for items:", Object.keys(propMappings).length);
          
          // Apply the name and description mappings to all items
          data.items = data.items.map(item => {
            const idPropItem = item.data.szName as string;
            if (idPropItem && propMappings[idPropItem]) {
              console.log(`Applying mapping for item ${item.id}: ${idPropItem} -> "${propMappings[idPropItem].displayName}"`);
              return {
                ...item,
                displayName: propMappings[idPropItem].displayName || idPropItem,
                description: propMappings[idPropItem].description || ""
              };
            }
            return item;
          });
        }
        
        setFileData(data);
        
        if (data.items.length > 0) {
          console.log("First few items after name mapping:", data.items.slice(0, 3).map(
            item => `${item.id}: ${item.displayName || item.name} - ${item.description?.substring(0, 30) || 'No description'}`
          ));
        }
        
        // Load additional files after loading the main file
        loadAdditionalFiles();
        
        if (settings.enableLogging) {
          const newLogEntry: LogEntry = {
            timestamp: Date.now(),
            itemId: "file-load",
            itemName: "File Load",
            field: "file",
            oldValue: "",
            newValue: `Loaded at ${new Date().toLocaleTimeString()}${propItemContent ? ' with propItem mappings' : ''}`
          };
          setLogEntries(prev => [newLogEntry, ...prev]);
        }
        
        toast.success(`File loaded successfully with ${data.items.length} items${propItemContent ? ' and item names from propItem.txt.txt' : ''}`);
      }, 0);
    } catch (error) {
      toast.error("Error parsing file");
      console.error("Error parsing file:", error);
    }
  };

  return {
    fileData,
    setFileData,
    handleLoadFile
  };
};
