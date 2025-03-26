import { setPropItemMappings } from './parseUtils';

// Interface for propItem data mapping
interface PropItemMapping {
  [key: string]: { name: string; description: string; displayName: string };
}

export const parsePropItemFile = (content: string): PropItemMapping => {
  console.log("parsePropItemFile called with content length:", content.length);
  
  // Überprüfe auf nicht-standardmäßige Codierungen nur bei den ersten 1000 Zeichen
  const hasNonASCII = /[^\x00-\x7F]/.test(content.substring(0, 1000));
  if (hasNonASCII) {
    console.warn("Non-ASCII characters detected in propItem.txt.txt file. This may indicate an encoding issue.");
  }
  
  // Versuche verschiedene Zeilenenden und wähle das effektivste
  let lines;
  if (content.indexOf('\r\n') !== -1) {
    lines = content.split('\r\n');
    console.log("Using CRLF line endings, found", lines.length, "lines");
  } else if (content.indexOf('\n') !== -1) {
    lines = content.split('\n');
    console.log("Using LF line endings, found", lines.length, "lines");
  } else if (content.indexOf('\r') !== -1) {
    lines = content.split('\r');
    console.log("Using CR line endings, found", lines.length, "lines");
  } else {
    // Fallback für den unwahrscheinlichen Fall, dass keine Zeilenumbrüche gefunden werden
    lines = [content];
    console.warn("No line breaks found, treating entire content as single line");
  }
  
  // Begrenzte Beispielausgabe nur für Diagnose
  if (lines.length > 0) {
    console.log("First line sample:", lines[0].substring(0, 100) + (lines[0].length > 100 ? '...' : ''));
  }
  
  const mappings: PropItemMapping = {};
  
  // BOM entfernen, wenn vorhanden
  let startIndex = 0;
  if (lines.length > 0 && (lines[0].charCodeAt(0) === 0xFEFF || lines[0].startsWith("\uFEFF"))) {
    console.log("BOM detected, removing...");
    lines[0] = lines[0].substring(1);
  }
  
  // Verarbeitung in Chunks
  const chunkSize = 5000;
  const totalChunks = Math.ceil(lines.length / chunkSize);
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startLine = chunkIndex * chunkSize;
    const endLine = Math.min(startLine + chunkSize, lines.length);
    
    if (chunkIndex === 0 || chunkIndex === totalChunks - 1 || chunkIndex % 5 === 0) {
      console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (lines ${startLine}-${endLine})`);
    }
    
    for (let i = startLine; i < endLine; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Problematische Zeichen entfernen
      const cleanedLine = line.replace(/[\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
      
      // Teile die Zeile nach Tab-Zeichen oder Leerzeichen
      let parts: string[] = [];
      
      // Entferne zusätzliche Leerzeichen am Anfang und Ende
      const trimmedLine = cleanedLine.trim();
      
      // Versuche verschiedene Parsing-Methoden
      if (trimmedLine.includes('\t')) {
        // Tab-getrennte Werte
        parts = trimmedLine.split('\t');
      } else {
        // Suche nach der ID und dem Rest mit regulärem Ausdruck
        // Berücksichtige verschiedene Textformate (mit und ohne Klammern)
        const match = trimmedLine.match(/^(IDS_PROPITEM_TXT_\d+)\s+(.+)$/);
        if (match) {
          const [, id, rest] = match;
          parts = [id.trim(), rest.trim()];
          
          // Debug-Ausgabe für problematische IDs
          if (id.includes("007342")) {
            console.log("Found problematic ID:", {
              originalLine: trimmedLine,
              parsedId: id,
              parsedValue: rest,
              parts
            });
          }
        }
      }
      
      if (parts.length < 2) continue;
      
      const id = parts[0].trim();
      const value = parts[1].trim();
      
      if (!value) continue;
      
      // Extrahiere den numerischen Teil der ID
      if (id.includes("IDS_PROPITEM_TXT_")) {
        const numericPart = id.replace(/.*IDS_PROPITEM_TXT_/, "");
        const idNumber = parseInt(numericPart, 10);
        
        if (isNaN(idNumber)) {
          console.warn(`Invalid numeric part in ID: ${id}`);
          continue;
        }
        
        // Prüfe, ob dies ein Name (gerade) oder eine Beschreibung (ungerade) ist
        if (idNumber % 2 === 0) { // Gerade Zahl - Name
          // Stelle sicher, dass die ID im korrekten Format ist
          const formattedId = `IDS_PROPITEM_TXT_${idNumber.toString().padStart(6, '0')}`;
          
          // Debug-Ausgabe für wichtige Bereiche
          if (idNumber >= 7342 && idNumber <= 11634) {
            console.log(`Found mapping in critical range: ${formattedId} -> "${value}" (original line: "${trimmedLine}")`);
          }
          
          // Speichere das Mapping
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
          // Finde die zugehörige ID (vorherige gerade Zahl)
          const nameId = `IDS_PROPITEM_TXT_${(idNumber - 1).toString().padStart(6, '0')}`;
          
          if (mappings[nameId]) {
            mappings[nameId].description = value;
          } else {
            // Erstelle einen Platzhalter-Eintrag für die Beschreibung
            mappings[id] = {
              name: id,
              displayName: id, // Verwende ID als Fallback
              description: value
            };
          }
        }
      }
    }
    
    // Gib dem Browser Zeit zum Atmen nach jedem Chunk
    if (chunkIndex % 3 === 2 && chunkIndex < totalChunks - 1) {
      console.log(`Processed ${Object.keys(mappings).length} mappings so far...`);
    }
  }
  
  const mappingCount = Object.keys(mappings).length;
  console.log(`✅ PropItem Mappings loaded: ${mappingCount}`);
  
  // Stichprobenartige Überprüfung wichtiger Mappings
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
  
  // Cache the mappings for future use
  setPropItemMappings(mappings);
  return mappings;
};
