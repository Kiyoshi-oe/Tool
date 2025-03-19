
import { useState, useEffect } from "react";
import { LogEntry } from "../types/fileTypes";
import LogHeader from "./logging/LogHeader";
import LogFilterSection from "./logging/LogFilterSection";
import LogTableSection from "./logging/LogTableSection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LoggingSystemProps {
  isVisible: boolean;
  onClose: () => void;
  logEntries: LogEntry[];
  onRestoreVersion?: (itemId: string, timestamp: number) => void;
}

const LoggingSystem = ({ isVisible, onClose, logEntries, onRestoreVersion }: LoggingSystemProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredEntries, setFilteredEntries] = useState<LogEntry[]>(logEntries);
  const [filter, setFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'accordion' | 'list'>('list');
  const [filterOptions, setFilterOptions] = useState({
    itemName: '',
    field: '',
    dateFrom: '',
    dateTo: '',
    valueChanged: ''
  });
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    // Basic filter
    let filtered = [...logEntries];
    
    if (filter) {
      filtered = filtered.filter(entry => 
        entry.itemName.toLowerCase().includes(filter.toLowerCase()) ||
        entry.field.toLowerCase().includes(filter.toLowerCase()) ||
        String(entry.oldValue).toLowerCase().includes(filter.toLowerCase()) ||
        String(entry.newValue).toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    // Advanced filters
    if (showAdvancedFilters) {
      if (filterOptions.itemName) {
        filtered = filtered.filter(entry => 
          entry.itemName.toLowerCase().includes(filterOptions.itemName.toLowerCase())
        );
      }
      
      if (filterOptions.field) {
        filtered = filtered.filter(entry => 
          entry.field.toLowerCase().includes(filterOptions.field.toLowerCase())
        );
      }
      
      if (filterOptions.dateFrom) {
        const fromDate = new Date(filterOptions.dateFrom).getTime();
        filtered = filtered.filter(entry => entry.timestamp >= fromDate);
      }
      
      if (filterOptions.dateTo) {
        const toDate = new Date(filterOptions.dateTo + 'T23:59:59').getTime();
        filtered = filtered.filter(entry => entry.timestamp <= toDate);
      }
      
      if (filterOptions.valueChanged) {
        filtered = filtered.filter(entry => 
          String(entry.oldValue).includes(filterOptions.valueChanged) ||
          String(entry.newValue).includes(filterOptions.valueChanged)
        );
      }
    }
    
    // Sort
    filtered.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.timestamp - a.timestamp 
        : a.timestamp - b.timestamp;
    });
    
    setFilteredEntries(filtered);
  }, [logEntries, sortOrder, filter, filterOptions, showAdvancedFilters]);

  if (!isVisible) return null;

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };
  
  const handleFilterOptionsChange = (key: keyof typeof filterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const clearFilters = () => {
    setFilter('');
    setFilterOptions({
      itemName: '',
      field: '',
      dateFrom: '',
      dateTo: '',
      valueChanged: ''
    });
  };
  
  const handleDownloadLogs = () => {
    const json = JSON.stringify(logEntries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'change_log.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 animate-fade-in">
      <div className={`bg-[#1E1E24] rounded-lg shadow-2xl w-4/5 max-h-[85vh] flex flex-col border border-[#3A3A3D] transform transition-all duration-300 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <LogHeader 
          onClose={onClose}
          sortOrder={sortOrder}
          onToggleSortOrder={toggleSortOrder}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onDownloadLogs={handleDownloadLogs}
        />
        
        <div className="px-4 py-3 border-b border-[#3A3A3D] bg-[#252528]">
          <div className="flex items-center space-x-4">
            <Label className="text-gray-300">View Mode:</Label>
            <RadioGroup 
              defaultValue={viewMode} 
              onValueChange={(value) => setViewMode(value as 'accordion' | 'list')} 
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" className="border-cyrus-blue text-cyrus-blue" />
                <Label htmlFor="list" className="cursor-pointer text-gray-300 hover:text-white transition-colors">List</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accordion" id="accordion" className="border-cyrus-blue text-cyrus-blue" />
                <Label htmlFor="accordion" className="cursor-pointer text-gray-300 hover:text-white transition-colors">Accordion</Label>
              </div>
            </RadioGroup>
            
            <div className="ml-auto text-xs text-gray-400">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
            </div>
          </div>
        </div>
        
        <LogFilterSection 
          filter={filter}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          onFilterOptionsChange={handleFilterOptionsChange}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onClearFilters={clearFilters}
        />
        
        <LogTableSection 
          filteredEntries={filteredEntries}
          formatDate={formatDate}
          onRestoreVersion={onRestoreVersion}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default LoggingSystem;
