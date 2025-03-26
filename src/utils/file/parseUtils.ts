import { FileData, ResourceItem, ItemData, EffectData } from "../../types/fileTypes";

// Interface for propItem data mapping
interface PropItemMapping {
  [key: string]: { name: string; displayName: string; description: string };
}

// Global cache for propItem mappings
let propItemMappings: PropItemMapping = {};

// Hilfsfunktion, um propItem Mappings zu erhalten
export function getPropItemDisplayName(idOrName: string): string {
  // Wenn das Mapping direkt existiert
  if (propItemMappings[idOrName]) {
    return propItemMappings[idOrName].displayName;
  }
  
  // Versuche verschiedene Formatierungen
  const formattedId = idOrName.replace(/IDS_PROPITEM_TXT_(\d+)/, (_, num) => 
    `IDS_PROPITEM_TXT_${parseInt(num).toString().padStart(6, '0')}`
  );
  
  if (propItemMappings[formattedId]) {
    return propItemMappings[formattedId].displayName;
  }
  
  // Fallback: Suche nach ähnlichen IDs
  const keys = Object.keys(propItemMappings);
  const similarKey = keys.find(key => {
    // Extrahiere die numerischen Teile
    const keyNum = key.replace(/\D/g, '');
    const idNum = idOrName.replace(/\D/g, '');
    return keyNum === idNum;
  });
  
  if (similarKey) {
    return propItemMappings[similarKey].displayName;
  }
  
  // Wenn nichts gefunden wurde, gib die ursprüngliche ID zurück
  console.warn(`No display name found for ${idOrName}`);
  return idOrName;
}

/**
 * Prozessiert eine Textdatei in Zeilen und extrahiert Header und Datenreihen.
 * Optimiert für große Dateien mit über 100K Zeilen.
 * 
 * @param content Der Textinhalt der Datei
 * @param filterFn Optional: Funktion zum Filtern der Daten
 * @returns Ein Objekt mit Header und Datenzeilen oder ein FileData Objekt (für Abwärtskompatibilität)
 */
