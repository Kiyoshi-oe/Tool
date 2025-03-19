
import { useState, useRef, useCallback } from "react";
import { ResourceItem } from "../types/fileTypes";

interface TabItem {
  id: string;
  item: ResourceItem;
  isTemporary: boolean;
}

export const useTabs = (
  selectedItem: ResourceItem | null,
  setSelectedItem: React.Dispatch<React.SetStateAction<ResourceItem | null>>
) => {
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const lastClickTime = useRef<{ [key: string]: number }>({});
  const doubleClickThreshold = 300; // ms
  
  const addTab = useCallback((item: ResourceItem) => {
    const now = Date.now();
    const lastClick = lastClickTime.current[item.id] || 0;
    const isDoubleClick = now - lastClick < doubleClickThreshold;
    
    // Update the last click time
    lastClickTime.current[item.id] = now;
    
    setOpenTabs(prevTabs => {
      // Check if the tab already exists
      const tabIndex = prevTabs.findIndex(tab => tab.id === item.id);
      
      if (tabIndex >= 0) {
        // If the tab exists and we have a double click, mark it as permanent
        if (isDoubleClick) {
          const updatedTabs = [...prevTabs];
          updatedTabs[tabIndex] = {
            ...updatedTabs[tabIndex],
            isTemporary: false
          };
          return updatedTabs;
        }
        return prevTabs;
      }
      
      // Close any temporary tab before adding a new one
      const filteredTabs = prevTabs.filter(tab => !tab.isTemporary);
      
      // Add the new tab, temporary by default unless it's a double click
      return [...filteredTabs, { 
        id: item.id, 
        item,
        isTemporary: !isDoubleClick
      }];
    });
  }, []);
  
  const updateTabItem = useCallback((updatedItem: ResourceItem) => {
    setOpenTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === updatedItem.id 
          ? { ...tab, item: updatedItem } 
          : tab
      )
    );
  }, []);
  
  const handleCloseTab = useCallback((id: string) => {
    setOpenTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== id);
      
      // If we're closing the selected tab, select another one
      if (selectedItem && selectedItem.id === id) {
        const lastTab = newTabs[newTabs.length - 1];
        if (lastTab) {
          setSelectedItem(lastTab.item);
        } else {
          setSelectedItem(null);
        }
      }
      
      return newTabs;
    });
  }, [selectedItem, setSelectedItem]);
  
  const handleSelectTab = useCallback((id: string) => {
    setOpenTabs(prevTabs => {
      const selectedTab = prevTabs.find(tab => tab.id === id);
      
      if (selectedTab) {
        setSelectedItem(selectedTab.item);
        
        // If we select a tab that isn't the temporary one, close any temporary tabs
        if (!selectedTab.isTemporary) {
          return prevTabs.filter(tab => !tab.isTemporary || tab.id === id);
        }
      }
      
      return prevTabs;
    });
  }, [setSelectedItem]);
  
  return {
    openTabs,
    addTab,
    updateTabItem,
    handleCloseTab,
    handleSelectTab
  };
};
