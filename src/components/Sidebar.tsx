import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
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

// Konfiguration für Virtualisierung
const ITEM_HEIGHT = 28; // Höhe eines Items in px
const BUFFER_ITEMS = 10; // Pufferelemente über/unter dem sichtbaren Bereich

// Globale Variable zum Speichern der Scrollposition außerhalb des React-Lifecycles
let globalScrollPosition = 0;
// Globaler Flag zum Verhindern des ersten Scrolls
let isInitialRender = true;

const Sidebar = ({ items, onSelectItem, selectedItem, darkMode = true }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  
  // Stelle sicher, dass items immer ein Array ist
  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items]);
  
  // Filtern der Items basierend auf der Suchanfrage - mit useMemo gecacht
  const filteredItems = useMemo(() => {
    // Performance-Optimierung: Wenn keine Suche, gib direkt safeItems zurück
    if (!searchQuery) return safeItems;
    
    const lowerQuery = searchQuery.toLowerCase();
    return safeItems.filter(item => 
      (item.displayName && item.displayName.toLowerCase().includes(lowerQuery)) ||
      (item.data?.szName && (item.data.szName as string)?.toLowerCase().includes(lowerQuery)) ||
      (item.name && item.name.toLowerCase().includes(lowerQuery))
    );
  }, [safeItems, searchQuery]);
  
  // Berechnung der virtuellen Liste
  const {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex
  } = useMemo(() => {
    if (!viewportRef.current || clientHeight === 0) {
      return { virtualItems: [], totalHeight: 0, startIndex: 0, endIndex: 0 };
    }
    
    const totalHeight = filteredItems.length * ITEM_HEIGHT;
    
    // Berechne sichtbare Items basierend auf Viewport
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
    const endIndex = Math.min(
      filteredItems.length - 1,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + BUFFER_ITEMS
    );
    
    // Erstelle virtuelle Items mit Position
    const virtualItems = filteredItems
      .slice(startIndex, endIndex + 1)
      .map((item, idx) => ({
        item,
        index: startIndex + idx,
        offsetTop: (startIndex + idx) * ITEM_HEIGHT
      }));
    
    return { virtualItems, totalHeight, startIndex, endIndex };
  }, [filteredItems, scrollTop, clientHeight]);
  
  // Beim ersten Laden den isInitialRender-Flag setzen
  useEffect(() => {
    isInitialRender = true;
    // Beim Unmounten den globalen Zustand zurücksetzen
    return () => {
      globalScrollPosition = 0;
      isInitialRender = true;
    };
  }, []);
  
  // Initialisiere die Viewport-Dimensionen
  useEffect(() => {
    if (!viewportRef.current) return;
    
    const updateSize = () => {
      if (viewportRef.current) {
        setClientHeight(viewportRef.current.clientHeight);
      }
    };
    
    updateSize();
    
    // ResizeObserver für dynamische Anpassung
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(viewportRef.current);
    
    return () => {
      if (viewportRef.current) {
        resizeObserver.unobserve(viewportRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  // Speichere Scrollposition, wenn der Benutzer scrollt
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (element) {
      setScrollTop(element.scrollTop);
      
      if (isUserScrolling.current) {
        globalScrollPosition = element.scrollTop;
      }
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
        viewportRef.current.scrollTop = globalScrollPosition;
      }
    };
    
    // Warte auf das nächste Mikro-Task, dann scrolle
    Promise.resolve().then(applyScroll);
  }, [searchQuery, filteredItems]);
  
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
  
  // Funktion zum Scrollen zum ausgewählten Item
  const scrollToSelectedItem = () => {
    if (!selectedItem || !viewportRef.current) return;
    
    const index = filteredItems.findIndex(item => item.id === selectedItem.id);
    if (index === -1) return;
    
    const newScrollTop = index * ITEM_HEIGHT;
    
    // Nur scrollen, wenn das Element nicht im sichtbaren Bereich ist
    if (
      newScrollTop < scrollTop || 
      newScrollTop > scrollTop + clientHeight - ITEM_HEIGHT
    ) {
      viewportRef.current.scrollTop = newScrollTop - clientHeight / 2 + ITEM_HEIGHT / 2;
      setScrollTop(viewportRef.current.scrollTop);
    }
  };
  
  // Scrolle zum ausgewählten Item, wenn es sich ändert
  useEffect(() => {
    if (!isInitialRender) {
      scrollToSelectedItem();
    }
  }, [selectedItem?.id]);
  
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
            <div style={{ height: totalHeight, position: 'relative' }} className="p-1">
              {virtualItems.map(({ item, offsetTop }) => (
                <div 
                  key={item.id}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${offsetTop}px)`,
                    width: 'calc(100% - 8px)',
                    height: `${ITEM_HEIGHT}px`
                  }}
                  className={`px-2 py-1 hover:${darkMode ? 'bg-cyrus-dark-lighter' : 'bg-gray-300'} cursor-[url(/lovable-uploads/Cursor.png),pointer] rounded text-sm ${
                    selectedItem?.id === item.id 
                      ? darkMode 
                        ? 'bg-cyrus-blue text-white' 
                        : 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300'
                        : 'text-gray-700'
                  } flex items-center`}
                  onClick={() => handleItemSelect(item)}
                >
                  {/* Show only the item name part instead of ID+name */}
                  <span className="truncate">
                    {item.displayName 
                      ? extractItemName(item.displayName) 
                      : (item.data?.szName as string) || item.name || item.id}
                  </span>
                </div>
              ))}
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
