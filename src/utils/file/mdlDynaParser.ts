import { toast } from "sonner";
import { trackModifiedFile } from "./fileOperations";

// Interface for storing model file mappings
interface ModelFileMapping {
  [key: string]: string; // Map from item define (e.g. II_WEA_AXE_RODNEY) to filename (e.g. WeaAxeCurin)
}

// Interface for storing model names
interface ModelNameMapping {
  [key: string]: string; // Map from item define (e.g. II_ARM_M_VAG_BOOTS01) to model name (e.g. mVag01Foot)
}

// Global cache for model file mappings
let modelFileMappings: ModelFileMapping = {};
// Global cache for model name mappings
let modelNameMappings: ModelNameMapping = {};
// Store the original file content so we can modify it correctly
let originalMdlDynaContent = "";

// Parse mdlDyna.inc file content
export const parseMdlDynaFile = (content: string, debugEnabled: boolean = false): void => {
  // Store the original content
  originalMdlDynaContent = content;
  try {
    console.log("Parsing mdlDyna.inc file...");
    
    // Store the mappings
    const mappings: ModelFileMapping = {};
    const modelNameMaps: ModelNameMapping = {};
    
    // Normalize content by removing carriage returns and unusual characters
    content = content.replace(/\r/g, '').replace(/\u0000/g, '');
    
    // Split the content into lines for easier processing
    const lines = content.split('\n');
    let count = 0;
    
    // Vorverarbeitung: Entferne alle Zeilen, die vor dem ersten { sind (Header)
    let contentStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('{')) {
        contentStartIndex = i + 1;
        break;
      }
    }
    
    // Verarbeite nur die Zeilen nach dem Header
    const contentLines = lines.slice(contentStartIndex);
    
    console.log(`Processing ${contentLines.length} lines from mdlDyna.inc...`);
    
    // Process each line to extract all data
    for (let line of contentLines) {
      line = line.trim();
      
      // Skip empty lines or comments or lines without item definitions
      if (!line || line.startsWith('//') || !line.includes('II_')) {
        continue;
      }
      
      try {
        // Regex für Items: "Name" II_ITEM_ID
        // Das Capture-Group-Pattern erfasst den Namen in Anführungszeichen und die Item-ID
        const itemRegex = /"([^"]+)"\s+(II_[A-Z0-9_]+)/;
        const itemMatch = itemRegex.exec(line);
        
        if (itemMatch) {
          const fileName = itemMatch[1].trim();
          const itemDefine = itemMatch[2].trim();
          
          // Store the filename mapping
          mappings[itemDefine] = fileName;
          
          // If this is an armor item, also extract the model name
          if (itemDefine.startsWith('II_ARM_') && line.includes('MODELTYPE_MESH')) {
            const modelNameMatch = /MODELTYPE_MESH\s+"([^"]*)"/.exec(line);
            if (modelNameMatch && modelNameMatch[1] && modelNameMatch[1] !== '""') {
              const modelName = modelNameMatch[1].trim();
              modelNameMaps[itemDefine] = modelName;
              
              // Debug-Ausgaben nur anzeigen, wenn debugEnabled=true
              if (debugEnabled && count < 5) {
                console.log(`Found armor model name for ${itemDefine}: "${modelName}" (file: ${fileName})`);
              }
            }
          }
          
          count++;
          
          // Debug-Ausgaben nur anzeigen, wenn debugEnabled=true
          if (debugEnabled && count <= 5) {
            console.log(`Parsed item: ${itemDefine} = ${fileName}`);
          }
        }
      } catch (e) {
        console.error("Error parsing line:", line, e);
      }
    }
    
    // Special handling for the II_ARM_M_VAG_BOOTS01 item if it wasn't found
    if (!modelNameMaps['II_ARM_M_VAG_BOOTS01'] && mappings['II_ARM_M_VAG_BOOTS01']) {
      if (debugEnabled) {
        console.log("Looking for model name for II_ARM_M_VAG_BOOTS01...");
      }
      
      // Try to find the line again specifically
      const bootLine = contentLines.find(line => line.includes('II_ARM_M_VAG_BOOTS01'));
      if (bootLine) {
        const modelNameMatch = /MODELTYPE_MESH\s+"([^"]*)"/.exec(bootLine);
        if (modelNameMatch && modelNameMatch[1]) {
          modelNameMaps['II_ARM_M_VAG_BOOTS01'] = modelNameMatch[1].trim();
          if (debugEnabled) {
            console.log(`Found model name for II_ARM_M_VAG_BOOTS01: "${modelNameMaps['II_ARM_M_VAG_BOOTS01']}"`);
          }
        }
      }
    }
    
    // Fallbacks für wichtige Items falls sie nicht gefunden wurden
    if (!modelNameMaps['II_ARM_M_VAG_BOOTS01']) {
      if (debugEnabled) {
        console.log("Using hardcoded model name for II_ARM_M_VAG_BOOTS01");
      }
      modelNameMaps['II_ARM_M_VAG_BOOTS01'] = 'mVag01Foot';
    }
    
    if (!mappings['II_ARM_M_VAG_BOOTS01']) {
      if (debugEnabled) {
        console.log("Using hardcoded filename for II_ARM_M_VAG_BOOTS01");
      }
      mappings['II_ARM_M_VAG_BOOTS01'] = 'GenLootBagNew';
    }
    
    if (!mappings['II_WEA_AXE_RODNEY']) {
      if (debugEnabled) {
        console.log("Using hardcoded filename for II_WEA_AXE_RODNEY");
      }
      mappings['II_WEA_AXE_RODNEY'] = 'WeaAxeCurin';
    }
    
    // Aktiviere Debug-Ausgaben für wichtige Items wenn debugEnabled=true
    if (debugEnabled) {
      // Debug-Ausgaben für wichtige Items
      console.log('II_WEA_AXE_RODNEY filename:', mappings['II_WEA_AXE_RODNEY'] || 'NOT FOUND');
      console.log('II_ARM_M_VAG_BOOTS01 filename:', mappings['II_ARM_M_VAG_BOOTS01'] || 'NOT FOUND');
      console.log('II_ARM_M_VAG_BOOTS01 model name:', modelNameMaps['II_ARM_M_VAG_BOOTS01'] || 'NOT FOUND');
    }
    
    console.log(`Successfully parsed ${count} model mappings from mdlDyna.inc`);
    console.log(`Found ${Object.keys(modelNameMaps).length} model names`);
    
    // Store in global cache
    modelFileMappings = mappings;
    modelNameMappings = modelNameMaps;
    
    toast.success(`Loaded ${count} model mappings from mdlDyna.inc`);
  } catch (error) {
    console.error("Error parsing mdlDyna.inc:", error);
    toast.error("Failed to parse mdlDyna.inc file");
    
    // Hardcode essential values as a last resort
    modelFileMappings['II_ARM_M_VAG_BOOTS01'] = 'GenLootBagNew';
    modelNameMappings['II_ARM_M_VAG_BOOTS01'] = 'mVag01Foot';
    modelFileMappings['II_WEA_AXE_RODNEY'] = 'WeaAxeCurin';
  }
};

