
// Method to serialize the file data back to text format
export const serializeToText = (fileData: any, originalContent?: string): string => {
  // If we have the original content and this is a spec_item.txt file, preserve the original format
  if (fileData.isSpecItemFile) {
    if (originalContent) {
      console.log("Preserving original spec_item.txt format");
      return originalContent;
    } else {
      console.warn("Missing originalContent for spec_item.txt file, falling back to generated format");
    }
  }
  
  // For non-spec_item.txt files or if originalContent is missing, generate the content
  const headerLine = fileData.header.map((col: string) => `${col}`).join("\t");
  
  const dataLines = fileData.items.map((item: any) => {
    // Ensure we output ALL columns in the correct order
    const values = fileData.header.map((col: string) => {
      return item.data[col] !== undefined ? item.data[col] : "=";
    });
    
    return values.join("\t");
  });
  
  return [headerLine, ...dataLines].join("\n");
};

// Special function to serialize propItem.txt.txt data
export const serializePropItemData = (items: any[]): string => {
  const lines: string[] = [];
  
  // Only include items that have been modified
  const modifiedItems = items.filter(item => 
    item.displayName !== undefined || 
    item.description !== undefined
  );
  
  console.log(`Serializing ${modifiedItems.length} modified items out of ${items.length} total items`);
  
  modifiedItems.forEach(item => {
    if (!item.name || !item.data || !item.data.szName) return;
    
    // Get the ID from the item's propItem ID (szName field)
    const propItemId = item.data.szName as string;
    const idMatch = propItemId.match(/IDS_PROPITEM_TXT_(\d+)/);
    if (!idMatch) return;
    
    const baseId = parseInt(idMatch[1], 10);
    if (isNaN(baseId)) return;
    
    // Only add entries that have been modified
    if (item.displayName !== undefined) {
      // Add the name entry (even number)
      const nameId = `IDS_PROPITEM_TXT_${baseId.toString().padStart(6, '0')}`;
      lines.push(`${nameId}\t${item.displayName || item.name}`);
    }
    
    if (item.description !== undefined) {
      // Add the description entry (odd number = baseId + 1)
      const descId = `IDS_PROPITEM_TXT_${(baseId + 1).toString().padStart(6, '0')}`;
      lines.push(`${descId}\t${item.description || ''}`);
    }
  });
  
  return lines.join("\n");
};

// Track modified files that need to be saved
let modifiedFiles: { name: string; content: string }[] = [];

// Add or update a file in the modified files list
export const trackModifiedFile = (fileName: string, content: string) => {
  // Check if this is a spec_item.txt file with original content
  let finalContent = content;
  
  // Check if this is a Spec_item.txt file (case insensitive)
  const isSpecItemFile = fileName.toLowerCase().includes('spec_item') || fileName.toLowerCase().includes('specitem');
  
  // If the content is a JSON string, try to parse it
  if (content.startsWith('{') && content.includes('originalContent')) {
    try {
      const parsedContent = JSON.parse(content);
      
      // If this is a spec_item.txt file with original content, use that instead
      if ((parsedContent.isSpecItemFile || isSpecItemFile) && parsedContent.originalContent) {
        console.log(`Using original content for ${fileName} to preserve exact format`);
        finalContent = parsedContent.originalContent;
      }
    } catch (error) {
      console.warn(`Failed to parse content as JSON for ${fileName}:`, error);
      // Continue with the original content
    }
  }
  
  const existingIndex = modifiedFiles.findIndex(file => file.name === fileName);
  
  if (existingIndex >= 0) {
    modifiedFiles[existingIndex].content = finalContent;
  } else {
    modifiedFiles.push({ name: fileName, content: finalContent });
  }
  
  console.log(`Tracked modified file: ${fileName}`);
  return modifiedFiles;
};

// Track changes to propItem entries (names and descriptions)
export const trackPropItemChanges = (itemId: string, itemName: string, displayName: string, description: string) => {
  // We'll collect all propItem changes and then serialize them when saving
  // Mark the propItem.txt.txt file as modified with a placeholder
  trackModifiedFile("propItem.txt.txt", `PENDING_CHANGES_FOR_${itemId}`);
  console.log(`Tracked propItem changes for ${itemName}: "${displayName}" / "${description.substring(0, 30)}..."`);
};

