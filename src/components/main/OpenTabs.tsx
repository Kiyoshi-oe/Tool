
import { ResourceItem } from "../../types/fileTypes";
import { X, List, Save, Trash, Pin, PinOff } from "lucide-react";
import { useState } from "react";

interface OpenTabsProps {
  openTabs: Array<{
    id: string;
    item: ResourceItem;
    isTemporary?: boolean;
  }>;
  selectedItem: ResourceItem | null;
  handleSelectTab: (id: string) => void;
  handleCloseTab: (id: string) => void;
  currentTheme: any;
  settings: any;
}

const OpenTabs = ({
  openTabs,
  selectedItem,
  handleSelectTab,
  handleCloseTab,
  currentTheme,
  settings
}: OpenTabsProps) => {
  const [showTabActions, setShowTabActions] = useState(false);
  
  if (openTabs.length === 0) return null;
  
  const handleCloseAllTabs = () => {
    openTabs.forEach(tab => {
      handleCloseTab(tab.id);
    });
    setShowTabActions(false);
  };
  
  const handleCloseOtherTabs = () => {
    if (!selectedItem) return;
    
    openTabs.forEach(tab => {
      if (tab.id !== selectedItem.id) {
        handleCloseTab(tab.id);
      }
    });
    setShowTabActions(false);
  };
  
  const getDisplayName = (item: ResourceItem): string => {
    return item.displayName || item.name || `Item ${item.id}`;
  };
  
  return (
    <div className="flex items-center justify-between">
      <div 
        className="flex overflow-x-auto"
        style={{
          backgroundColor: currentTheme.buttonBg || (settings.darkMode ? '#2D2D30' : '#F1F1F1')
        }}
      >
        {openTabs.map(tab => (
          <div 
            key={tab.id}
            className="flex items-center px-3 py-1 text-xs transition-colors"
            style={{
              backgroundColor: selectedItem?.id === tab.id 
                ? (currentTheme.isDark ? '#252526' : '#FFFFFF')
                : 'transparent',
              color: selectedItem?.id === tab.id
                ? currentTheme.foreground || (settings.darkMode ? '#FFFFFF' : '#1D1D1F')
                : (currentTheme.isDark ? '#BBBBBB' : '#666666'),
              borderTop: selectedItem?.id === tab.id
                ? `2px solid ${currentTheme.accent || '#007BFF'}`
                : '2px solid transparent'
            }}
          >
            <div className="flex items-center">
              {tab.isTemporary !== undefined && (
                <span className="mr-1">
                  {tab.isTemporary ? (
                    <span className="flex items-center" title="Temporary tab (click again to pin)">
                      <PinOff size={12} className="text-gray-500" />
                    </span>
                  ) : (
                    <span className="flex items-center" title="Pinned tab">
                      <Pin size={12} className="text-[#007BFF]" />
                    </span>
                  )}
                </span>
              )}
              <button 
                className="mr-2 hover:underline focus:outline-none"
                onClick={() => handleSelectTab(tab.id)}
                title={tab.isTemporary ? "Click again to pin this tab" : ""}
              >
                {getDisplayName(tab.item)}
              </button>
            </div>
            <button 
              className="hover:text-red-500 focus:outline-none flex items-center justify-center rounded-full hover:bg-opacity-20 hover:bg-red-100 w-5 h-5"
              style={{
                color: currentTheme.isDark ? '#888888' : '#666666'
              }}
              onClick={() => handleCloseTab(tab.id)}
              title="Close tab"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex items-center mr-2">
        <button
          className="p-1 rounded hover:bg-gray-700 focus:outline-none transition-colors"
          onClick={() => setShowTabActions(!showTabActions)}
          title="Tab actions"
        >
          <List size={16} color={currentTheme.isDark ? '#BBBBBB' : '#666666'} />
        </button>
        
        {showTabActions && (
          <div 
            className="absolute right-4 mt-28 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50"
            style={{
              backgroundColor: currentTheme.isDark ? '#252526' : '#FFFFFF',
              color: currentTheme.foreground || (settings.darkMode ? '#FFFFFF' : '#1D1D1F')
            }}
          >
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={handleCloseAllTabs}
                style={{
                  color: currentTheme.foreground || (settings.darkMode ? '#FFFFFF' : '#1D1D1F')
                }}
              >
                <Trash size={14} className="mr-2" />
                Close all tabs
              </button>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={handleCloseOtherTabs}
                disabled={!selectedItem}
                style={{
                  color: !selectedItem ? '#888888' : (currentTheme.foreground || (settings.darkMode ? '#FFFFFF' : '#1D1D1F')),
                  opacity: !selectedItem ? 0.5 : 1
                }}
              >
                <X size={14} className="mr-2" />
                Close other tabs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenTabs;