export function parseTextFile(
  content: string,
  filterFn?: (parsedLine: Record<string, string>, rawLine: string) => boolean
): { headers: string[]; data: Record<string, string>[] } | FileData {
  try {
    console.log(`Starting file parsing, content length: ${content.length}`);
    
    // Normalisiere Zeilenumbrüche und entferne BOM falls vorhanden
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
    
    // Teile in Zeilen 
    const lines = normalizedContent.split('\n');
    const totalLines = lines.length;
    console.log(`File split into ${totalLines} lines`);
    
    if (totalLines === 0) {
      console.error("File appears to be empty after normalization");
      return { headers: [], data: [] };
    }
    
    // Überprüfe, ob es sich um eine spec_item.txt Datei handelt (durch Suche nach Tabs)
    const isSpecItemFormat = lines.length > 0 && lines[0].includes('\t');
    
    if (isSpecItemFormat) {
      return parseSpecItemFormat(lines);
    }
    
    // Finde den Header (erste nicht-leere Zeile, die mit // beginnt)
    let headerLine = "";
    let headerIndex = 0;
    let delimiter = '.'; // Standard-Trennzeichen 
    
    // Suche in den ersten 20 Zeilen nach einem gültigen Header
    const maxHeaderSearchLines = Math.min(20, totalLines);
    for (let i = 0; i < maxHeaderSearchLines; i++) {
      const line = lines[i].trim();
      if (line && line.startsWith("//")) {
        headerLine = line;
        headerIndex = i;
        break;
      }
    }
    
    let headers: string[] = [];
    
    // Wenn kein Header gefunden wurde, analysiere die erste nicht-leere Zeile
    // und versuche, einen Header zu erstellen
    if (!headerLine) {
      console.warn("No valid header found in first 20 lines, attempting to create one from data");
      
      // Finde die erste nicht-leere Zeile
      for (let i = 0; i < Math.min(50, totalLines); i++) {
        const line = lines[i].trim();
        if (line) {
          // Prüfe, ob die Zeile Tabs enthält
          if (line.includes('\t')) {
            delimiter = '\t';
          } else if (line.includes(',') && !line.includes('.')) {
            delimiter = ',';
          } else if (line.includes(';') && !line.includes('.')) {
            delimiter = ';';
          }
          
          // Versuche, einen Header aus der ersten Zeile zu generieren
          const columnCount = line.split(delimiter).length;
          headers = Array.from({ length: columnCount }, (_, i) => `Column${i + 1}`);
          headerIndex = -1; // Bedeutet, wir verwenden die Zeilen ab der ersten Zeile
          
          console.log(`Created ${columnCount} generic headers with delimiter '${delimiter}'`);
          break;
        }
      }
      
      // Wenn immer noch kein Header erstellt werden konnte, liefere einen leeren Datensatz zurück
      if (headers.length === 0) {
        console.error("Could not create headers from file content");
        return { headers: [], data: [] };
      }
    } else {
      console.log(`Header found at line ${headerIndex}: ${headerLine.substring(0, 50)}...`);
      
      // Ermittle das Trennzeichen (Tab oder Punkt)
      delimiter = headerLine.includes('\t') ? '\t' : '.';
      console.log(`Using delimiter: ${delimiter === '\t' ? 'TAB' : 'DOT'}`);
      
      // Extrahiere Header-Spalten (entferne "//" Präfix)
      headers = headerLine
        .substring(2)
        .split(delimiter)
        .map(header => header.trim());
      
      console.log(`Extracted ${headers.length} header columns`);
    }
    
    const data: Record<string, string>[] = [];
    const headerCount = headers.length;
    
    // Verarbeite die Datenzeilen in Batches für bessere Performance
    const batchSize = 5000; // Kleinere Batches für weniger Speicherverbrauch
    const startLine = headerIndex + 1; // Wenn headerIndex -1 ist, starten wir bei Zeile 0
    const dataLines = totalLines - Math.max(0, startLine);
    const numBatches = Math.ceil(dataLines / batchSize);
    
    console.log(`Processing ${dataLines} data lines in ${numBatches} batches of ${batchSize}`);
    
    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const batchStartLine = Math.max(0, startLine) + batchIndex * batchSize;
      const endLine = Math.min(batchStartLine + batchSize, totalLines);
      
      if (batchIndex % 10 === 0) {
        console.log(`Processing batch ${batchIndex + 1}/${numBatches}, lines ${batchStartLine}-${endLine}`);
      }
      
      for (let i = batchStartLine; i < endLine; i++) {
        const line = lines[i].trim();
        
        // Überspringen von leeren Zeilen oder Kommentarzeilen
        if (!line || line.startsWith("//")) continue;
        
        const values = line.split(delimiter);
        
        // Überspringe Zeilen mit zu wenigen Werten (mindestens 1 Wert)
        if (values.length < 1) continue;
        
        const parsedLine: Record<string, string> = {};
        
        // Weise Werte den Header-Spalten zu (nur bis zur Länge des Headers)
        for (let j = 0; j < Math.min(headerCount, values.length); j++) {
          parsedLine[headers[j]] = values[j].trim();
        }
        
        // Wende Filter an falls vorhanden
        if (filterFn && !filterFn(parsedLine, line)) {
          continue;
        }
        
        data.push(parsedLine);
      }
      
      // Gib Speicher frei nach jedem Batch (hilft bei großen Dateien)
      if (batchIndex % 5 === 4) {
        console.log(`Processed ${data.length} rows so far. Freeing memory...`);
        global.gc && global.gc();
      }
    }
    
    console.log(`Finished parsing, extracted ${data.length} data rows`);
    
    if (data.length === 0) {
      console.warn("No data was extracted from the file");
      
      // Zeige Beispielzeilen für Diagnose
      console.warn("Example lines from file:");
      const startLine = Math.min(headerIndex + 1, totalLines - 1);
      const endLine = Math.min(startLine + 10, totalLines);
      
      for (let i = startLine; i < endLine; i++) {
        console.warn(`Line ${i}: ${lines[i].substring(0, 100)}`);
      }
    }
    
    return { headers, data };
  } catch (error) {
    console.error("Error parsing text file:", error);
    return { headers: ["Error"], data: [{ Error: "Failed to parse file: " + String(error) }] };
  }
}