// Save all propItem changes to the propItem.txt.txt file
export const savePropItemChanges = async (items: any[]): Promise<boolean> => {
  if (!items || items.length === 0) return false;
  
  // Only process if we have pending propItem changes
  const hasPropItemChanges = modifiedFiles.some(file => file.name === "propItem.txt.txt");
  if (!hasPropItemChanges) return true;
  
  try {
    console.log("Serializing propItem changes for", items.length, "items");
    
    // First load the existing propItem.txt.txt file to preserve existing entries
    let existingContent = "";
    let isUtf16 = false;
    
    try {
      const response = await fetch('/public/resource/propItem.txt.txt');
      if (response.ok) {
        // Get the file as an ArrayBuffer to handle different encodings
        const buffer = await response.arrayBuffer();
        
        // Check for UTF-16LE BOM (FF FE)
        const firstBytes = new Uint8Array(buffer.slice(0, 2));
        
        if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
          console.log("UTF-16LE encoding detected in existing propItem.txt.txt");
          existingContent = new TextDecoder('utf-16le').decode(buffer);
          isUtf16 = true;
        } else {
          // Fallback to UTF-8
          existingContent = new TextDecoder('utf-8').decode(buffer);
        }
        
        console.log("Loaded existing propItem.txt.txt, content length:", existingContent.length);
      } else {
        console.warn("Could not load existing propItem.txt.txt, will create new file");
      }
    } catch (error) {
      console.warn("Error loading existing propItem.txt.txt:", error);
    }
    
    // Parse existing content to create a map of IDs to values
    const existingEntries: { [key: string]: string } = {};
    if (existingContent) {
      const lines = existingContent.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue; // Skip empty lines
        
        const parts = line.split('\t');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          // Only add if it's a valid ID format to avoid duplicating corrupted entries
          if (id.match(/IDS_PROPITEM_TXT_\d+/)) {
            existingEntries[id] = parts[1].trim();
          }
        }
      }
      console.log(`Parsed ${Object.keys(existingEntries).length} existing entries from propItem.txt.txt`);
    }
    
    // Now serialize our changed items
    const serializedChanges = serializePropItemData(items);
    
    // Parse the serialized changes to update the existing entries
    const changeLines = serializedChanges.split(/\r?\n/);
    for (const line of changeLines) {
      if (!line.trim()) continue; // Skip empty lines
      
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        if (id.match(/IDS_PROPITEM_TXT_\d+/)) {
          existingEntries[id] = parts[1].trim();
        }
      }
    }
    
    // Rebuild the final content from the updated entries
    const finalLines = Object.entries(existingEntries)
      .sort((a, b) => {
        // Sort by numeric part of the ID
        const numA = parseInt(a[0].replace(/\D/g, ''), 10);
        const numB = parseInt(b[0].replace(/\D/g, ''), 10);
        return numA - numB;
      })
      .map(([id, value]) => `${id}\t${value}`);
    
    // Use Windows-style line endings (CRLF) for better compatibility
    const finalContent = finalLines.join('\r\n');
    
    // Update the tracked file with the actual content
    const existingIndex = modifiedFiles.findIndex(file => file.name === "propItem.txt.txt");
    if (existingIndex >= 0) {
      modifiedFiles[existingIndex].content = finalContent;
    } else {
      // Add it to the modified files if it's not already there
      trackModifiedFile("propItem.txt.txt", finalContent);
    }
    
    console.log(`Updated propItem.txt.txt with ${finalLines.length} entries`);
    return true;
  } catch (error) {
    console.error("Error serializing propItem changes:", error);
    return false;
  }
};

// Get the list of modified files
export const getModifiedFiles = () => {
  return [...modifiedFiles];
};

// Clear the list of modified files
export const clearModifiedFiles = () => {
  modifiedFiles = [];
};

