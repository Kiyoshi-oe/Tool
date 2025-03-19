
import { parsePropItemFile } from './propItemUtils';
import { parseTextFile } from './parseUtils';

export const loadPredefinedFiles = async (): Promise<{specItem: string | null, propItem: string | null}> => {
  try {
    // Debug the paths to ensure they're correct
    console.log("Attempting to load files from /resource/ directory");
    
    try {
      const specItemResponse = await fetch('/resource/Spec_item.txt');
      console.log("Spec_item.txt response status:", specItemResponse.status);
      
      if (!specItemResponse.ok) {
        console.error('Failed to load Spec_item.txt:', specItemResponse.statusText);
        // Try alternative path
        const altSpecItemResponse = await fetch('/public/resource/Spec_item.txt');
        if (!altSpecItemResponse.ok) {
          throw new Error(`Failed to load Spec_item.txt: ${specItemResponse.status} ${specItemResponse.statusText}`);
        }
        console.log("Loaded from alternative path: /public/resource/Spec_item.txt");
        const specItemText = await altSpecItemResponse.text();
        
        // Try to load propItem.txt.txt from the same directory
        let propItemText = null;
        try {
          const propItemResponse = await fetch('/public/resource/propItem.txt.txt');
          if (propItemResponse.ok) {
            // Get the file as an ArrayBuffer to handle different encodings
            const propItemBuffer = await propItemResponse.arrayBuffer();
            
            // Check for UTF-16LE BOM (FF FE)
            const firstBytes = new Uint8Array(propItemBuffer.slice(0, 2));
            
            if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
              console.log("UTF-16LE encoding detected in alternative path (BOM: FF FE)");
              propItemText = new TextDecoder('utf-16le').decode(propItemBuffer);
            } else {
              // Fallback to UTF-8
              propItemText = new TextDecoder('utf-8').decode(propItemBuffer);
            }
            
            console.log("propItem.txt.txt loaded from alternative path, length:", propItemText.length);
          }
        } catch (propError) {
          console.warn("Could not load propItem.txt.txt from alternative path:", propError);
        }
        
        return { specItem: specItemText, propItem: propItemText };
      }
      
      const specItemText = await specItemResponse.text();
      console.log("Spec_item.txt content length:", specItemText.length);
      console.log("Spec_item.txt first 100 chars:", specItemText.substring(0, 100));
      
      let propItemText = null;
      
      try {
        // Updated to use the correct filename: propItem.txt.txt
        const propItemResponse = await fetch('/resource/propItem.txt.txt');
        console.log("propItem.txt.txt response status:", propItemResponse.status);
        
        if (propItemResponse.ok) {
          // Get the file as an ArrayBuffer to handle different encodings
          const propItemBuffer = await propItemResponse.arrayBuffer();
          console.log("propItem.txt.txt buffer size:", propItemBuffer.byteLength);
          
          // Check for UTF-16LE BOM (FF FE)
          const firstBytes = new Uint8Array(propItemBuffer.slice(0, 2));
          let propItemText = '';
          
          if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
            console.log("UTF-16LE encoding detected (BOM: FF FE)");
            propItemText = new TextDecoder('utf-16le').decode(propItemBuffer);
          } else {
            // Fallback to UTF-8
            propItemText = new TextDecoder('utf-8').decode(propItemBuffer);
          }
          
          console.log("propItem.txt.txt content length:", propItemText.length);
          
          // Parse propItem.txt.txt to create ID-to-Name mappings
          const mappings = parsePropItemFile(propItemText);
          console.log("Generated propItem mappings:", Object.keys(mappings).length);
        } else {
          console.warn('Could not load propItem.txt.txt:', propItemResponse.statusText);
        }
      } catch (propError) {
        console.warn("Error loading propItem.txt.txt:", propError);
      }
      
      return { specItem: specItemText, propItem: propItemText };
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      
      // Last resort: try with full URL
      try {
        const baseUrl = window.location.origin;
        console.log("Trying with full URL:", `${baseUrl}/resource/Spec_item.txt`);
        
        const specItemResponse = await fetch(`${baseUrl}/resource/Spec_item.txt`);
        if (!specItemResponse.ok) {
          throw new Error(`Failed with full URL: ${specItemResponse.status} ${specItemResponse.statusText}`);
        }
        
        const specItemText = await specItemResponse.text();
        
        let propItemText = null;
        try {
          // Updated to use the correct filename: propItem.txt.txt
          const propItemResponse = await fetch(`${baseUrl}/resource/propItem.txt.txt`);
          if (propItemResponse.ok) {
            // Get the file as an ArrayBuffer to handle different encodings
            const propItemBuffer = await propItemResponse.arrayBuffer();
            
            // Check for UTF-16LE BOM (FF FE)
            const firstBytes = new Uint8Array(propItemBuffer.slice(0, 2));
            
            if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
              console.log("UTF-16LE encoding detected in full URL path (BOM: FF FE)");
              propItemText = new TextDecoder('utf-16le').decode(propItemBuffer);
            } else {
              // Fallback to UTF-8
              propItemText = new TextDecoder('utf-8').decode(propItemBuffer);
            }
            
            console.log("propItem.txt.txt loaded from full URL, length:", propItemText.length);
          }
        } catch (e) {
          console.warn("Could not load propItem.txt.txt with full URL");
        }
        
        return { specItem: specItemText, propItem: propItemText };
      } catch (fullUrlError) {
        console.error("Full URL attempt failed:", fullUrlError);
        throw new Error("Could not load resource files from any location");
      }
    }
  } catch (error) {
    console.error('Error loading predefined files:', error);
    return { specItem: null, propItem: null };
  }
};