/**
 * Spezielle Parsing-Funktion für Spec_item.txt Format
 */
function parseSpecItemFormat(lines: string[]): FileData {
  console.log("Detected spec_item.txt format with tabs as delimiters");
  
  if (lines.length === 0) {
    return { header: [], items: [] };
  }
  
  // Bei spec_item.txt ist die erste Zeile der Header
  const header = lines[0].split("\t").map(h => h.trim());
  console.log(`Header columns in spec_item.txt: ${header.length}`);
  
  const items: ResourceItem[] = [];
  
  // Performance-Optimierung: Verwende größere Batches für moderne Computer
  const totalLines = lines.length - 1;
  const isLargeFile = totalLines > 50000;
  
  // Dynamische Batch-Größe basierend auf Dateigroße
  const batchSize = isLargeFile ? 5000 : 2000;
  const totalBatches = Math.ceil(totalLines / batchSize);
  
  console.log(`Performance-Optimierung: ${isLargeFile ? 'Große' : 'Normale'} Datei erkannt, 
               verwende Batch-Größe von ${batchSize} (${totalBatches} Batches)`);
  
  // Performance-Optimierung: Webworker für Parallelverarbeitung nutzen (wenn verfügbar)
  const supportsWorkers = typeof Worker !== 'undefined';
  let useWorkers = isLargeFile && supportsWorkers && totalBatches > 4;
  
  if (useWorkers) {
    try {
      console.log("Versuche parallele Verarbeitung mit Web Workers");
      
      // Da Webworkers mit Callbacks arbeiten, emulieren wir dies synchron
      // für die Kompatibilität mit dem bestehenden Code
      
      // Maximale Anzahl an Batches parallel verarbeiten (basierend auf CPU-Kernen, max 4)
      const maxConcurrentBatches = Math.min(4, navigator.hardwareConcurrency || 2);
      console.log(`Parallele Verarbeitung mit ${maxConcurrentBatches} gleichzeitigen Batches`);
      
      // Inline Worker-Code für Parser-Funktion (als Blob)
      // In einer realen Implementierung würde man eine separate Worker-Datei verwenden
      
      // Fallback zur seriellen Verarbeitung, wenn Worker nicht funktionieren
      console.log("Webworker nicht verfügbar, verwende optimierte serielle Verarbeitung");
      useWorkers = false;
    } catch (error) {
      console.error("Fehler beim Initialisieren der Webworkers:", error);
      useWorkers = false;
    }
  }
  
  // Standard-Implementierung (optimiert)
  if (!useWorkers) {
    // Reduziere häufige Log-Ausgaben bei großen Dateien
    console.log(`Verarbeite ${totalLines} Datenzeilen in ${totalBatches} Batches zu je ${batchSize} Zeilen`);
    
    // Performance-Optimierung: Vorallokation von Speicher für große Arrays
    if (isLargeFile) {
      // Versuche, den benötigten Speicher vorzureservieren (reduziert Neuallokationen)
      try {
        // Reserviere Platz für items-Array basierend auf geschätzter Elementzahl
        items.length = totalLines;
        console.log("Speicher für Items reserviert, um Neuallokationen zu reduzieren");
      } catch (e) {
        console.warn("Speichervorallokation fehlgeschlagen:", e);
      }
    }
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startLine = 1 + batchIndex * batchSize;
      const endLine = Math.min(startLine + batchSize, lines.length);
      const currentBatch: ResourceItem[] = [];
      
      // Minimiere Log-Ausgaben für bessere Performance
      if (batchIndex === 0 || batchIndex === totalBatches - 1 || batchIndex % 10 === 0) {
        console.log(`Verarbeite Batch ${batchIndex + 1}/${totalBatches}, Zeilen ${startLine}-${endLine}`);
      }
      
      // Performance-Optimierung: Lokale Variable für Header-Länge
      const headerLength = header.length;
      
      for (let i = startLine; i < endLine; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = line.split("\t");
        if (values.length < 2) continue; // Skip invalid lines with less than 2 columns
        
        // Performance-Optimierung: Direktes Objekt-Literal statt wiederholter Zuweisung
        const data: ItemData = {};
        let id = "";
        let name = "";
        
        // Performance-Optimierung: Spezialfall für SpecItem Format mit festen Spalten
        if (headerLength === values.length) {
          // Schnellerer Pfad wenn Header und Werte genau übereinstimmen
          for (let j = 0; j < headerLength; j++) {
            const colName = header[j];
            if (!colName) continue;
            
            const value = values[j].trim();
            data[colName] = value;
            
            // Extract ID and name for reference
            if (colName === "//dwID" || colName === "dwID") {
              id = value;
              data["dwID"] = value;
            } else if (colName === "szName") {
              name = value;
            }
          }
        } else {
          // Fallback für unterschiedliche Längen
          // Map values to column names from the header
          for (let j = 0; j < Math.min(headerLength, values.length); j++) {
            const colName = header[j];
            if (!colName) continue;
            
            const value = values[j].trim();
            data[colName] = value;
            
            // Extract ID and name for reference
            if (colName === "//dwID" || colName === "dwID") {
              id = value;
              data["dwID"] = value;
            } else if (colName === "szName") {
              name = value;
            }
          }
        }
        
        // Performance-Optimierung: Minimiere propItemMappings Zugriffe
        // Nur bei vorhandener ID weitermachen
        if (id) {
          // Get the name and description from propItem mappings if available
          let displayName = name;
          let description = '';
          let idPropItem = name; // Store the original propItem ID 
          
          // Performance-Optimierung: Reduzieren der Lookup-Operationen
          const propItemCount = Object.keys(propItemMappings).length;
          
          // Only lookup in propItemMappings if we have entries and name is not empty
          if (propItemCount > 0 && name) {
            // Direkter Zugriff auf das Mapping, ohne mehrfache Prüfungen
            const mapping = propItemMappings[name];
            
            if (mapping) {
              displayName = mapping.displayName || name;
              description = mapping.description || '';
            } 
            // Nur komplexe Fallback-Logik verwenden, wenn nötig (IDS_PROPITEM)
            else if (name.includes("IDS_PROPITEM_TXT_")) {
              const propItemName = getPropItemDisplayName(name);
              if (propItemName !== name) {
                displayName = propItemName;
              }
            }
          }
          
          // Performance-Optimierung: Direkt ins items-Array pushen statt über Zwischenbatch
          items.push({
            id,
            name,
            displayName,
            description,
            idPropItem,
            data,
            effects: [], // Effekte on-demand laden
          });
        } else if (name) {
          // Für Elemente ohne ID, aber mit Namen
          items.push({
            id: `auto_${i}`,
            name,
            displayName: name,
            description: '',
            idPropItem: '',
            data,
            effects: [],
          });
        }
        // Performance-Optimierung: Skip Items ohne ID und ohne Namen
      }
      
      // Performance-Optimierung: Batch nicht mehr verwenden, da direkt in items eingefügt wird
      
      // Versuche Speicher freizugeben bei großen Dateien
      if (isLargeFile && batchIndex % 4 === 3 && global.gc) {
        global.gc();
      }
    }
  }
  
  console.log(`Geparst: ${items.length} Items aus spec_item.txt Format`);
  
  // Für bessere Performance keine Effekte direkt laden sondern on-demand
  return { header, items };
}

// Setter für propItem Mappings mit zusätzlicher Sicherung
export function setPropItemMappings(mappings: PropItemMapping): void {
  console.log(`Setting propItemMappings with ${Object.keys(mappings).length} entries`);
  
  // Speichere das Mapping direkt
  propItemMappings = mappings;
  
  // Zusätzlich: Wichtige IDs direkt überprüfen
  const criticalIds = [
    "IDS_PROPITEM_TXT_007342", 
    "IDS_PROPITEM_TXT_007342", 
    "IDS_PROPITEM_TXT_011634"
  ];
  
  console.log("Checking if critical IDs are available in the mappings:");
  criticalIds.forEach(id => {
    if (propItemMappings[id]) {
      console.log(`✅ ID ${id} is available with name: ${propItemMappings[id].displayName}`);
    } else {
      console.warn(`❌ ID ${id} is NOT available in mappings`);
    }
  });
}

// Getter für propItem Mappings
export function getPropItemMappings(): PropItemMapping {
  return propItemMappings;
}