// Save a single file
export const saveTextFile = (content: string, fileName: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    // Check if this is a Spec_item.txt file (case insensitive)
    const isSpecItemFile = fileName.toLowerCase().includes('spec_item') || fileName.toLowerCase().includes('specitem');
    
    // For Spec_item.txt files, ensure we're preserving the exact content
    let finalContent = content;
    if (isSpecItemFile && content.startsWith('{')) {
      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.originalContent) {
          console.log(`Using original content for ${fileName} to preserve exact format`);
          finalContent = parsedContent.originalContent;
        }
      } catch (error) {
        console.warn(`Failed to parse content as JSON for ${fileName}:`, error);
        // Continue with the original content
      }
    }
    
    // Track the file modification
    trackModifiedFile(fileName, finalContent);
    
    // Check if we're in Electron environment
    const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
    
    if (isElectron) {
      try {
        console.log("Electron environment detected, attempting direct save");
        
        // First try to save via the electronAPI
        if ((window as any).electronAPI) {
          console.log("Using electronAPI.saveFile");
          const result = await (window as any).electronAPI.saveFile(fileName, content, './public/resource');
          
          if (result.success) {
            console.log(`File saved directly to resource folder via Electron API: ${result.path}`);
            resolve(true);
            return;
          } else {
            console.error("Error saving via Electron API:", result.error);
          }
        } else {
          // Fallback to custom event for older versions
          console.log("Fallback to custom event for Electron");
          const event = new CustomEvent('save-file', { 
            detail: { 
              fileName, 
              content, 
              path: './public/resource' 
            }
          });
          window.dispatchEvent(event);
          
          // Listen for the response from Electron
          const responseHandler = (event: any) => {
            const response = event.detail;
            console.log("Save response from Electron:", response);
            if (response.success) {
              console.log(`File saved directly to resource folder via Electron: ${fileName}`);
              window.removeEventListener('save-file-response', responseHandler);
              resolve(true);
            } else {
              console.error("Error saving via Electron:", response.error);
              window.removeEventListener('save-file-response', responseHandler);
              // Fall back to server-side save
              attemptServerSave();
            }
          };
          
          window.addEventListener('save-file-response', responseHandler, { once: true });
          
          // Set a timeout in case Electron doesn't respond
          setTimeout(() => {
            console.warn("No response from Electron after 2 seconds, falling back to server-side save");
            window.removeEventListener('save-file-response', responseHandler);
            attemptServerSave();
          }, 2000);
          
          return;
        }
      } catch (error) {
        console.error("Error using Electron save API:", error);
        // Fall back to server-side save if Electron API fails
      }
    }
    
    // If not in Electron or Electron save failed, try server-side save
    attemptServerSave();
    
    async function attemptServerSave() {
      try {
        const success = await saveToResourceFolder(content, fileName);
        if (success) {
          console.log(`File saved to server resource folder: ${fileName}`);
          resolve(true);
          return;
        }
        
        // If server-side save fails, fall back to download
        console.warn("Server-side save failed, falling back to download");
        downloadTextFile(content, fileName);
        resolve(false);
      } catch (error) {
        console.error("Error during server-side save:", error);
        downloadTextFile(content, fileName);
        resolve(false);
      }
    }
  });
};

