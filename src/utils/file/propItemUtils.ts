import { setPropItemMappings } from './parseUtils';

// Interface for propItem data mapping
interface PropItemMapping {
  [key: string]: { name: string; description: string; displayName: string };
}

export const parsePropItemFile = (content: string, settings: any = { enableDebug: false }): PropItemMapping => {
  if (!content) {
    console.warn("PropItem content is empty");
    return {};
  }
  
  const mappings: PropItemMapping = {};
  // Aufteilen in Zeilen
  const lines = content.split(/\r?\n/);
  
  // Performance-Optimierung: Text in Chungs aufteilen und verarbeiten
  const chunkSize = 300; // Verarbeite 300 Zeilen auf einmal
  const totalChunks = Math.ceil(lines.length / chunkSize);
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startIndex = chunkIndex * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, lines.length);
    const currentLines = lines.slice(startIndex, endIndex);
    
    for (const line of currentLines) {
      // Ignoriere leere Zeilen und Kommentare
      if (!line.trim() || line.trim().startsWith('//')) continue;
      
      // Extrahiere Daten aus der Zeile
      const trimmedLine = line.trim();
      
      // Format 1: ID\tName (Tab-getrennt)
      if (trimmedLine.includes('\t')) {
        const parts = trimmedLine.split('\t');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const value = parts[1].trim();
          
          // Überprüfe, ob es eine gültige ID im Format IDS_PROPITEM_TXT_XXXX ist
          const idMatch = id.match(/IDS_PROPITEM_TXT_(\d+)/);
          if (!idMatch) continue;
          
          const idNumber = parseInt(idMatch[1]);
          if (isNaN(idNumber)) continue;
          
          // Prüfe, ob dies ein Name (gerade) oder eine Beschreibung (ungerade) ist
          if (idNumber % 2 === 0) { // Gerade Zahl - Name
            const formattedId = `IDS_PROPITEM_TXT_${idNumber.toString().padStart(6, '0')}`;
            
            if (settings.enableDebug && idNumber >= 123 && idNumber <= 200) {
              console.log(`Found mapping tab: ${formattedId} -> "${value}"`);
            }
            
            mappings[formattedId] = {
              name: formattedId,
              displayName: value,
              description: ""
            };
            
            // Speichere auch die ursprüngliche ID als Mapping
            if (id !== formattedId) {
              mappings[id] = {
                name: id,
                displayName: value,
                description: ""
              };
            }
          } else { // Ungerade Zahl - Beschreibung
            const nameId = `IDS_PROPITEM_TXT_${(idNumber - 1).toString().padStart(6, '0')}`;
            
            if (mappings[nameId]) {
              mappings[nameId].description = value;
            } else {
              mappings[id] = {
                name: id,
                displayName: id,
                description: value
              };
            }
          }
        }
      }
      // Format 2: IDS_PROPITEM_TXT_XXX Name (Leerzeichen-getrennt)
      else if (trimmedLine.startsWith('IDS_PROPITEM_TXT_')) {
        // Finde die erste Position nach der ID
        const idMatch = trimmedLine.match(/^(IDS_PROPITEM_TXT_\d+)/);
        if (!idMatch) continue;
        
        const id = idMatch[1];
        const value = trimmedLine.substring(id.length).trim();
        
        if (!value) continue; // Überspringe Zeilen ohne Wert
        
        // Extrahiere die numerische ID
        const numMatch = id.match(/IDS_PROPITEM_TXT_(\d+)/);
        if (!numMatch) continue;
        
        const idNumber = parseInt(numMatch[1]);
        if (isNaN(idNumber)) continue;
        
        // Prüfe, ob dies ein Name (gerade) oder eine Beschreibung (ungerade) ist
        if (idNumber % 2 === 0) { // Gerade Zahl - Name
          const formattedId = `IDS_PROPITEM_TXT_${idNumber.toString().padStart(6, '0')}`;
          
          if (settings.enableDebug && idNumber >= 123 && idNumber <= 200) {
            console.log(`Found mapping space: ${formattedId} -> "${value}"`);
          }
          
          mappings[formattedId] = {
            name: formattedId,
            displayName: value,
            description: ""
          };
          
          // Speichere auch die ursprüngliche ID als Mapping
          if (id !== formattedId) {
            mappings[id] = {
              name: id,
              displayName: value,
              description: ""
            };
          }
        } else { // Ungerade Zahl - Beschreibung
          const nameId = `IDS_PROPITEM_TXT_${(idNumber - 1).toString().padStart(6, '0')}`;
          
          if (mappings[nameId]) {
            mappings[nameId].description = value;
          } else {
            mappings[id] = {
              name: id,
              displayName: id,
              description: value
            };
          }
        }
      }
    }
    
    // Gib dem Browser Zeit zum Atmen nach jedem Chunk
    if (settings.enableDebug && chunkIndex % 3 === 2 && chunkIndex < totalChunks - 1) {
      console.log(`Processed ${Object.keys(mappings).length} mappings so far...`);
    }
  }
  
  const mappingCount = Object.keys(mappings).length;
  console.log(`✅ PropItem Mappings loaded: ${mappingCount}`);
  
  // Stichprobenartige Überprüfung wichtiger Mappings nur wenn Debug aktiviert ist
  if (settings.enableDebug) {
    const criticalItems = [
      "IDS_PROPITEM_TXT_000124",
      "IDS_PROPITEM_TXT_007342",
      "IDS_PROPITEM_TXT_011634"
    ];
    
    console.log("Checking critical items in mappings:");
    criticalItems.forEach(id => {
      if (mappings[id]) {
        console.log(`Found critical item ${id}: ${mappings[id].displayName}`);
      } else {
        console.warn(`❌ Critical item not found: ${id}`);
        // Versuche alternative Formatierung
        const altId = id.replace(/IDS_PROPITEM_TXT_(\d+)/, (_, num) => 
          `IDS_PROPITEM_TXT_${parseInt(num).toString().padStart(6, '0')}`
        );
        if (mappings[altId]) {
          console.log(`Found critical item with alternative format ${altId}: ${mappings[altId].displayName}`);
        } else {
          console.warn(`❌ Critical item not found with alternative format: ${altId}`);
        }
      }
    });
  }
  
  // Cache the mappings for future use
  setPropItemMappings(mappings, settings);
  return mappings;
};
