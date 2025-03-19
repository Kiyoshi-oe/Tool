
import { useState } from "react";
import { Search } from "lucide-react";
import { ResourceItem } from "../types/fileTypes";
import { ScrollArea } from "./ui/scroll-area";

interface SidebarProps {
  items: ResourceItem[];
  onSelectItem: (item: ResourceItem) => void;
  selectedItem?: ResourceItem;
  darkMode?: boolean;
}

const Sidebar = ({ items, onSelectItem, selectedItem, darkMode = true }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredItems = items.filter(item => 
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.data.szName as string)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Debug to verify we have items
  console.log("Sidebar items:", items.length);
  console.log("Filtered items:", filteredItems.length);
  if (items.length > 0) {
    console.log("First few items:", items.slice(0, 3));
  }
  
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
  
  return (
    <div className={`w-56 h-full ${darkMode ? 'bg-cyrus-dark-light' : 'bg-gray-200'} border-r ${darkMode ? 'border-cyrus-dark-lightest' : 'border-gray-300'} flex flex-col cursor-[url(/lovable-uploads/Cursor.png),auto]`}>
      <div className={`p-3 border-b ${darkMode ? 'border-cyrus-dark-lightest' : 'border-gray-300'}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className={`w-full ${darkMode ? 'bg-cyrus-dark-lighter border-cyrus-dark-lightest text-white' : 'bg-white border-gray-300 text-gray-800'} border rounded px-3 py-1.5 text-sm pl-8 cursor-[url(/lovable-uploads/Cursor.png),auto]`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No items found
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No items found matching search
          </div>
        ) : (
          <div className="p-1">
            {filteredItems.map((item) => (
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
                onClick={() => onSelectItem(item)}
                onDoubleClick={() => onSelectItem(item)}
              >
                {/* Show only the item name part instead of ID+name */}
                {item.displayName 
                  ? extractItemName(item.displayName) 
                  : (item.data.szName as string) || item.id}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
