const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getResourcePath: () => ipcRenderer.invoke("get-resource-path"),
  loadAllFiles: () => ipcRenderer.invoke("load-all-files"),
  saveAllFiles: (files) => ipcRenderer.invoke("save-all-files", files),
  saveFile: (fileName, content) => ipcRenderer.invoke("save-all-files", [{ name: fileName, content }]),
  saveAs: (file) => ipcRenderer.invoke("save-as", file),
});
