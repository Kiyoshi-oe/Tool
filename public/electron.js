
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'lovable-uploads/icon_small.png'),
    title: 'Cyrus Resource Tool'
  });

  // Set application menu
  mainWindow.setMenuBarVisibility(false);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle errors when loading the app
  mainWindow.webContents.on('did-fail-load', () => {
    dialog.showErrorBox(
      'Loading Failed',
      'The application failed to load. Please check your internet connection or restart the application.'
    );
  });

  // Handle IPC events for saving individual files
  ipcMain.handle('save-file', async (_, fileName, content, savePath) => {
    try {
      console.log(`Electron: Saving file ${fileName} to ${savePath || 'default resource folder'}`);
      
      // Determine the actual path to save to
      let finalPath;
      
      if (savePath) {
        // If path is relative, make it absolute
        if (!path.isAbsolute(savePath)) {
          finalPath = path.join(app.getAppPath(), savePath);
        } else {
          finalPath = savePath;
        }
      } else {
        // Default path is the resource folder in the app
        finalPath = path.join(app.getAppPath(), 'public', 'resource');
      }
      
      // Make sure the directory exists
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
        console.log(`Created directory: ${finalPath}`);
      }
      
      // The full path including filename
      const fullPath = path.join(finalPath, fileName);
      console.log(`Saving to: ${fullPath}`);
      
      // Write the file
      fs.writeFileSync(fullPath, content, 'utf8');
      
      return { 
        success: true, 
        fileName,
        path: fullPath
      };
    } catch (error) {
      console.error('Failed to save file via IPC:', error);
      return { 
        success: false, 
        fileName, 
        error: error.message || 'Unknown error in electron.js' 
      };
    }
  });

  // NEW: Handle IPC events for saving multiple files at once
  ipcMain.handle('save-all-files', async (_, files) => {
    try {
      console.log(`Electron: Saving ${files.length} files to resource folder`);
      
      // Default path is the resource folder in the app
      const resourceFolder = path.join(app.getAppPath(), 'public', 'resource');
      
      // Make sure the directory exists
      if (!fs.existsSync(resourceFolder)) {
        fs.mkdirSync(resourceFolder, { recursive: true });
        console.log(`Created directory: ${resourceFolder}`);
      }

      const results = [];
      
      // Write each file
      for (const file of files) {
        try {
          const fullPath = path.join(resourceFolder, file.name);
          console.log(`Saving to: ${fullPath}`);
          
          fs.writeFileSync(fullPath, file.content, 'utf8');
          
          results.push({ 
            success: true, 
            fileName: file.name,
            path: fullPath
          });
        } catch (fileError) {
          console.error(`Failed to save file ${file.name}:`, fileError);
          results.push({ 
            success: false, 
            fileName: file.name, 
            error: fileError.message || 'Unknown error' 
          });
        }
      }
      
      return { 
        success: true, 
        results
      };
    } catch (error) {
      console.error('Failed to save files via IPC:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error in save-all-files' 
      };
    }
  });

  // NEW: Handle IPC events for loading all files from resource folder
  ipcMain.handle('load-all-files', async () => {
    try {
      const resourceFolder = path.join(app.getAppPath(), 'public', 'resource');
      console.log(`Electron: Loading all files from ${resourceFolder}`);
      
      if (!fs.existsSync(resourceFolder)) {
        return { 
          success: false, 
          error: 'Resource folder does not exist'
        };
      }
      
      // Get all files in the resource folder and subfolders
      const getFilesRecursively = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        
        list.forEach((file) => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat && stat.isDirectory()) {
            // Recursively get files from subfolder
            results = results.concat(getFilesRecursively(fullPath));
          } else {
            // Only include specific file types
            if (file.endsWith('.txt') || file.endsWith('.h') || file.endsWith('.inc')) {
              // Get the path relative to the resource folder
              const relativePath = path.relative(resourceFolder, fullPath);
              
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                results.push({
                  name: relativePath,
                  content
                });
              } catch (readError) {
                console.error(`Error reading file ${fullPath}:`, readError);
              }
            }
          }
        });
        
        return results;
      };
      
      const files = getFilesRecursively(resourceFolder);
      
      return { 
        success: true, 
        files
      };
    } catch (error) {
      console.error('Failed to load files via IPC:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error loading files' 
      };
    }
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Set app metadata that would normally be in package.json
app.setName('Cyrus Resource Tool');
app.setAppUserModelId('com.lovable.cyrus-resource-tool');

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
