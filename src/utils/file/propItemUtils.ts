
import { setPropItemMappings } from './parseUtils';

// Interface for propItem data mapping
interface PropItemMapping {
  [key: string]: { name: string; description: string; displayName: string };
}

export const parsePropItemFile = (content: string): PropItemMapping => {
  console.log("parsePropItemFile called with content length:", content.length);
  
  // Check for non-standard encodings
  const hasNonASCII = /[^\x00-\x7F]/.test(content.substring(0, 1000));
  if (hasNonASCII) {
    console.warn("Non-ASCII characters detected in propItem.txt.txt file. This may indicate an encoding issue.");
    
    // Try to log the first few bytes to diagnose encoding issues
    const bytes = [];
    for (let i = 0; i < Math.min(50, content.length); i++) {
      bytes.push(content.charCodeAt(i).toString(16).padStart(2, '0'));
    }
    console.log("First bytes (hex):", bytes.join(' '));
  }
  
  // Try different line endings
  let lines = content.split("\n");
  if (lines.length <= 1) {
    console.log("Trying alternative line endings...");
    lines = content.split("\r\n");
    if (lines.length <= 1) {
      lines = content.split("\r");
    }
  }
  
  console.log("PropItem lines count after splitting:", lines.length);
  
  // Print a sample of lines to diagnose problems
  console.log("Sample of first 5 lines:");
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const charCodes = Array.from(line).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    console.log(`Line ${i+1} (${line.length} chars): "${line.substring(0, 100)}"${line.length > 100 ? '...' : ''}`);
    console.log(`  Char codes: ${charCodes.substring(0, 100)}${charCodes.length > 100 ? '...' : ''}`);
  }
  
  const mappings: PropItemMapping = {};
  
  // Check for and remove BOM (Byte Order Mark) if present
  // Note: When using TextDecoder with the correct encoding, the BOM should already be handled,
  // but we'll keep this as a fallback
  let startIndex = 0;
  if (lines.length > 0) {
    if (lines[0].charCodeAt(0) === 0xFEFF) {
      console.log("UTF-8 BOM detected, removing...");
      lines[0] = lines[0].substring(1);
    } else if (lines[0].startsWith("\uFEFF")) {
      console.log("BOM detected at start of file, removing...");
      lines[0] = lines[0].substring(1);
    }
  }
  
  // Clean the lines to handle potential encoding issues
  const cleanedLines = lines.map(line => {
    // Replace common problematic characters
    return line.replace(/[\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  });
  
  // Process the propItem.txt.txt file
  // Format: IDS_PROPITEM_TXT_000124\tRodney Axe
  //         IDS_PROPITEM_TXT_000125\tA heavy cutting weapon with a sharp end. This axe is used for close combat
  
  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i].trim();
    if (!line) continue;
    
    // Split the line by tab character
    const parts = line.split("\t");
    if (parts.length < 2) {
      // Try alternative separators if tab doesn't work
      if (line.includes("  ")) {
        // Try multiple spaces as separator
        console.log(`Line ${i+1} might use spaces instead of tabs: "${line.substring(0, 50)}..."`);
        const spaceMatch = line.match(/^(\S+)\s{2,}(.+)$/);
        if (spaceMatch) {
          parts[0] = spaceMatch[1];
          parts[1] = spaceMatch[2];
          console.log(`  Parsed as: "${parts[0]}" and "${parts[1]}"`);
        } else {
          console.warn(`Line ${i+1} does not contain a tab character and couldn't parse spaces: "${line}"`);
          continue;
        }
      } else {
        console.warn(`Line ${i+1} does not contain a tab character: "${line}"`);
        continue;
      }
    }
    
    const id = parts[0].trim();
    const value = parts[1].trim();
    
    if (!value) {
      console.warn(`Line ${i+1} has empty value after separator: "${line}"`);
      continue;
    }
    
    // Extract the numeric part of the ID
    if (id.includes("IDS_PROPITEM_TXT_")) {
      const numericPart = id.replace(/.*IDS_PROPITEM_TXT_/, "");
      const idNumber = parseInt(numericPart, 10);
      
      if (isNaN(idNumber)) {
        console.warn(`Line ${i+1} has invalid ID format: "${id}"`);
        continue;
      }
      
      // Check if this is a name (even) or description (odd)
      // e.g., 000124 is name, 000125 is description for the same item
      const itemBaseId = Math.floor(idNumber / 2) * 2;
      const itemBaseIdString = `IDS_PROPITEM_TXT_${itemBaseId.toString().padStart(6, '0')}`;
      
      if (idNumber % 2 === 0) { // Even number - name
        mappings[id] = {
          name: id,
          displayName: value,
          description: ""
        };
        console.log(`Added name mapping: ${id} -> "${value}"`);
      } else { // Odd number - description
        // Find the related ID (previous even number)
        const nameId = `IDS_PROPITEM_TXT_${(idNumber - 1).toString().padStart(6, '0')}`;
        
        if (mappings[nameId]) {
          mappings[nameId].description = value;
          console.log(`Added description to ${nameId}: "${value.substring(0, 30)}..."`);
        } else {
          // Create a placeholder entry for the description
          mappings[id] = {
            name: id,
            displayName: id, // Use ID as fallback
            description: value
          };
          console.log(`Created placeholder for ${id} with description: "${value.substring(0, 30)}..."`);
        }
      }
    }
  }
  
  // Debug some sample mappings
  const mappingCount = Object.keys(mappings).length;
  console.log(`✅ PropItem Mappings loaded: ${mappingCount}`);
  
  if (mappingCount > 0) {
    const sampleKeys = Object.keys(mappings).slice(0, 3);
    for (const key of sampleKeys) {
      console.log(`Sample mapping for ${key}:`, {
        displayName: mappings[key].displayName,
        description: mappings[key].description.substring(0, 30) + (mappings[key].description.length > 30 ? '...' : '')
      });
    }
  }
  
  if (mappings["IDS_PROPITEM_TXT_000124"]) {
    console.log("Rodney Axe mapping:", 
      mappings["IDS_PROPITEM_TXT_000124"].name,
      "displayName:", mappings["IDS_PROPITEM_TXT_000124"].displayName,
      "description:", mappings["IDS_PROPITEM_TXT_000124"].description.substring(0, 30)
    );
  } else {
    console.log("❌ Rodney Axe mapping not found!");
  }
  
  // Cache the mappings for future use
  setPropItemMappings(mappings);
  return mappings;
};
