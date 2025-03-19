
import { toast } from "sonner";

// Interface for storing item define mappings
interface ItemDefineMapping {
  [key: string]: string; // Map from define name (e.g. II_WEA_SWO_WOODEN) to ID (e.g. 21)
}

// Global cache for item define mappings
let itemDefineMappings: ItemDefineMapping = {};

// Parse defineItem.h file content
export const parseDefineItemFile = (content: string): void => {
  try {
    console.log("Parsing defineItem.h file...");
    
    const defineRegex = /\#define\s+(II_[A-Z0-9_]+)\s+(\d+)/g;
    const mappings: ItemDefineMapping = {};
    
    let match;
    let count = 0;
    
    while ((match = defineRegex.exec(content)) !== null) {
      const defineName = match[1];
      const defineValue = match[2];
      
      mappings[defineName] = defineValue;
      count++;
      
      if (count <= 5) {
        console.log(`Parsed define: ${defineName} = ${defineValue}`);
      }
    }
    
    console.log(`Successfully parsed ${count} item definitions from defineItem.h`);
    
    // Store in global cache
    itemDefineMappings = mappings;
    
    toast.success(`Loaded ${count} item definitions from defineItem.h`);
  } catch (error) {
    console.error("Error parsing defineItem.h:", error);
    toast.error("Failed to parse defineItem.h file");
  }
};

// Get item ID from define name
export const getItemIdFromDefine = (defineName: string): string => {
  if (!defineName) return '';
  
  // Clean the input from any quotes
  const cleanDefineName = defineName.replace(/^"+|"+$/g, '');
  
  // Look up the ID in our mappings
  const itemId = itemDefineMappings[cleanDefineName] || '';
  
  if (itemId) {
    console.log(`Resolved item ID for ${cleanDefineName}: ${itemId}`);
  } else {
    console.log(`No item ID found for ${cleanDefineName}`);
  }
  
  return itemId;
};

// Get all available item define mappings
export const getItemDefineMappings = (): ItemDefineMapping => {
  return itemDefineMappings;
};

// Function to load defineItem.h from public folder
export const loadDefineItemFile = async (): Promise<void> => {
  try {
    console.log("Loading defineItem.h file from public folder...");
    
    const response = await fetch('/resource/defineItem.h');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const content = await response.text();
    console.log("defineItem.h loaded successfully, content length:", content.length);
    
    parseDefineItemFile(content);
  } catch (error) {
    console.error("Error loading defineItem.h file:", error);
    toast.error("Failed to load defineItem.h file");
  }
};
