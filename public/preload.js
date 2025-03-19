
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Save a single file
    saveFile: (fileName, content, savePath) => 
      ipcRenderer.invoke('save-file', fileName, content, savePath),
    
    // Save multiple files at once
    saveAllFiles: (files) => 
      ipcRenderer.invoke('save-all-files', files),
      
    // Load all resource files
    loadAllFiles: () => 
      ipcRenderer.invoke('load-all-files'),
    
    // Listen for save response events
    onSaveFileResponse: (callback) => 
      ipcRenderer.on('save-file-response', (_, data) => callback(data))
  }
);

// Listen for save-file events from the DOM and convert them to IPC calls
window.addEventListener('save-file', (event) => {
  const { fileName, content, path } = event.detail;
  ipcRenderer.invoke('save-file', fileName, content, path)
    .then(result => {
      // Dispatch a custom event back to the renderer with the result
      window.dispatchEvent(new CustomEvent('save-file-response', { 
        detail: result 
      }));
    })
    .catch(error => {
      window.dispatchEvent(new CustomEvent('save-file-response', { 
        detail: { 
          success: false, 
          fileName,
          error: error.message || 'Unknown error' 
        } 
      }));
    });
});

// Listen for save-all-files events from the DOM
window.addEventListener('save-all-files', (event) => {
  const { files } = event.detail;
  ipcRenderer.invoke('save-all-files', files)
    .then(result => {
      window.dispatchEvent(new CustomEvent('save-all-files-response', { 
        detail: result 
      }));
    })
    .catch(error => {
      window.dispatchEvent(new CustomEvent('save-all-files-response', { 
        detail: { 
          success: false, 
          error: error.message || 'Unknown error' 
        } 
      }));
    });
});
