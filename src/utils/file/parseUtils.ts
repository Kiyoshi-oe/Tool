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
  const batchSize = 2000; // Kleinere Batches für bessere Performance
  const totalBatches = Math.ceil((lines.length - 1) / batchSize);
  
  // Reduziere häufige Log-Ausgaben bei großen Dateien
  console.log(`Processing ${lines.length - 1} data lines in ${totalBatches} batches of ${batchSize}`);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startLine = 1 + batchIndex * batchSize;
    const endLine = Math.min(startLine + batchSize, lines.length);
    const currentBatch: ResourceItem[] = [];
    
    // Minimiere Log-Ausgaben für bessere Performance
    if (batchIndex === 0 || batchIndex === totalBatches - 1 || batchIndex % 10 === 0) {
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches}, lines ${startLine}-${endLine}`);
    }
    
    for (let i = startLine; i < endLine; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = line.split("\t");
      if (values.length < 2) continue; // Skip invalid lines with less than 2 columns
      
      const data: ItemData = {};
      let id = "";
      let name = "";
      
      // Map values to column names from the header
      header.forEach((colName, index) => {
        // Skip empty column names
        if (!colName) return;
        
        // Handle the case where values might have fewer elements than header
        let value = index < values.length ? values[index].trim() : "";
        
        // Store the value under the original column name
        data[colName] = value;
        
        // Extract ID and name for reference
        if (colName === "//dwID" || colName === "dwID") {
          id = value;
          data["dwID"] = value;
        } else if (colName === "szName") {
          name = value;
        }
      });
      
      if (id) {
        // Get the name and description from propItem mappings if available
        let displayName = name;
        let description = '';
        let idPropItem = name; // Store the original propItem ID 
        
        // Only lookup in propItemMappings if we have entries
        if (Object.keys(propItemMappings).length > 0) {
          // Direct match by ID
          if (name && name.includes("IDS_PROPITEM_TXT_")) {
            // Verwende die Hilfsfunktion, um den Anzeigenamen zu erhalten
            const propItemName = getPropItemDisplayName(name);
            
            if (propItemName !== name) {
              // Wenn ein Name gefunden wurde (nicht die ID selbst zurückgegeben wurde)
              displayName = propItemName;
              console.log(`Found display name for ${name}: ${displayName}`);
            } else {
              console.warn(`No display name found for ${name}`);
            }
            
            // Beschreibung abfragen (falls vorhanden)
            if (propItemMappings[name]) {
              description = propItemMappings[name].description || "";
            }
          } else {
            // Try to find a mapping by name pattern
            const matchingKey = Object.keys(propItemMappings).find(key => {
              return key === name || name === key;
            });
            
            if (matchingKey) {
              displayName = propItemMappings[matchingKey].displayName || name;
              description = propItemMappings[matchingKey].description || "";
              idPropItem = matchingKey;
              console.log(`Found pattern match for ${name}: ${displayName}`);
            } else {
              console.warn(`No pattern match found for name: ${name}`);
            }
          }
        } else {
          console.warn("No propItem mappings available");
        }
        
        currentBatch.push({
          id,
          name,
          displayName,
          description,
          idPropItem,
          data,
          effects: [],
        });
      } else {
        // Wenn keine ID gefunden wurde, erstelle eine eigene anhand des Indexes
        currentBatch.push({
          id: `auto_${i}`,
          name: name || `Item_${i}`,
          displayName: name || `Item_${i}`, 
          description: '',
          idPropItem: '',
          data,
          effects: [],
        });
      }
    }
    
    // Füge den aktuellen Batch zu den Items hinzu
    items.push(...currentBatch);
    
    // Versuche Speicher freizugeben
    if (batchIndex % 5 === 4 && global.gc) {
      global.gc();
    }
  }
  
  console.log(`Parsed ${items.length} items from spec_item.txt format`);
  
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
