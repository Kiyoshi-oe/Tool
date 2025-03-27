import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TabNav from "../components/TabNav";
import StatusBar from "../components/StatusBar";
import FileUploadModal from "../components/FileUploadModal";
import LoggingSystem from "../components/LoggingSystem";
import AboutModal from "../components/AboutModal";
import SplashScreen from "../components/SplashScreen";
import MainContent, { WelcomeScreen } from "../components/main/MainContent";
import OpenTabs from "../components/main/OpenTabs";
import ChangelogDialog from "../components/ChangelogDialog";
import { ResourceItem, FileUploadConfig, LogEntry } from "../types/fileTypes";
import { serializeToText, saveTextFile, saveAllModifiedFiles, getModifiedFiles, savePropItemChanges } from "../utils/file/fileOperations";
import { toast } from "sonner";
import { useResourceState } from "../hooks/useResourceState";
import { tabs, getFilteredItems } from "../utils/tabUtils";
import { themes, fontOptions, applyTheme } from "../utils/themeUtils";

const Index = () => {
  const [currentTab, setCurrentTab] = useState("Weapon");
  const [fileUploadConfig, setFileUploadConfig] = useState<FileUploadConfig>({
    isVisible: false,
    source: 'header'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showLoggingSystem, setShowLoggingSystem] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToDoPanel, setShowToDoPanel] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('cyrusLogEntries');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [settings, setSettings] = useState({
    autoSaveInterval: 5,
    enableLogging: true,
    darkMode: true,
    font: "inter",
    fontSize: 14,
    theme: "dark",
    shortcuts: {} as Record<string, string>,
    localStoragePath: "./",
  });
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [showFileMenu, setShowFileMenu] = useState(false);
  
  const {
    fileData,
    selectedItem,
    setSelectedItem,
    undoStack,
    redoStack,
    openTabs,
    editMode,
    handleUndo,
    handleRedo,
    handleLoadFile,
    handleSelectItem,
    handleUpdateItem,
    handleCloseTab,
    handleSelectTab,
    handleToggleEditMode
  } = useResourceState(settings, setLogEntries);

  useEffect(() => {
    const savedSettings = localStorage.getItem('cyrusSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    applyTheme(themes, settings);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('cyrusSettings', JSON.stringify(settings));
    
    applyTheme(themes, settings);
  }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('cyrusLogEntries', JSON.stringify(logEntries));
  }, [logEntries]);
  
  useEffect(() => {
    if (!settings.autoSaveInterval || !fileData) return;
    
    const intervalId = setInterval(() => {
      handleSaveFile();
      
      if (settings.enableLogging) {
        const newLogEntry: LogEntry = {
          timestamp: Date.now(),
          itemId: "auto-save",
          itemName: "Auto Save",
          field: "file",
          oldValue: "",
          newValue: "Auto-saved at " + new Date().toLocaleTimeString()
        };
        setLogEntries(prev => [newLogEntry, ...prev]);
      }
      
      toast.info("Auto-saved");
    }, settings.autoSaveInterval * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings.autoSaveInterval, fileData, settings.enableLogging]);
  
  const handleSaveFile = async () => {
    if (!fileData || !selectedItem) {
      toast.warning("Keine Datei oder kein Element zum Speichern ausgewählt");
      return;
    }
    
    try {
      // Wir speichern nur die Daten des aktuell ausgewählten Items
      const itemToSave = fileData.items.find(item => item.id === selectedItem.id);
      
      if (!itemToSave) {
        toast.error("Ausgewähltes Element konnte nicht gefunden werden");
        return;
      }
      
      // Speichere nur das ausgewählte propItem
      await savePropItemChanges([itemToSave]);
      
      // Speichere die Haupt-Datei
      const content = serializeToText(fileData);
      const savedToResource = await saveTextFile(content, "Spec_Item.txt");
      
      // Speichere alle modifizierten Dateien
      const allSaved = await saveAllModifiedFiles();
      
      // Log-Eintrag erstellen
      if (settings.enableLogging) {
        const newLogEntry: LogEntry = {
          timestamp: Date.now(),
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          field: "file-save",
          oldValue: "",
          newValue: `Item gespeichert um ${new Date().toLocaleTimeString()}`
        };
        setLogEntries(prev => [newLogEntry, ...prev]);
      }
      
      if (savedToResource && allSaved) {
        toast.success(`Element "${selectedItem.name}" erfolgreich gespeichert`);
      } else {
        toast.warning(`Element "${selectedItem.name}" gespeichert, aber es gab Probleme beim Speichern einiger Dateien`);
      }
    } catch (error) {
      toast.error("Fehler beim Speichern des Elements");
      console.error(error);
    }
  };
  
  const handleSaveAllFiles = async () => {
    if (!fileData || openTabs.length === 0) {
      toast.warning("Keine Tabs offen zum Speichern");
      return;
    }
    
    try {
      // Sammle alle Items aus den offenen Tabs
      const tabItems = openTabs.map(tab => tab.item);
      
      // Speichere die propItems aus allen Tabs
      await savePropItemChanges(tabItems);
      
      // Speichere die Haupt-Datei
      const content = serializeToText(fileData);
      const savedToResource = await saveTextFile(content, "Spec_Item.txt");
      
      // Speichere alle modifizierten Dateien
      const allSaved = await saveAllModifiedFiles();
      
      // Log-Eintrag erstellen
      if (settings.enableLogging) {
        const newLogEntry: LogEntry = {
          timestamp: Date.now(),
          itemId: "tabs-save-all",
          itemName: "Alle Tabs",
          field: "file-save-all",
          oldValue: "",
          newValue: `${tabItems.length} Tabs gespeichert um ${new Date().toLocaleTimeString()}`
        };
        setLogEntries(prev => [newLogEntry, ...prev]);
      }
      
      if (savedToResource && allSaved) {
        toast.success(`Alle ${tabItems.length} Tabs erfolgreich gespeichert`);
      } else {
        toast.warning(`Tabs gespeichert, aber es gab Probleme beim Speichern einiger Dateien`);
      }
    } catch (error) {
      toast.error("Fehler beim Speichern der Tabs");
      console.error(error);
    }
  };
  
  const handleSaveFileAs = async (fileName: string) => {
    if (!fileData) return;
    
    try {
      const content = serializeToText(fileData);
      
      const isDownload = fileName.endsWith('.download');
      let actualFileName = fileName;
      let savedToResource = false;
      
      if (isDownload) {
        actualFileName = fileName.replace('.download', '');
        await saveTextFile(content, actualFileName);
      } else {
        savedToResource = await saveTextFile(content, fileName);
      }
      
      if (settings.enableLogging) {
        const newLogEntry: LogEntry = {
          timestamp: Date.now(),
          itemId: "file-save-as",
          itemName: "File Save As",
          field: "file",
          oldValue: "",
          newValue: `Saved as ${actualFileName} at ${new Date().toLocaleTimeString()} ${isDownload ? 'as download' : savedToResource ? 'to resource folder' : 'as download'}`
        };
        setLogEntries(prev => [newLogEntry, ...prev]);
      }
      
      if (isDownload) {
        toast.success(`File downloaded as ${actualFileName}`);
      } else if (savedToResource) {
        toast.success(`File saved to resource folder as ${fileName}`);
      } else {
        toast.warning(`Could not save to resource folder, file was downloaded as ${fileName}`);
      }
    } catch (error) {
      toast.error("Error saving file");
      console.error(error);
    }
  };
  
  const handleShowHome = () => {
    setSelectedItem(null);
    setShowSettings(false);
    setShowToDoPanel(false);
    setShowLoggingSystem(false);
    setShowChangelog(false);
  };
  
  const handleShowFileUpload = (source: 'header' | 'fileMenu' = 'header') => {
    setFileUploadConfig({
      isVisible: true,
      source
    });
    setShowFileMenu(false);
  };
  
  const handleRestoreVersion = (itemId: string, timestamp: number) => {
    if (itemId === 'CLEAR_ALL_LOGS') {
      setLogEntries([]);
      toast.success('Alle Logs wurden gelöscht');
      return;
    }
    
    const itemEntries = logEntries
      .filter(entry => entry.itemId === itemId && entry.timestamp <= timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (itemEntries.length === 0 || !fileData) return;
    
    const originalItem = fileData.items.find(item => item.id === itemId);
    if (!originalItem) return;
    
    const restoredItem = { ...originalItem };
    
    itemEntries.forEach(entry => {
      if (restoredItem.data[entry.field] !== undefined) {
        restoredItem.data = {
          ...restoredItem.data,
          [entry.field]: entry.newValue
        };
      }
    });
    
    handleUpdateItem(restoredItem);
    setShowLoggingSystem(false);
    toast.success(`Restored ${restoredItem.name} to version from ${new Date(timestamp).toLocaleString()}`);
  };
  
  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];
  
  return (
    <>
      {showSplashScreen && (
        <SplashScreen onComplete={() => setShowSplashScreen(false)} />
      )}
      
      <div 
        className="flex flex-col h-screen"
        style={{ 
          backgroundColor: currentTheme.background || (settings.darkMode ? '#1E1E1E' : '#FAFAFA'),
          color: currentTheme.foreground || (settings.darkMode ? '#FFFFFF' : '#212121'),
          cursor: `url('/lovable-uploads/Cursor.png'), auto`
        }}
      >
        <Header 
          title="Cyrus Resource Tool" 
          currentTab={currentTab}
          currentItem={selectedItem?.displayName}
          onSave={handleSaveFile}
          onSaveAllFiles={handleSaveAllFiles}
          onShowSettings={() => {
            setShowSettings(true);
            setSelectedItem(null);
            setShowToDoPanel(false);
            setShowChangelog(false);
          }}
          onShowLogging={() => {
            setShowLoggingSystem(true);
            setShowToDoPanel(false);
            setShowChangelog(false);
          }}
          darkMode={settings.darkMode}
          onFileMenuToggle={() => handleShowFileUpload('fileMenu')}
          showFileMenu={showFileMenu}
          onShowAbout={() => {
            setShowAboutModal(true);
            setShowFileMenu(false);
          }}
          onShowToDo={() => {
            setShowToDoPanel(true);
            setShowSettings(false);
            setSelectedItem(null);
            setShowFileMenu(false);
            setShowChangelog(false);
          }}
          onShowHome={handleShowHome}
          onToggleEditMode={handleToggleEditMode}
          editMode={editMode}
          openTabs={openTabs}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            items={getFilteredItems(fileData, currentTab)} 
            onSelectItem={(item) => handleSelectItem(item, showSettings, showToDoPanel)}
            selectedItem={selectedItem || undefined}
            darkMode={settings.darkMode}
          />
              
          <div className="flex-1 flex flex-col overflow-hidden">
            <TabNav 
              tabs={tabs} 
              activeTab={currentTab}
              onChangeTab={(tab) => {
                setCurrentTab(tab);
                setSelectedItem(null);
              }}
            />
                
            <OpenTabs 
              openTabs={openTabs}
              selectedItem={selectedItem}
              handleSelectTab={handleSelectTab}
              handleCloseTab={handleCloseTab}
              currentTheme={currentTheme}
              settings={settings}
            />
                
            <MainContent 
              showSettings={showSettings}
              showToDoPanel={showToDoPanel}
              selectedItem={selectedItem}
              handleUpdateItem={handleUpdateItem}
              editMode={editMode}
              undoStack={undoStack}
              redoStack={redoStack}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              settings={settings}
              setSettings={setSettings}
              fileData={fileData}
              currentTab={currentTab}
              themes={themes}
              fontOptions={fontOptions}
              currentTheme={currentTheme}
              onShowFileUpload={() => handleShowFileUpload('header')}
              onShowSettings={() => {
                setShowSettings(true);
                setSelectedItem(null);
                setShowToDoPanel(false);
              }}
              onShowChangelog={() => {
                setShowChangelog(true);
                setShowSettings(false);
                setSelectedItem(null);
                setShowToDoPanel(false);
                setShowLoggingSystem(false);
              }}
            />
          </div>
        </div>
        
        <StatusBar 
          mode={editMode ? "Edit" : "View"} 
          itemCount={getFilteredItems(fileData, currentTab).length}
        />
        
        {fileUploadConfig.isVisible && (
          <FileUploadModal 
            isVisible={true}
            source={fileUploadConfig.source}
            onFileLoaded={handleLoadFile}
            onCancel={() => setFileUploadConfig({ isVisible: false, source: 'header' })}
          />
        )}
        
        <LoggingSystem 
          isVisible={showLoggingSystem}
          onClose={() => setShowLoggingSystem(false)}
          logEntries={logEntries}
          onRestoreVersion={handleRestoreVersion}
        />
        
        <AboutModal
          isVisible={showAboutModal}
          onClose={() => setShowAboutModal(false)}
        />
        
        <ChangelogDialog open={showChangelog} onOpenChange={setShowChangelog} />
      </div>
    </>
  );
};

export default Index;
