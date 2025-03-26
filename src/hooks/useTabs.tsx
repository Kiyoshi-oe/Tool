import { useState, useRef, useCallback, useMemo } from "react";
import { ResourceItem } from "../types/fileTypes";

interface TabItem {
  id: string;
  item: ResourceItem;
  isTemporary: boolean;
}

// Map für schnellen ID-basierten Zugriff auf Tabs
const tabCache = new Map<string, TabItem>();

export const useTabs = (
  selectedItem: ResourceItem | null,
  setSelectedItem: React.Dispatch<React.SetStateAction<ResourceItem | null>>
) => {
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const lastClickTime = useRef<{ [key: string]: number }>({});
  const doubleClickThreshold = 300; // ms
  
  // Cache für schnellen Zugriff aktualisieren
  useMemo(() => {
    // Cache zurücksetzen wenn sich openTabs ändert
    tabCache.clear();
    openTabs.forEach(tab => {
      tabCache.set(tab.id, tab);
    });
  }, [openTabs]);
  
  // Performance-Optimierung: addTab mit useCallback memoisieren
  const addTab = useCallback((item: ResourceItem) => {
    // Überspringe null oder undefined items
    if (!item || !item.id) return;
    
    const now = Date.now();
    const lastClick = lastClickTime.current[item.id] || 0;
    const isDoubleClick = now - lastClick < doubleClickThreshold;
    
    // Update the last click time
    lastClickTime.current[item.id] = now;
    
    setOpenTabs(prevTabs => {
      // Performance-Optimierung: Schneller Tab-Lookup mittels tabCache
      const existingTab = tabCache.get(item.id);
      const tabIndex = existingTab ? prevTabs.findIndex(tab => tab.id === item.id) : -1;
      
      if (tabIndex >= 0) {
        // Wenn Tab existiert und Doppelklick erfolgt: Fix machen
        if (isDoubleClick && prevTabs[tabIndex].isTemporary) {
          const updatedTabs = [...prevTabs];
          updatedTabs[tabIndex] = {
            ...updatedTabs[tabIndex],
            isTemporary: false
          };
          
          // Cache aktualisieren
          tabCache.set(item.id, updatedTabs[tabIndex]);
          
          return updatedTabs;
        }
        return prevTabs;
      }
      
      // Temporäre Tabs schließen bevor neuer Tab geöffnet wird
      const filteredTabs = prevTabs.filter(tab => !tab.isTemporary);
      
      // Neuen Tab hinzufügen, standardmäßig temporär außer bei Doppelklick
      const newTab = { 
        id: item.id, 
        item,
        isTemporary: !isDoubleClick
      };
      
      // Cache aktualisieren
      tabCache.set(item.id, newTab);
      
      return [...filteredTabs, newTab];
    });
  }, []);
  
  // Performance-Optimierung: updateTabItem mit useCallback memoisieren
  const updateTabItem = useCallback((updatedItem: ResourceItem) => {
    if (!updatedItem || !updatedItem.id) return;
    
    // Performance-Optimierung: Prüfen ob der Tab existiert
    const existingTab = tabCache.get(updatedItem.id);
    if (!existingTab) return;
    
    setOpenTabs(prevTabs => {
      // Performance-Optimierung: Direkte Array-Manipulation
      const updatedTabs = [...prevTabs];
      const tabIndex = updatedTabs.findIndex(tab => tab.id === updatedItem.id);
      
      if (tabIndex >= 0) {
        const updatedTab = {
          ...updatedTabs[tabIndex],
          item: updatedItem
        };
        updatedTabs[tabIndex] = updatedTab;
        
        // Cache aktualisieren
        tabCache.set(updatedItem.id, updatedTab);
        
        return updatedTabs;
      }
      
      return prevTabs;
    });
  }, []);
  
  // Performance-Optimierung: handleCloseTab mit useCallback memoisieren
  const handleCloseTab = useCallback((id: string) => {
    if (!id) return;
    
    setOpenTabs(prevTabs => {
      // Performance-Optimierung: Cache bereinigen
      tabCache.delete(id);
      
      const newTabs = prevTabs.filter(tab => tab.id !== id);
      
      // Wenn aktiver Tab geschlossen wird, anderen selektieren
      if (selectedItem && selectedItem.id === id) {
        const lastTab = newTabs[newTabs.length - 1];
        if (lastTab) {
          // Asynchrone State-Aktualisierung für bessere Reaktionsfähigkeit
          queueMicrotask(() => {
            setSelectedItem(lastTab.item);
          });
        } else {
          queueMicrotask(() => {
            setSelectedItem(null);
          });
        }
      }
      
      return newTabs;
    });
  }, [selectedItem, setSelectedItem]);
  
  // Performance-Optimierung: handleSelectTab mit useCallback memoisieren
  const handleSelectTab = useCallback((id: string) => {
    if (!id) return;
    
    // Performance-Optimierung: Direkt aus Cache lesen
    const selectedTab = tabCache.get(id);
    
    if (selectedTab) {
      // Vermeiden unnötiger Re-Selektierungen
      if (selectedItem && selectedItem.id === id) return;
      
      // Asynchrone State-Aktualisierung für bessere Reaktionsfähigkeit
      queueMicrotask(() => {
        setSelectedItem(selectedTab.item);
      });
      
      // Wenn der ausgewählte Tab nicht temporär ist, temporäre Tabs schließen
      if (!selectedTab.isTemporary) {
        setOpenTabs(prevTabs => {
          // Alle temporären Tabs außer den aktiven filtern
          return prevTabs.filter(tab => !tab.isTemporary || tab.id === id);
        });
      }
    }
  }, [selectedItem, setSelectedItem]);
  
  return {
    openTabs,
    addTab,
    updateTabItem,
    handleCloseTab,
    handleSelectTab
  };
};