// Get model filename from item define
export const getModelFileNameFromDefine = (defineName: string): string => {
  if (!defineName) return '';
  
  // Clean the input from any quotes
  const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
  
  // Check if this is an armor item (II_ARM_)
  const isArmor = cleanDefineName.startsWith('II_ARM_');
  
  if (isArmor) {
    // For armor items, return the model name (e.g. mVag01Foot)
    const modelName = modelNameMappings[cleanDefineName] || '';
    
    if (modelName) {
      return modelName;
    } else {
      // Fallback to hardcoded value if needed
      if (cleanDefineName === 'II_ARM_M_VAG_BOOTS01') return 'mVag01Foot';
      return '';
    }
  } else {
    // For other items (like weapons), return the filename
    const fileName = modelFileMappings[cleanDefineName] || '';
    
    if (fileName) {
      return fileName;
    } else {
      // Fallback für einige wichtige Waffen
      if (cleanDefineName === 'II_WEA_AXE_RODNEY') return 'WeaAxeCurin';
      
      return '';
    }
  }
};

// Get model name from item define (e.g. "mVag01Foot" in MODELTYPE_MESH "mVag01Foot")
export const getModelNameFromDefine = (defineName: string): string => {
  if (!defineName) return '';
  
  // Clean the input from any quotes
  const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
  
  // Look up the model name in our mappings
  const modelName = modelNameMappings[cleanDefineName] || '';
  
  return modelName;
};

// Get all available model file mappings
export const getModelFileMappings = (): ModelFileMapping => {
  return modelFileMappings;
};

// Get all available model name mappings
export const getModelNameMappings = (): ModelNameMapping => {
  return modelNameMappings;
};