// Save all modified files at once
export const saveAllModifiedFiles = async (): Promise<boolean> => {
  const filesToSave = getModifiedFiles();
  
  if (filesToSave.length === 0) {
    console.log("No modified files to save");
    return true;
  }
  
  console.log(`Saving ${filesToSave.length} modified files:`, filesToSave.map(f => f.name).join(', '));
  
  // Check if we're in Electron environment
  const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
  
  if (isElectron) {
    try {
      if ((window as any).electronAPI) {
        console.log("Using electronAPI.saveAllFiles");
        const result = await (window as any).electronAPI.saveAllFiles(filesToSave);
        
        if (result.success) {
          console.log(`All files saved successfully via Electron API`);
          clearModifiedFiles();
          return true;
        } else {
          console.error("Error saving all files via Electron API:", result.error);
        }
      } else {
        // Fallback to custom event
        console.log("Using custom event for saveAllFiles");
        const event = new CustomEvent('save-all-files', { 
          detail: { files: filesToSave }
        });
        window.dispatchEvent(event);
        
        return new Promise((resolve) => {
          const responseHandler = (event: any) => {
            const response = event.detail;
            console.log("Save all files response:", response);
            if (response.success) {
              console.log(`All files saved successfully via Electron`);
              clearModifiedFiles();
              window.removeEventListener('save-all-files-response', responseHandler);
              resolve(true);
            } else {
              console.error("Error saving all files via Electron:", response.error);
              window.removeEventListener('save-all-files-response', responseHandler);
              resolve(false);
            }
          };
          
          window.addEventListener('save-all-files-response', responseHandler, { once: true });
          
          // Set a timeout in case Electron doesn't respond
          setTimeout(() => {
            console.warn("No response from Electron after 2 seconds");
            window.removeEventListener('save-all-files-response', responseHandler);
            resolve(false);
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Error using Electron saveAllFiles API:", error);
    }
  }
  
  // Try server-side save for all files
  try {
    const success = await saveMultipleFilesToResourceFolder(filesToSave);
    if (success) {
      console.log("All files saved to server resource folder");
      clearModifiedFiles();
      return true;
    }
  } catch (error) {
    console.error("Error during server-side batch save:", error);
  }
  
  // If all else fails, fall back to individual saves
  console.warn("Batch save failed, falling back to individual file saves");
  let allSuccessful = true;
  
  for (const file of filesToSave) {
    try {
      const success = await saveTextFile(file.content, file.name);
      if (!success) {
        allSuccessful = false;
      }
    } catch (error) {
      console.error(`Error saving file ${file.name}:`, error);
      allSuccessful = false;
    }
  }
  
  if (allSuccessful) {
    clearModifiedFiles();
  }
  
  return allSuccessful;
};

// Improved server-side save function with better error handling and retry logic
const saveToResourceFolder = async (content: string, fileName: string): Promise<boolean> => {
  try {
    console.log(`Attempting to save ${fileName} to resource folder via server API`);
    
    // Check if the file is a JSON file or not
    const isJsonFile = fileName.toLowerCase().endsWith('.json');
    const isTextFile = fileName.toLowerCase().endsWith('.txt') || 
                      fileName.toLowerCase().endsWith('.h') || 
                      fileName.toLowerCase().endsWith('.inc');
    
    console.log(`File type detection: ${fileName} - JSON: ${isJsonFile}, Text: ${isTextFile}`);
    
    // Attempt to save the file to the server's resource folder
    // Use a retry mechanism in case of temporary issues
    let attempts = 3;
    let lastError = null;
    
    while (attempts > 0) {
      try {
        const response = await fetch('/api/save-resource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName,
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Server responded with ${response.status}:`, errorData);
          throw new Error(`Server error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        if (result.success === true) {
          console.log(`Successfully saved ${fileName} to resource folder`);
          return true;
        } else {
          throw new Error(`Save operation reported failure: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Attempt ${4 - attempts} failed:`, error);
        lastError = error;
        attempts--;
        
        if (attempts > 0) {
          console.log(`Retrying save operation for ${fileName}... (${attempts} attempts left)`);
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    console.error(`All save attempts failed for ${fileName}:`, lastError);
    return false;
  } catch (error) {
    console.error("Failed to save file to resource folder:", error);
    return false;
  }
};

// Save multiple files to resource folder at once with retry logic
const saveMultipleFilesToResourceFolder = async (files: { name: string; content: string }[]): Promise<boolean> => {
  try {
    console.log(`Attempting to save ${files.length} files to resource folder via server API`);
    
    // Log file types for debugging
    files.forEach(file => {
      const isJsonFile = file.name.toLowerCase().endsWith('.json');
      const isTextFile = file.name.toLowerCase().endsWith('.txt') || 
                        file.name.toLowerCase().endsWith('.h') || 
                        file.name.toLowerCase().endsWith('.inc');
      console.log(`File type detection: ${file.name} - JSON: ${isJsonFile}, Text: ${isTextFile}`);
    });
    
    // Use a retry mechanism in case of temporary issues
    let attempts = 3;
    let lastError = null;
    
    while (attempts > 0) {
      try {
        const response = await fetch('/api/save-resource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Server responded with ${response.status}:`, errorData);
          throw new Error(`Server error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        console.log("Server save result:", result);
        
        if (result.success === true) {
          console.log(`Successfully saved ${files.length} files to resource folder`);
          return true;
        } else {
          // Check if any individual files failed
          if (result.results && Array.isArray(result.results)) {
            const failedFiles = result.results.filter((r: any) => !r.success);
            if (failedFiles.length > 0) {
              console.error(`${failedFiles.length} files failed to save:`, 
                failedFiles.map((f: any) => `${f.fileName}: ${f.error}`).join(', '));
            }
          }
          
          throw new Error(`Batch save operation reported failure: ${result.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Attempt ${4 - attempts} failed:`, error);
        lastError = error;
        attempts--;
        
        if (attempts > 0) {
          console.log(`Retrying batch save operation... (${attempts} attempts left)`);
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    console.error(`All batch save attempts failed:`, lastError);
    return false;
  } catch (error) {
    console.error("Failed to save multiple files to resource folder:", error);
    return false;
  }
};

// Standard browser download method (fallback)
const downloadTextFile = (content: string, fileName: string): void => {
  console.log("Falling back to browser download for", fileName);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  
  URL.revokeObjectURL(url);
};

export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For large files, use the chunked approach
    if (file.size > 10 * 1024 * 1024) { // If file is larger than 10MB
      const CHUNK_SIZE = 15 * 1024 * 1024; // 15MB chunks for faster processing
      let content = "";
      let offset = 0;
      const fileSize = file.size;
      
      const readNextChunk = () => {
        const reader = new FileReader();
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        
        reader.onload = (e) => {
          if (e.target?.result) {
            content += e.target.result;
            offset += CHUNK_SIZE;
            
            if (offset < fileSize) {
              readNextChunk();
            } else {
              resolve(content);
            }
          }
        };
        
        reader.onerror = () => {
          reject(new Error("Error reading file chunk"));
        };
        
        reader.readAsText(chunk);
      };
      
      readNextChunk();
    } else {
      // For smaller files, use the standard approach
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("File read error"));
      };
      
      reader.readAsText(file);
    }
  });
};
