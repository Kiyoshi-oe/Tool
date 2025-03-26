import { useState, useEffect } from "react";
import { FileData, LogEntry, ResourceItem } from "../types/fileTypes";
import { parseTextFile, getPropItemMappings } from "../utils/file";
import { parsePropItemFile } from "../utils/file/propItemUtils";
import { loadDefineItemFile } from "../utils/file/defineItemParser";
import { loadMdlDynaFile } from "../utils/file/mdlDynaParser";
import { toast } from "sonner";

// Leeres FileData Objekt für Initialisierung
const emptyFileData: FileData = {
  header: [],
  items: []
};

export const useFileLoader = (
  settings: any, 
  setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>
) => {
  // Initialisiere mit leerem FileData Objekt anstatt null
  const [fileData, setFileData] = useState<FileData>(emptyFileData);
  
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
        const mappings = parsePropItemFile(propItemContent);
        console.log("PropItem mappings loaded:", {
          totalMappings: Object.keys(mappings).length,
          sampleMappings: Object.entries(mappings)
            .filter(([key]) => {
              const num = parseInt(key.replace(/.*IDS_PROPITEM_TXT_/, ""));
              return !isNaN(num) && num >= 7342 && num <= 11634;
            })
            .slice(0, 5)
            .map(([key, value]) => ({
              key,
              displayName: value.displayName,
              description: value.description
            }))
        });
      }
      
      // Setze einen leeren Zwischenzustand, um die Anzeige zurückzusetzen
      setFileData(emptyFileData);
      
      console.log("About to parse file content with length:", content.length);
      const parsedData = parseTextFile(content);
      
      // Überprüfe, ob das Ergebnis der Datei-Analyse ein FileData-Objekt oder 
      // ein einfaches Header-Data-Objekt ist
      let data: FileData;
      
      if ('items' in parsedData) {
        // Es ist bereits ein FileData-Objekt
        data = parsedData as FileData;
        console.log("File data loaded:", data.items?.length || 0, "items");
      } else {
        // Es ist ein Header-Data-Objekt, konvertiere es zu FileData
        const { headers, data: rowData } = parsedData as { headers: string[], data: Record<string, string>[] };
        
        // Stelle sicher, dass mindestens ein Header existiert
        const safeHeaders = headers.length > 0 ? headers : ['Column1'];
        
        // Konvertiere das Format zu FileData mit sicheren Fallbacks
        data = {
          header: safeHeaders,
          items: rowData.map((row, index) => {
            // Sichere Default-Werte für wichtige Eigenschaften
            const firstColumn = safeHeaders[0];
            const itemName = row[firstColumn] || `Item_${index}`;
            
            const item: ResourceItem = {
              id: `item_${index}`,
              name: itemName,
              displayName: itemName,
              description: '',
              data: row,
              effects: []
            };
            return item;
          })
        };
        
        console.log("Converted header/data format to FileData with", data.items.length, "items");
        
        // Falls keine Items erstellt wurden, füge ein Dummy-Item hinzu
        if (data.items.length === 0 && rowData.length > 0) {
          console.warn("No items were created from data, adding a fallback item");
          data.items = [
            {
              id: "fallback_1",
              name: "Data Entry 1",
              displayName: "Data Entry 1",
              description: "Automatically created entry",
              data: rowData[0] || {},
              effects: []
            }
          ];
        }
      }
      
      // Check if this is a spec_item.txt file (case insensitive)
      // Instead of hardcoding the filename, try to detect it from the content
      const firstLine = content.split('\n')[0] || '';
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
      
      // Verarbeite die Items - sicher mit Nullchecks
      if (data.items && data.items.length > 0) {
        const propMappings = getPropItemMappings();
        const mappingCount = Object.keys(propMappings).length;
        console.log("Available mappings for items:", mappingCount);
        
        if (mappingCount > 0) {
          // Apply the name and description mappings to all items
          data.items = data.items.map(item => {
            const idPropItem = item.data?.szName as string;
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
      }
      
      // Log Debugging Info
      console.log("Final data to be set:", {
        headerLength: data.header?.length || 0,
        itemsLength: data.items?.length || 0,
        hasItems: Boolean(data.items && data.items.length > 0)
      });
      
      // Setze die Daten
      setFileData(data);
      
      if (data.items && data.items.length > 0) {
        console.log("First few items after processing:", data.items.slice(0, 3).map(
          item => `${item.id}: ${item.displayName || item.name} - ${item.description?.substring(0, 30) || 'No description'}`
        ));
      } else {
        console.warn("No items available to display after processing");
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
      
      const itemCount = data.items?.length || 0;
      toast.success(`File loaded successfully with ${itemCount} items${propItemContent ? ' and item names from propItem.txt.txt' : ''}`);
    } catch (error) {
      console.error("Error parsing file:", error);
      
      // Im Fehlerfall setze ein FileData-Objekt mit einer Fehlermeldung
      const errorData: FileData = {
        header: ["Error"],
        items: [{
          id: "error_1",
          name: "Error loading file",
          displayName: "Error loading file",
          description: String(error),
          data: { Error: String(error) },
          effects: []
        }]
      };
      
      setFileData(errorData);
      toast.error("Error parsing file: " + String(error));
    }
  };

  return {
    fileData,
    setFileData,
    handleLoadFile
  };
};