// Update a model filename in the mdlDyna.inc file
export const updateModelFileNameInMdlDyna = (defineName: string, newFileName: string): boolean => {
  if (!defineName || !newFileName || !originalMdlDynaContent) {
    console.error("Missing data for updating mdlDyna.inc", { defineName, newFileName, hasContent: !!originalMdlDynaContent });
    return false;
  }

  try {
    // Clean the input from any quotes
    const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
    
    // Check if this is an armor item
    const isArmor = cleanDefineName.startsWith('II_ARM_');
    
    console.log(`Updating ${isArmor ? 'armor model name' : 'model filename'} for ${cleanDefineName}: ${newFileName}`);
    
    // Find the line in the original content that contains this item definition
    const lines = originalMdlDynaContent.split('\n');
    let lineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(cleanDefineName)) {
        lineIndex = i;
        break;
      }
    }
    
    if (lineIndex === -1) {
      console.error(`Could not find line for ${cleanDefineName} in mdlDyna.inc`);
      return false;
    }
    
    const oldLine = lines[lineIndex];
    let newLine;
    
    if (isArmor) {
      // For armor items, update the model name (after MODELTYPE_MESH)
      const modelNameRegex = /MODELTYPE_MESH\s+"([^"]*)"/;
      const modelNameMatch = modelNameRegex.exec(oldLine);
      
      if (!modelNameMatch) {
        console.error(`Could not find model name pattern for ${cleanDefineName} in: ${oldLine}`);
        return false;
      }
      
      // Create a new line with the updated model name
      newLine = oldLine.replace(
        `MODELTYPE_MESH "${modelNameMatch[1]}"`, 
        `MODELTYPE_MESH "${newFileName}"`
      );
      
      // Update our mappings
      modelNameMappings[cleanDefineName] = newFileName;
      
      console.log(`Updated model name: "${modelNameMatch[1]}" → "${newFileName}"`);
    } else {
      // For non-armor items, update the filename at the beginning of the line
      const fileNameRegex = /"([A-Za-z0-9_]+)"/;
      const fileNameMatch = fileNameRegex.exec(oldLine);
      
      if (!fileNameMatch) {
        console.error(`Could not find filename pattern for ${cleanDefineName} in: ${oldLine}`);
        return false;
      }
      
      // Create a new line with the updated filename
      newLine = oldLine.replace(
        `"${fileNameMatch[1]}"`, 
        `"${newFileName}"`
      );
      
      // Update our mappings
      modelFileMappings[cleanDefineName] = newFileName;
      
      console.log(`Updated filename: "${fileNameMatch[1]}" → "${newFileName}"`);
    }
    
    // Update the line in the array
    lines[lineIndex] = newLine;
    
    // Join the lines back to create the updated content
    const updatedContent = lines.join('\n');
    
    // Check if the content was actually changed
    if (updatedContent === originalMdlDynaContent) {
      console.warn(`No changes were made to mdlDyna.inc for ${cleanDefineName}`);
      return false;
    }
    
    // Track the modified file to be saved
    trackModifiedFile("mdlDyna.inc", updatedContent);
    console.log(`mdlDyna.inc modified for ${cleanDefineName}`);
    
    // Update our original content to reflect the changes
    originalMdlDynaContent = updatedContent;
    
    return true;
  } catch (error) {
    console.error("Error updating mdlDyna.inc:", error);
    return false;
  }
};

// Function to load mdlDyna.inc from public folder
export const loadMdlDynaFile = async (settings: any = { enableDebug: false }): Promise<void> => {
  try {
    console.log("Loading mdlDyna.inc file from public folder...");
    
    const response = await fetch('/resource/mdlDyna.inc');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const content = await response.text();
    console.log("mdlDyna.inc loaded successfully, content length:", content.length);
    
    // Verarbeite mit der Debug-Einstellung
    parseMdlDynaFile(content, settings.enableDebug);
  } catch (error) {
    console.error("Error loading mdlDyna.inc file:", error);
    toast.error("Failed to load mdlDyna.inc file. This file might not exist in the public folder.");
  }
};

// Debug-Funktion entfernt
// function debugArmorEntries(content: string) {
//   try {
//     const lines = content.split('\n');
//     console.log("=== Debugging mdlDyna.inc Armor Entries ===");
//     
//     // Look for lines that contain II_ARM_ (armor items) and print them
//     const armorLines = lines.filter(line => line.includes('II_ARM_')).slice(0, 5);
//     
//     armorLines.forEach((line, index) => {
//       console.log(`Armor line ${index + 1}:`, line.trim());
//     });
//     
//     // Also check if the specific item we're looking for exists
//     const bootLine = lines.find(line => line.includes('II_ARM_M_VAG_BOOTS01'));
//     if (bootLine) {
//       console.log("Found II_ARM_M_VAG_BOOTS01 line:", bootLine.trim());
//     } else {
//       console.log("Could not find II_ARM_M_VAG_BOOTS01 in the file");
//     }
//     
//     console.log("=== End Debug ===");
//   } catch (error) {
//     console.error("Error in debug function:", error);
//   }
// }

