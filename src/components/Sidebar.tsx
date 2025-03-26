import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Search } from "lucide-react";
import { ResourceItem } from "../types/fileTypes";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";

interface SidebarProps {
  items: ResourceItem[];
  onSelectItem: (item: ResourceItem) => void;
  selectedItem?: ResourceItem;
  darkMode?: boolean;
}

// Globale Variable zum Speichern der Scrollposition außerhalb des React-Lifecycles
let globalScrollPosition = 0;
// Globaler Flag zum Verhindern des ersten Scrolls
let isInitialRender = true;

const Sidebar = ({ items, onSelectItem, selectedItem, darkMode = true }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleItemCount, setVisibleItemCount] = useState(100);
  const [hasMore, setHasMore] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  
  // Stelle sicher, dass items immer ein Array ist
  const safeItems = Array.isArray(items) ? items : [];
  
  // Filtern der Items basierend auf der Suchanfrage
  const filteredItems = safeItems.filter(item => 
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.data?.szName && (item.data.szName as string)?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Begrenzen der angezeigten Items auf immer 100
  const displayedItems = filteredItems.slice(0, visibleItemCount);
  
  // Überwachen, ob es mehr Items zum Laden gibt
  useEffect(() => {
    setHasMore(filteredItems.length > visibleItemCount);
  }, [filteredItems.length, visibleItemCount]);
  
  // Beim ersten Laden den isInitialRender-Flag setzen
  useEffect(() => {
    isInitialRender = true;
    // Beim Unmounten den globalen Zustand zurücksetzen
    return () => {
      globalScrollPosition = 0;
      isInitialRender = true;
    };
  }, []);
  
  // Speichere Scrollposition, wenn der Benutzer scrollt
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!isUserScrolling.current) return;
    
    const element = event.currentTarget;
    if (element) {
      globalScrollPosition = element.scrollTop;
    }
  };
  
  // Stelle sicher, dass die Scrollposition erhalten bleibt
  useLayoutEffect(() => {
    // Beim ersten Render nicht scrollen
    if (isInitialRender) {
      isInitialRender = false;
      return;
    }
    
    const applyScroll = () => {
      if (viewportRef.current) {
        // Verwende eine Verzögerung, um Timing-Probleme zu vermeiden
        viewportRef.current.scrollTop = globalScrollPosition;
      }
    };
    
    // Warte auf das nächste Mikro-Task, dann scrolle
    Promise.resolve().then(() => {
      applyScroll();
      // Zusätzliche Verzögerungen für problematische Browser
      setTimeout(applyScroll, 0);
      setTimeout(applyScroll, 50);
      setTimeout(applyScroll, 100);
    });
  }, [searchQuery, visibleItemCount, displayedItems, selectedItem]);
  
  // Mehr Items laden ohne Scrollposition zu verlieren
  const loadMoreItems = () => {
    if (viewportRef.current) {
      globalScrollPosition = viewportRef.current.scrollTop;
    }
    
    const newCount = Math.min(visibleItemCount + 100, filteredItems.length);
    setVisibleItemCount(newCount);
  };
  
  // Behandle das Eintritt und Verlassen des Scrollbereichs
  const handleMouseEnter = () => {
    isUserScrolling.current = true;
  };
  
  const handleMouseLeave = () => {
    if (viewportRef.current) {
      globalScrollPosition = viewportRef.current.scrollTop;
    }
    isUserScrolling.current = false;
  };
  
  // Function to extract the real name from the displayName string
  const extractItemName = (displayName: string): string => {
    // If the displayName contains a tab character (ID\tName format)
    if (displayName && displayName.includes('\t')) {
      // Split by tab and return the second part (the name)
      return displayName.split('\t')[1];
    }
    // If there's no tab, just return the original value
    return displayName;
  };
  
  // Funktion zum Behandeln der Item-Auswahl ohne Scrollpositionsverlust
  const handleItemSelect = (item: ResourceItem) => {
    // Speichere Scrollposition, bevor Item ausgewählt wird
    if (viewportRef.current) {
      globalScrollPosition = viewportRef.current.scrollTop;
    }
    
    // Rufe die Callback-Funktion für die Item-Auswahl auf
    onSelectItem(item);
  };
  
  return (
    <div 
      className={`h-full w-64 border-r ${darkMode ? 'bg-cyrus-dark border-cyrus-dark-lighter' : 'bg-white border-gray-200'} flex flex-col`}
      ref={rootRef}
    >
      <div className="p-3 border-b border-cyrus-dark-lighter">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Suche..." 
            className={`pl-8 p-1.5 w-full text-sm rounded ${darkMode ? 'bg-cyrus-dark-light text-white' : 'bg-white text-black'} border ${darkMode ? 'border-cyrus-dark-lighter' : 'border-gray-300'}`}
            value={searchQuery}
            onChange={(e) => {
              // Speichere Scrollposition, bevor Suche geändert wird
              if (viewportRef.current) {
                globalScrollPosition = viewportRef.current.scrollTop;
              }
              setSearchQuery(e.target.value);
            }}
          />
        </div>
      </div>
      
      <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1">
        <ScrollAreaPrimitive.Viewport 
          className="h-full w-full rounded-[inherit]" 
          ref={viewportRef} 
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={() => isUserScrolling.current = true}
          onTouchEnd={handleMouseLeave}
        >
          {!Array.isArray(items) ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Datenfehler: Items nicht im Array-Format
            </div>
          ) : safeItems.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Keine Items verfügbar
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Keine Einträge zur Suchanfrage gefunden
            </div>
          ) : (
            <div className="p-1">
              {displayedItems.map((item) => (
                <div 
                  key={item.id}
                  className={`px-2 py-1 hover:${darkMode ? 'bg-cyrus-dark-lighter' : 'bg-gray-300'} cursor-[url(/lovable-uploads/Cursor.png),pointer] rounded text-sm ${
                    selectedItem?.id === item.id 
                      ? darkMode 
                        ? 'bg-cyrus-blue text-white' 
                        : 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300'
                        : 'text-gray-700'
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  {/* Show only the item name part instead of ID+name */}
                  {item.displayName 
                    ? extractItemName(item.displayName) 
                    : (item.data?.szName as string) || item.name || item.id}
                </div>
              ))}
              
              {/* Zeige "Load More" Button nur wenn weitere Items verfügbar sind */}
              {hasMore && (
                <div className="flex justify-center py-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`text-xs ${darkMode ? 'bg-cyrus-dark-lighter text-gray-300 hover:bg-cyrus-dark hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    onClick={loadMoreItems}
                  >
                    <ChevronDown className="mr-1 h-3 w-3" />
                    Weitere Items laden
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar 
          orientation="vertical"
          className="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
        >
          <ScrollAreaPrimitive.Thumb 
            className="relative flex-1 rounded-full bg-cyrus-blue/70 hover:bg-cyrus-blue transition-colors"
          />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
};

export default Sidebar;
