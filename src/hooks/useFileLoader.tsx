
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
      
      console.log("About to parse file content with length:", content.length);
      const data = parseTextFile(content);
      console.log("File data loaded:", data.items.length, "items");
      
      // Check if this is a spec_item.txt file (case insensitive)
      // Instead of hardcoding the filename, try to detect it from the content
      const firstLine = content.split('\n')[0];
      console.log("First line of content:", firstLine);
      
      // If the first line contains column headers typical of Spec_item.txt
      const isSpecItemFile = firstLine.includes('dwID') && 
                            firstLine.includes('szName') && 
                            firstLine.includes('dwItemKind1');
      console.log("Is spec item file (detected from content):", isSpecItemFile);
      
      // Store the original content for spec_item.txt files to preserve exact format
      if (isSpecItemFile) {
        data.originalContent = content;
        data.isSpecItemFile = true;
        console.log("Stored original content for spec_item.txt file");
      }
      
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
