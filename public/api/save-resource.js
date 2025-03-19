
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
            
            // Write the file with ANSI encoding
            console.log(`Attempting to write to ${resourcePath} with ANSI encoding`);
            
            // Check if the file is propItem.txt.txt or propItem_fail.txt.txt
            const isPropItemFile = sanitizedFileName.toLowerCase().includes('propitem');
            
            // Convert UTF-8 to ANSI (Windows-1252)
            const iconv = require('iconv-lite');
            
            // For propItem files, ensure we're writing with the correct encoding
            // and without any BOM or encoding artifacts
            if (isPropItemFile) {
              console.log(`Special handling for propItem file: ${sanitizedFileName}`);
              
              // Clean the content to remove any potential BOM or encoding artifacts
              let cleanContent = file.content;
              
              // Remove any BOM characters that might be in the content
              cleanContent = cleanContent.replace(/^\uFEFF/, '');
              
              // Remove any replacement characters that might indicate encoding issues
              cleanContent = cleanContent.replace(/\uFFFD/g, '');
              
              // Encode directly to ANSI (Windows-1252)
              const ansiContent = iconv.encode(cleanContent, 'win1252');
              fs.writeFileSync(resourcePath, ansiContent);
              console.log(`Successfully wrote propItem file to ${resourcePath} with ANSI encoding`);
            } else {
              // Standard encoding for other files
              const ansiContent = iconv.encode(file.content, 'win1252');
              fs.writeFileSync(resourcePath, ansiContent);
              console.log(`Successfully wrote to ${resourcePath} with ANSI encoding`);
            }
            
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
          
          // Write the file with ANSI encoding
          console.log(`Attempting to write to ${resourcePath} with ANSI encoding`);
          
          // Check if the file is propItem.txt.txt or propItem_fail.txt.txt
          const isPropItemFile = sanitizedFileName.toLowerCase().includes('propitem');
          
          // Convert UTF-8 to ANSI (Windows-1252)
          const iconv = require('iconv-lite');
          
          // For propItem files, ensure we're writing with the correct encoding
          // and without any BOM or encoding artifacts
          if (isPropItemFile) {
            console.log(`Special handling for propItem file: ${sanitizedFileName}`);
            
            // Clean the content to remove any potential BOM or encoding artifacts
            let cleanContent = content;
            
            // Remove any BOM characters that might be in the content
            cleanContent = cleanContent.replace(/^\uFEFF/, '');
            
            // Remove any replacement characters that might indicate encoding issues
            cleanContent = cleanContent.replace(/\uFFFD/g, '');
            
            // Encode directly to ANSI (Windows-1252)
            const ansiContent = iconv.encode(cleanContent, 'win1252');
            fs.writeFileSync(resourcePath, ansiContent);
            console.log(`Successfully wrote propItem file to ${resourcePath} with ANSI encoding`);
          } else {
            // Standard encoding for other files
            const ansiContent = iconv.encode(content, 'win1252');
            fs.writeFileSync(resourcePath, ansiContent);
            console.log(`Successfully wrote to ${resourcePath} with ANSI encoding`);
          }
          
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
