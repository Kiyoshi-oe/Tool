/**
 * Server-side API handler for saving files to the resource folder
 * 
 * For a real production implementation, you would need to:
 * 1. Add proper authentication/authorization
 * 2. Add validation for file paths
 * 3. Add protection against malicious content
 */

const fs = require('fs');
const path = require('path');

// Function to check if a string is valid JSON
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Function to save content to a file, preserving the exact content
function saveToResourceFolder(filePath, data) {
  // Ensure the directory exists
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Check if file exists and remove write protection if needed
  if (fs.existsSync(filePath)) {
    try {
      // Get current file permissions
      const stats = fs.statSync(filePath);
      const currentMode = stats.mode;
      
      // Add write permission if not present (0o200 is write permission for owner)
      if (!(currentMode & 0o200)) {
        console.log(`File ${filePath} is write-protected, changing permissions...`);
        fs.chmodSync(filePath, currentMode | 0o200);
        console.log(`Changed permissions for ${filePath}`);
      }
    } catch (permError) {
      console.error(`Error checking/changing permissions for ${filePath}:`, permError);
      // Continue anyway, we'll try to write the file
    }
  }
  
  // Determine file type based on extension
  const fileName = path.basename(filePath).toLowerCase();
  const isJsonFile = fileName.endsWith('.json');
  const isSpecItemFile = fileName.includes('spec_item') || fileName.includes('specitem');
  const isPropItemFile = fileName.includes('propitem');
  
  console.log(`File type detection: ${filePath}`);
  console.log(`- JSON file: ${isJsonFile}`);
  console.log(`- Spec item file: ${isSpecItemFile}`);
  console.log(`- Prop item file: ${isPropItemFile}`);
  
  try {
    // Convert UTF-8 to ANSI (Windows-1252) if needed
    const iconv = require('iconv-lite');
    
    if (isJsonFile && isValidJSON(data)) {
      // Only parse and format if it's explicitly a JSON file and contains valid JSON
      console.log(`Saving as formatted JSON: ${filePath}`);
      const jsonData = JSON.parse(data);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`Successfully wrote JSON file to ${filePath}`);
    } else if (isPropItemFile) {
      // Special handling for propItem files with ANSI encoding
      console.log(`Special handling for propItem file: ${filePath}`);
      
      // Clean the content to remove any potential BOM or encoding artifacts
      let cleanContent = data;
      
      // Remove any BOM characters that might be in the content
      cleanContent = cleanContent.replace(/^\uFEFF/, '');
      
      // Remove any replacement characters that might indicate encoding issues
      cleanContent = cleanContent.replace(/\uFFFD/g, '');
      
      // Encode directly to ANSI (Windows-1252)
      const ansiContent = iconv.encode(cleanContent, 'win1252');
      fs.writeFileSync(filePath, ansiContent);
      console.log(`Successfully wrote propItem file to ${filePath} with ANSI encoding`);
    } else if (isSpecItemFile) {
      // For spec_item.txt, preserve exactly as is with UTF-8 encoding
      console.log(`Preserving exact content for spec item file: ${filePath}`);
      
      // Check if the content is a JSON string with originalContent
      if (data.startsWith('{') && data.includes('originalContent')) {
        try {
          const parsedContent = JSON.parse(data);
          if (parsedContent.originalContent) {
            console.log(`Using original content for ${filePath} to preserve exact format`);
            fs.writeFileSync(filePath, parsedContent.originalContent, { encoding: 'utf8' });
            console.log(`Successfully preserved spec item file at ${filePath} using originalContent`);
            return true;
          }
        } catch (error) {
          console.warn(`Failed to parse content as JSON for ${filePath}:`, error);
          // Continue with the original content
        }
      }
      
      // If we couldn't extract originalContent, save as is
      fs.writeFileSync(filePath, data, { encoding: 'utf8' });
      console.log(`Successfully preserved spec item file at ${filePath}`);
    } else {
      // For all other text files, preserve content exactly as is
      console.log(`Preserving exact content for: ${filePath}`);
      fs.writeFileSync(filePath, data, { encoding: 'utf8' });
      console.log(`Successfully preserved file at ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving file ${filePath}:`, error);
    throw error;
  }
}

