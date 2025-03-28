import { useState, useEffect } from "react";
import { FileData, LogEntry, ResourceItem } from "../types/fileTypes";
import { parseTextFile, getPropItemMappings } from "../utils/file";
import { parsePropItemFile } from "../utils/file/propItemUtils";
import { loadDefineItemFile } from "../utils/file/defineItemParser";
import { loadMdlDynaFile } from "../utils/file/mdlDynaParser";
import { toast } from "sonner";
import { useChunkedData } from "./useChunkedData";

// Leeres FileData Objekt für Initialisierung
const emptyFileData: FileData = {
  header: [],
  items: []
};

// Loading Status
export type LoadingStatus = 'idle' | 'loading' | 'partial' | 'complete' | 'error';

export const useFileLoader = (
  settings: any, 
  setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>
) => {
  // Initialisiere mit leerem FileData Objekt anstatt null
  const [fileData, setFileData] = useState<FileData>(emptyFileData);
  // Neuer Status für Ladestatus und Fortschritt
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Initialer Inhalt (später mit useChunkedData ergänzt)
  const [initialSpecItemContent, setInitialSpecItemContent] = useState<string | null>(null);
  const [initialPropItemContent, setInitialPropItemContent] = useState<string | null>(null);
  
  // Verwende den neuen useChunkedData Hook
  const { 
    data: fullSpecItemContent, 
    isFullyLoaded: specItemFullyLoaded,
    loadProgress: specItemProgress 
  } = useChunkedData(initialSpecItemContent, 'specItem');
  
  const { 
    data: fullPropItemContent, 
    isFullyLoaded: propItemFullyLoaded,
    loadProgress: propItemProgress 
  } = useChunkedData(initialPropItemContent, 'propItem');
  
  // Load additional files when the component mounts
  useEffect(() => {
    loadAdditionalFiles();
  }, []);
  
  // Effekt zum Verarbeiten der Daten, wenn vollständig geladen
  useEffect(() => {
    // Nur verarbeiten, wenn wir im Lademodus sind und Daten vorliegen
    if (loadingStatus === 'partial' && fullSpecItemContent) {
      if (specItemFullyLoaded && propItemFullyLoaded) {
        // Beide Dateien vollständig geladen
        processLoadedContent(fullSpecItemContent, fullPropItemContent);
        setLoadingStatus('complete');
      } else if (specItemFullyLoaded && !initialPropItemContent) {
        // Spec item vollständig, keine propItem-Datei gewünscht
        processLoadedContent(fullSpecItemContent, null);
        setLoadingStatus('complete');
      }
    }
  }, [
    fullSpecItemContent, 
    fullPropItemContent, 
    specItemFullyLoaded, 
    propItemFullyLoaded, 
    loadingStatus
  ]);
  
  // Effekt für Ladefortschritt-Updates
  useEffect(() => {
    // Berechne gemeinsamen Fortschritt, gewichtet nach Dateigröße
    let combinedProgress = 0;
    
    if (initialPropItemContent) {
      // Wenn beide Dateien, gewichtet nach Größenverhältnis (70/30)
      combinedProgress = (specItemProgress * 0.7) + (propItemProgress * 0.3);
    } else {
      // Wenn nur specItem, dann 100% Gewichtung
      combinedProgress = specItemProgress;
    }
    
    setLoadProgress(Math.round(combinedProgress));
  }, [specItemProgress, propItemProgress, initialPropItemContent]);
  
  const loadAdditionalFiles = async () => {
    try {
      // Load defineItem.h
      await loadDefineItemFile(settings);
      
      // Load mdlDyna.inc
      await loadMdlDynaFile(settings);
    } catch (error) {
      console.error("Error loading additional files:", error);
    }
  };
  
  // Aktualisierte Funktion zum Laden der Datei
  const handleLoadFile = (content: string, propItemContent?: string) => {
    try {
      console.log("handleLoadFile called with content length:", content.length);
      console.log("propItemContent provided:", !!propItemContent);
      
      // Setze Ladestatus auf 'partial' (teilweise geladen)
      setLoadingStatus('partial');
      
      // Speichere den initialen Inhalt für die Chunks-Verarbeitung
      setInitialSpecItemContent(content);
      if (propItemContent) {
        setInitialPropItemContent(propItemContent);
      }
      
      // Setze einen leeren Zwischenzustand, um die Anzeige zurückzusetzen
      setFileData(emptyFileData);
      
      // Prüfe, ob wir in einem "großen Datei"-Modus sind und erstelle einen Platzhalter
      if (window.APP_CONFIG?.USING_LARGE_FILES) {
        // Erster Block der Datei enthält Header und erste Zeilen
        // Wir erstellen einen Platzhalter, bis alle Daten geladen sind
        const lines = content.split('\n');
        const headers = lines[0]?.split('\t') || ['ID', 'Name'];
        
        // Erstelle eine Platzhalter-FileData mit Ladeindikator
        const placeholderData: FileData = {
          header: headers,
          items: [{
            id: "loading_1",
            name: "Daten werden geladen...",
            displayName: `Daten werden geladen... (${loadProgress}%)`,
            description: 'Bitte warten Sie, während die Datei im Hintergrund geladen wird.',
            data: {},
            effects: []
          }],
          isLoading: true,
          loadingProgress: loadProgress
        };
        
        // Setze die Platzhalter-Daten
        setFileData(placeholderData);
        
        // Zeige Ladetoast
        toast.info(`Datei wird geladen... (${loadProgress}%)`);
        
        return; // Früher zurückkehren, vollständige Verarbeitung erfolgt im useEffect
      } else {
        // Für kleine Dateien direkt verarbeiten
        processLoadedContent(content, propItemContent);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      setLoadingStatus('error');
      
      // Im Fehlerfall setze ein FileData-Objekt mit einer Fehlermeldung
      const errorData: FileData = {
        header: ["Error"],
        items: [{
          id: "error_1",
          name: "Error loading file",
          displayName: "Error loading file",
          description: `${error}`,
          data: {},
          effects: []
        }]
      };
      
      setFileData(errorData);
      toast.error("Fehler beim Laden der Datei");
    }
  };
  
  // Neue Funktion für die eigentliche Verarbeitung der geladenen Inhalte
  const processLoadedContent = (content: string, propItemContent: string | null) => {
    try {
      console.log("Processing loaded content with length:", content.length);
      
      if (propItemContent) {
        console.log("propItemContent provided, parsing...");
        const mappings = parsePropItemFile(propItemContent, settings);
        console.log("PropItem mappings loaded:", Object.keys(mappings).length);
      }
      
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
            // Verwende die szName-Property oder fallback auf IDS_PROPITEM-ID
            const idPropItem = item.data?.szName as string;
            let matched = false;
            
            // Direktes Mapping über szName (üblicher Fall)
            if (idPropItem && propMappings[idPropItem]) {
              matched = true;
              if (settings.enableDebug) {
                console.log(`Applying mapping for item ${item.id}: ${idPropItem} -> "${propMappings[idPropItem].displayName}"`);
              }
              return {
                ...item,
                displayName: propMappings[idPropItem].displayName || idPropItem,
                description: propMappings[idPropItem].description || ""
              };
            }
            
            // Versuche alternative Formatierungen für den idPropItem
            if (idPropItem && idPropItem.includes("IDS_PROPITEM_TXT_")) {
              // Versuche mit führenden Nullen
              const formattedId = idPropItem.replace(/IDS_PROPITEM_TXT_(\d+)/, (_, num) => 
                `IDS_PROPITEM_TXT_${parseInt(num).toString().padStart(6, '0')}`
              );
              
              if (propMappings[formattedId]) {
                matched = true;
                return {
                  ...item,
                  displayName: propMappings[formattedId].displayName || idPropItem,
                  description: propMappings[formattedId].description || ""
                };
              }
              
              // Versuche ohne führende Nullen
              const numericMatch = idPropItem.match(/IDS_PROPITEM_TXT_0*(\d+)/);
              if (numericMatch) {
                const alternateId = `IDS_PROPITEM_TXT_${numericMatch[1]}`;
                if (propMappings[alternateId]) {
                  matched = true;
                  return {
                    ...item,
                    displayName: propMappings[alternateId].displayName || idPropItem,
                    description: propMappings[alternateId].description || ""
                  };
                }
              }
            }
            
            // Wenn keine Zuordnung gefunden wurde, behalte die ursprünglichen Daten bei
            if (!matched && settings.enableDebug) {
              console.warn(`No mapping found for item ${item.id}: ${idPropItem}`);
            }
            return item;
          });
        }
      }
      
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
      toast.success(`Datei erfolgreich geladen mit ${itemCount} Einträgen${propItemContent ? ' und Itemnamen aus propItem.txt.txt' : ''}`);
    } catch (error) {
      console.error("Error processing data:", error);
      setLoadingStatus('error');
      
      // Im Fehlerfall setze ein FileData-Objekt mit einer Fehlermeldung
      const errorData: FileData = {
        header: ["Error"],
        items: [{
          id: "error_1",
          name: "Error loading file",
          displayName: "Error loading file",
          description: `${error}`,
          data: {},
          effects: []
        }]
      };
      
      setFileData(errorData);
      toast.error("Fehler beim Verarbeiten der Datei");
    }
  };
  
  // Returniere das FileData-Objekt mit dem neuen Status und Fortschrittsinformationen
  return {
    fileData,
    handleLoadFile,
    loadingStatus,
    loadProgress,
    isLoading: loadingStatus === 'loading' || loadingStatus === 'partial'
  };
};
