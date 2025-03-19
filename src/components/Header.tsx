
import React from 'react';

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
    editMode
  } = props;
  
  // Common styles
  const buttonClass = "px-2 py-1 rounded hover:bg-gray-700";
  
  return (
    <header className="bg-cyrus-dark-light border-b border-gray-700 text-white p-2 flex justify-between items-center h-14">
      <div className="flex items-center">
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
        
        <div className="flex items-center">
          <h1 className="text-lg font-medium text-cyrus-blue">{title}</h1>
          {currentTab && (
            <div className="flex items-center ml-2">
              <span className="text-gray-400">»</span>
              <span className="ml-2 text-cyrus-gold">{currentTab}</span>
              {currentItem && (
                <>
                  <span className="mx-1 text-gray-400">»</span>
                  <span className="text-green-400">{currentItem}</span>
                </>
              )}
            </div>
          )}
        </div>
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
          className={buttonClass}
          onClick={onSave}
          aria-label="Save"
        >
          Save
        </button>
        
        <button 
          className={buttonClass}
          onClick={onSaveAllFiles}
          aria-label="Save All"
        >
          Save All
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
