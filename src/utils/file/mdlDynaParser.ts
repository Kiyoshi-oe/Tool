
import { toast } from "sonner";
import { trackModifiedFile } from "./fileOperations";

// Interface for storing model file mappings
interface ModelFileMapping {
  [key: string]: string; // Map from item define (e.g. II_WEA_AXE_RODNEY) to filename (e.g. WeaAxeCurin)
}

// Global cache for model file mappings
let modelFileMappings: ModelFileMapping = {};
// Store the original file content so we can modify it correctly
let originalMdlDynaContent = "";

// Parse mdlDyna.inc file content
export const parseMdlDynaFile = (content: string): void => {
  // Store the original content
  originalMdlDynaContent = content;
  try {
    console.log("Parsing mdlDyna.inc file...");
    
    // Normalize the content by removing extra spaces that might be present due to encoding issues
    // Replace multiple spaces or unusual whitespace with single spaces
    const normalizedContent = content
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/\s+/g, ' ');   // Normalize whitespace
    
    console.log("Normalized content sample:", normalizedContent.substring(0, 100));
    
    // First, find the opening brace to skip the header information
    const openingBraceIndex = normalizedContent.indexOf('{');
    
    if (openingBraceIndex < 0) {
      console.error("Could not find opening brace in mdlDyna.inc");
      return;
    }
    
    // Extract content after the opening brace
    const contentAfterBrace = normalizedContent.substring(openingBraceIndex + 1);
    
    // Look for patterns like: "WeaAxeCurin" II_WEA_AXE_RODNEY
    // This regex is specifically designed to match the weapon filename followed by its define ID
    const modelRegex = /"([A-Za-z0-9_]+)"\s+(II_[A-Z0-9_]+)/g;
    const mappings: ModelFileMapping = {};
    
    let match;
    let count = 0;
    
    while ((match = modelRegex.exec(contentAfterBrace)) !== null) {
      const fileName = match[1].trim();
      const itemDefine = match[2].trim();
      
      console.log("Found match:", match[0]);
      console.log(`  -> fileName: "${fileName}", itemDefine: "${itemDefine}"`);
      
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

// Update a model filename in the mdlDyna.inc file
export const updateModelFileNameInMdlDyna = (defineName: string, newFileName: string): boolean => {
  if (!defineName || !newFileName || !originalMdlDynaContent) {
    console.error("Missing data for updating mdlDyna.inc");
    return false;
  }

  try {
    // Clean the input from any quotes
    const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
    
    // Check if this define exists in our mappings
    if (!(cleanDefineName in modelFileMappings)) {
      console.error(`Define name ${cleanDefineName} not found in mdlDyna.inc`);
      return false;
    }

    // Get the old filename
    const oldFileName = modelFileMappings[cleanDefineName];
    
    // Update the mapping in memory
    modelFileMappings[cleanDefineName] = newFileName;
    
    console.log(`Updating model filename for ${cleanDefineName}: ${oldFileName} → ${newFileName}`);
    
    // In mdlDyna.inc, the pattern is generally like: "WeaAxeCurin" II_WEA_AXE_RODNEY
    // We need to find and replace this pattern
    
    // Escape any special regex characters in the define name
    const escapedDefineName = cleanDefineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a regex that matches the line with the old filename and define
    const modelRegex = new RegExp(`"${oldFileName}"\\s+${escapedDefineName}`, 'g');
    
    // Replace with the new filename
    const updatedContent = originalMdlDynaContent.replace(modelRegex, `"${newFileName}" ${cleanDefineName}`);
    
    // Check if the content was actually changed
    if (updatedContent === originalMdlDynaContent) {
      console.warn(`No changes were made to mdlDyna.inc for ${cleanDefineName}`);
      return false;
    }
    
    // Track the modified file to be saved
    trackModifiedFile("mdlDyna.inc", updatedContent);
    console.log(`mdlDyna.inc modified: ${cleanDefineName} filename updated to ${newFileName}`);
    
    // Update our original content to reflect the changes
    originalMdlDynaContent = updatedContent;
    
    return true;
  } catch (error) {
    console.error("Error updating mdlDyna.inc:", error);
    return false;
  }
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
