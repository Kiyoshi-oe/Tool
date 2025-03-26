import React from 'react';
import { ResourceItem } from '../types/fileTypes';

// Definiere die TabItem-Schnittstelle hier, da sie nicht exportiert wird
interface TabItem {
  id: string;
  item: ResourceItem;
  isTemporary: boolean;
}

// Define the Props interface for our Header component
interface HeaderProps {
  title: string;
  currentTab: string;
  currentItem?: string;
  onSave: () => void;
  onSaveAllFiles: () => void;
  onShowSettings: () => void;
  onShowLogging: () => void;
  darkMode: boolean;
  onFileMenuToggle: () => void;
  showFileMenu: boolean;
  onShowAbout: () => void;
  onShowToDo: () => void;
  onShowHome: () => void;
  onToggleEditMode: () => void;
  editMode: boolean;
  openTabs?: Array<TabItem>;
}

// Export the Header component directly
const Header: React.FC<HeaderProps> = (props) => {
  const {
    title,
    currentTab,
    currentItem,
    onSave,
    onSaveAllFiles,
    onShowSettings,
    onShowLogging,
    darkMode,
    onFileMenuToggle,
    showFileMenu,
    onShowAbout,
    onShowToDo,
    onShowHome,
    onToggleEditMode,
    editMode,
    openTabs
  } = props;
  
  // Common styles
  const buttonClass = "px-2 py-1 rounded hover:bg-gray-700";
  
  return (
    <header className="bg-cyrus-dark-light border-b border-gray-700 text-white p-2 flex justify-between items-center h-14">
      <div className="flex items-center">
        <div className="flex items-center mr-2">
          <img 
            src="/lovable-uploads/icon_small.png" 
            alt="Cyrus Tool Icon" 
            className="h-8 w-8" 
          />
        </div>
        
        <button 
          className={buttonClass}
          onClick={onFileMenuToggle}
          aria-label="File Menu"
        >
          <div className="flex items-center space-x-1">
            <span>File</span>
            <span className={`transform transition-transform ${showFileMenu ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>
        
        <button 
          className={buttonClass}
          onClick={onShowHome}
          aria-label="Home"
        >
          Home
        </button>
        
        <div className="mx-2 text-gray-400">|</div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          className={`${buttonClass} ${editMode ? 'bg-green-700' : ''}`}
          onClick={onToggleEditMode}
          aria-label="Toggle Edit Mode"
        >
          {editMode ? 'Edit Mode' : 'View Mode'}
        </button>
        
        <button 
          className={`${buttonClass} ${!currentItem ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onSave}
          aria-label="Save"
          disabled={!currentItem}
          title={currentItem ? "Save Current Tab" : "No tab selected to save"}
        >
          Save Current Tab
        </button>
        
        <button 
          className={`${buttonClass} ${!openTabs || openTabs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onSaveAllFiles}
          aria-label="Save All"
          title="Save All Open Tabs"
        >
          Save All Tabs
        </button>
        
        <button 
          className={buttonClass}
          onClick={onShowSettings}
          aria-label="Settings"
        >
          Settings
        </button>
        
        <button 
          className={buttonClass}
          onClick={onShowLogging}
          aria-label="Show Logs"
        >
          Logs
        </button>
        
        <button 
          className={buttonClass}
          onClick={onShowToDo}
          aria-label="ToDo"
        >
          To-Do
        </button>
        
        <button 
          className={buttonClass}
          onClick={onShowAbout}
          aria-label="About"
        >
          About
        </button>
      </div>
    </header>
  );
};

export default Header;
