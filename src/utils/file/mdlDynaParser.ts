
import { toast } from "sonner";

// Interface for storing model file mappings
interface ModelFileMapping {
  [key: string]: string; // Map from item define (e.g. II_WEA_AXE_RODNEY) to filename (e.g. Item_WeaAxeRodney.o3d)
}

// Global cache for model file mappings
let modelFileMappings: ModelFileMapping = {};

// Parse mdlDyna.inc file content
export const parseMdlDynaFile = (content: string): void => {
  try {
    console.log("Parsing mdlDyna.inc file...");
    
    // This regex looks for patterns like: SetItemName( II_WEA_AXE_RODNEY, "Item_WeaAxeRodney.o3d" );
    const modelRegex = /SetItemName\s*\(\s*(II_[A-Z0-9_]+)\s*,\s*"([^"]+)"\s*\)/g;
    const mappings: ModelFileMapping = {};
    
    let match;
    let count = 0;
    
    while ((match = modelRegex.exec(content)) !== null) {
      const itemDefine = match[1];
      const fileName = match[2];
      
      mappings[itemDefine] = fileName;
      count++;
      
      if (count <= 5) {
        console.log(`Parsed model mapping: ${itemDefine} = ${fileName}`);
      }
    }
    
    console.log(`Successfully parsed ${count} model mappings from mdlDyna.inc`);
    
    // Store in global cache
    modelFileMappings = mappings;
    
    toast.success(`Loaded ${count} model mappings from mdlDyna.inc`);
  } catch (error) {
    console.error("Error parsing mdlDyna.inc:", error);
    toast.error("Failed to parse mdlDyna.inc file");
  }
};

// Get model filename from item define
export const getModelFileNameFromDefine = (defineName: string): string => {
  if (!defineName) return '';
  
  // Clean the input from any quotes
  const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
  
  // Look up the filename in our mappings
  const fileName = modelFileMappings[cleanDefineName] || '';
  
  if (fileName) {
    console.log(`Resolved model filename for ${cleanDefineName}: ${fileName}`);
  } else {
    console.log(`No model filename found for ${cleanDefineName}`);
  }
  
  return fileName;
};

// Get all available model file mappings
export const getModelFileMappings = (): ModelFileMapping => {
  return modelFileMappings;
};

// Function to load mdlDyna.inc from public folder
export const loadMdlDynaFile = async (): Promise<void> => {
  try {
    console.log("Loading mdlDyna.inc file from public folder...");
    
    const response = await fetch('/resource/mdlDyna.inc');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const content = await response.text();
    console.log("mdlDyna.inc loaded successfully, content length:", content.length);
    
    parseMdlDynaFile(content);
  } catch (error) {
    console.error("Error loading mdlDyna.inc file:", error);
    toast.error("Failed to load mdlDyna.inc file. This file might not exist in the public folder.");
  }
};