// Handle the POST request
exports.handler = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check if we're handling a single file or multiple files
    if (req.body.files && Array.isArray(req.body.files)) {
      // Handle multiple files
      const { files } = req.body;
      
      if (!files || !files.length) {
        return res.status(400).json({ success: false, error: 'No files provided' });
      }
      
      const results = [];
      
      for (const file of files) {
        if (!file.name || file.content === undefined) {
          results.push({ success: false, fileName: file.name || 'unknown', error: 'Missing filename or content' });
          continue;
        }
        
        // Prevent path traversal attacks
        const sanitizedFileName = path.normalize(file.name).replace(/^(\.\.[\/\\])+/, '');
        
        // Try multiple possible resource folder paths
        const possiblePaths = [
          path.join(process.cwd(), 'public', 'resource', sanitizedFileName),
          path.join(process.cwd(), 'resource', sanitizedFileName),
          path.join(__dirname, '..', 'resource', sanitizedFileName)
        ];
        
        let savedSuccessfully = false;
        let lastError = null;
        let savedPath = null;
        
        for (const resourcePath of possiblePaths) {
          try {
            // Ensure the directory exists
            const dirPath = path.dirname(resourcePath);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // Check if file exists and remove write protection if needed
            if (fs.existsSync(resourcePath)) {
              try {
                // Get current file permissions
                const stats = fs.statSync(resourcePath);
                const currentMode = stats.mode;
                
                // Add write permission if not present (0o200 is write permission for owner)
                if (!(currentMode & 0o200)) {
                  console.log(`File ${resourcePath} is write-protected, changing permissions...`);
                  fs.chmodSync(resourcePath, currentMode | 0o200);
                  console.log(`Changed permissions for ${resourcePath}`);
                }
              } catch (permError) {
                console.error(`Error checking/changing permissions for ${resourcePath}:`, permError);
                // Continue anyway, we'll try to write the file
              }
            }
            
            // Use our improved saveToResourceFolder function to preserve content exactly
            console.log(`Attempting to save file to ${resourcePath}`);
            saveToResourceFolder(resourcePath, file.content);
            
            savedSuccessfully = true;
            savedPath = resourcePath;
            break; // Break the loop if save was successful
          } catch (pathError) {
            console.error(`Failed to save to ${resourcePath}:`, pathError);
            lastError = pathError;
            // Continue to try the next path
          }
        }
        
        if (savedSuccessfully) {
          results.push({ success: true, fileName: sanitizedFileName, path: savedPath });
        } else {
          results.push({ 
            success: false, 
            fileName: sanitizedFileName,
            error: lastError ? lastError.message : 'Could not save file to any resource folder'
          });
        }
      }
      
      const allSuccessful = results.every(result => result.success);
      
      return res.status(200).json({ 
        success: allSuccessful, 
        results,
        message: allSuccessful 
          ? `All ${results.length} files saved successfully` 
          : `Some files failed to save`
      });
    } else {
      // Handle single file (backward compatibility)
      const { fileName, content } = req.body;
      
      // Basic validation
      if (!fileName || content === undefined) {
        console.error('Missing fileName or content in request:', req.body);
        return res.status(400).json({ success: false, error: 'Missing fileName or content' });
      }
      
      // Prevent path traversal attacks (basic protection)
      const sanitizedFileName = path.basename(fileName);
      
      // Try multiple possible resource folder paths
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'resource', sanitizedFileName),
        path.join(process.cwd(), 'resource', sanitizedFileName),
        path.join(__dirname, '..', 'resource', sanitizedFileName)
      ];
      
      let savedSuccessfully = false;
      let lastError = null;
      
      for (const resourcePath of possiblePaths) {
        try {
          // Ensure the directory exists
          const dirPath = path.dirname(resourcePath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          // Check if file exists and remove write protection if needed
          if (fs.existsSync(resourcePath)) {
            try {
              // Get current file permissions
              const stats = fs.statSync(resourcePath);
              const currentMode = stats.mode;
              
              // Add write permission if not present (0o200 is write permission for owner)
              if (!(currentMode & 0o200)) {
                console.log(`File ${resourcePath} is write-protected, changing permissions...`);
                fs.chmodSync(resourcePath, currentMode | 0o200);
                console.log(`Changed permissions for ${resourcePath}`);
              }
            } catch (permError) {
              console.error(`Error checking/changing permissions for ${resourcePath}:`, permError);
              // Continue anyway, we'll try to write the file
            }
          }
          
          // Use our improved saveToResourceFolder function to preserve content exactly
          console.log(`Attempting to save file to ${resourcePath}`);
          saveToResourceFolder(resourcePath, content);
          
          savedSuccessfully = true;
          break; // Break the loop if save was successful
        } catch (pathError) {
          console.error(`Failed to save to ${resourcePath}:`, pathError);
          lastError = pathError;
          // Continue to try the next path
        }
      }
      
      if (savedSuccessfully) {
        return res.status(200).json({ 
          success: true, 
          message: `File ${sanitizedFileName} saved successfully` 
        });
      } else {
        console.error('Could not save file to any of the attempted paths');
        return res.status(500).json({ 
          success: false, 
          error: 'Server error: Could not save file to any resource folder',
          details: lastError ? lastError.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Error saving resource file:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error while saving file',
      details: error.message
    });
  }
};
