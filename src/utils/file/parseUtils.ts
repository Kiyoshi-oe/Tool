
import { FileData, ResourceItem, ItemData, EffectData } from "../../types/fileTypes";

// Interface for propItem data mapping
interface PropItemMapping {
  [key: string]: { name: string; displayName: string; description: string };
}

// Global cache for propItem mappings
let propItemMappings: PropItemMapping = {};

export const parseTextFile = (content: string): FileData => {
  console.log("parseTextFile called with content length:", content.length);
  
  // Split the content by lines, which is more memory efficient for large files
  const lines = content.split("\n");
  console.log("Number of lines:", lines.length);
  
  // Extract header (column names) from the first line, removing // markers if present
  const header = lines[0].split("\t").map(col => col.replace(/\/\//g, "").trim());
  console.log("Header columns:", header.length, header);
  
  // Process remaining lines as data rows
  const items: ResourceItem[] = [];
  
  // Process in batches for better performance
  const batchSize = 1000;
  let currentBatch: ResourceItem[] = [];
  
  let lineCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split("\t");
    if (values.length < header.length/2) continue; // Skip invalid lines
    
    const data: ItemData = {};
    let id = "";
    let name = "";
    
    // Map values to column names from the header
    header.forEach((colName, index) => {
      // Skip empty column names
      if (!colName) return;
      
      // Handle the case where values might have fewer elements than header
      let value = index < values.length ? values[index].trim() : "";
      
      // Clean triple quotes and other quotes from ALL values
      value = value.replace(/^"+|"+$/g, '');
      
      data[colName] = value;
      
      // Extract ID and name for reference
      if (colName === "dwID") {
        id = value;
      } else if (colName === "szName") {
        name = value;
      }
    });
    
    lineCount++;
    
    if (id) {
      // Get the name and description from propItem mappings if available
      // Use the name (szName) directly as the lookup key, which is the IDS_PROPITEM_TXT_ ID
      let displayName = name;
      let description = '';
      let idPropItem = name; // Store the original propItem ID 
      
      // We need to search propItemMappings for the correct entry
      if (name && name.includes("IDS_PROPITEM_TXT_")) {
        // Direct match by ID
        if (propItemMappings[name]) {
          displayName = propItemMappings[name].displayName || name;
          description = propItemMappings[name].description || "";
          console.log(`Found direct mapping for ${name}: ${displayName}, desc: ${description.substring(0, 30)}...`);
        } else {
          console.log(`No direct mapping found for ${name}`);
        }
      } else {
        // Try to find a mapping by name pattern
        const matchingKey = Object.keys(propItemMappings).find(key => {
          return key.includes(name) || name.includes(key);
        });
        
        if (matchingKey) {
          displayName = propItemMappings[matchingKey].displayName || name;
          description = propItemMappings[matchingKey].description || "";
          idPropItem = matchingKey; // Store the matched propItem ID
          console.log(`Found indirect mapping for ${name}: ${displayName}, desc: ${description.substring(0, 30)}...`);
        } else {
          console.log(`No indirect mapping found for ${name}`);
        }
      }
      
      currentBatch.push({
        id,
        name,
        displayName,
        description,
        idPropItem, // Store the propItem ID for later use when saving changes
        data,
        effects: [],
      });
      
      // Process in batches to avoid memory issues with very large files
      if (currentBatch.length >= batchSize) {
        items.push(...currentBatch);
        currentBatch = [];
      }
    }
  }
  
  console.log(`Processed ${lineCount} lines of data`);
  
  // Add any remaining items
  if (currentBatch.length > 0) {
    items.push(...currentBatch);
  }
  
  console.log("Parsed items count:", items.length);
  if (items.length > 0) {
    console.log("Sample item:", items[0]);
    console.log("Sample item name:", items[0].name);
    console.log("Sample item displayName:", items[0].displayName);
    console.log("Sample item description:", items[0].description);
  } else {
    console.log("No items were parsed from the file");
    console.log("First few lines of file:", lines.slice(0, 5));
  }
  
  // Process effects for each item using the parameters provided by the user
  items.forEach(item => {
    // Process the dwDestParam and nAdjParamVal pairs (there can be up to 6 of these)
    for (let i = 1; i <= 6; i++) {
      // For the first entry, the parameter might be named without a number (dwDestParam instead of dwDestParam1)
      // or may use array syntax like dwDestParam[0]
      const paramKeyVariants = i === 1 ? 
        [`dwDestParam`, `dwDestParam1`, `dwDestParam[0]`] : 
        [`dwDestParam${i}`, `dwDestParam[${i-1}]`];
      
      const valueKeyVariants = i === 1 ? 
        [`nAdjParamVal`, `nAdjParamVal1`, `nAdjParamVal[0]`] : 
        [`nAdjParamVal${i}`, `nAdjParamVal[${i-1}]`];
      
      // Find the actual keys used in the data
      const paramKey = paramKeyVariants.find(key => item.data[key] !== undefined && item.data[key] !== "=") || "";
      const valueKey = valueKeyVariants.find(key => item.data[key] !== undefined && item.data[key] !== "=") || "";
      
      if (paramKey && valueKey && item.data[paramKey] && item.data[valueKey] && 
          item.data[paramKey] !== "=" && item.data[valueKey] !== "=") {
        item.effects.push({
          type: item.data[paramKey] as string,
          value: item.data[valueKey] as string
        });
      }
    }
    
    // Process additional columns that might be present in spec_item.txt
    // Check for set effects if available (dwSetId, dwSetItem)
    if ((item.data.dwSetId && item.data.dwSetId !== "=") || 
        (item.data.dwSetItem && item.data.dwSetItem !== "=")) {
      // Initialize setEffects if not already done
      if (!item.setEffects) {
        item.setEffects = [];
      }
      
      // This would be expanded in a real implementation to properly handle set effects
      const setId = item.data.dwSetId || "unknown";
      const requiredPieces = parseInt(item.data.dwSetItem as string) || 2;
      
      item.setEffects.push({
        id: setId as string,
        name: `Set ${setId}`,
        effects: [],
        requiredPieces
      });
    }
  });
  
  return { header, items };
};

export const getPropItemMappings = (): PropItemMapping => {
  return propItemMappings;
};

export const setPropItemMappings = (mappings: PropItemMapping): void => {
  propItemMappings = mappings;
};
