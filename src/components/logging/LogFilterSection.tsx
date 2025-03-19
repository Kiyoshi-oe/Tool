
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";

interface LogFilterSectionProps {
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: {
    itemName: string;
    field: string;
    dateFrom: string;
    dateTo: string;
    valueChanged: string;
  };
  onFilterOptionsChange: (key: string, value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onClearFilters: () => void;
}

const LogFilterSection = ({
  filter,
  onFilterChange,
  filterOptions,
  onFilterOptionsChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onClearFilters
}: LogFilterSectionProps) => {
  return (
    <div className="px-4 py-3 border-b border-[#3A3A3D] bg-[#252528]">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
          />
          {filter && (
            <button
              onClick={() => onFilterChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="whitespace-nowrap bg-transparent border-[#3A3A3D] hover:bg-[#3A3A42] hover:text-white transition-all duration-200"
        >
          Clear Filters
        </Button>
      </div>
      
      {showAdvancedFilters && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Item Name</label>
            <Input
              value={filterOptions.itemName}
              onChange={(e) => onFilterOptionsChange('itemName', e.target.value)}
              placeholder="Filter by item name..."
              className="bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Field</label>
            <Input
              value={filterOptions.field}
              onChange={(e) => onFilterOptionsChange('field', e.target.value)}
              placeholder="Filter by field name..."
              className="bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Value Changed</label>
            <Input
              value={filterOptions.valueChanged}
              onChange={(e) => onFilterOptionsChange('valueChanged', e.target.value)}
              placeholder="Filter by value content..."
              className="bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Date From</label>
            <Input
              type="date"
              value={filterOptions.dateFrom}
              onChange={(e) => onFilterOptionsChange('dateFrom', e.target.value)}
              className="bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Date To</label>
            <Input
              type="date"
              value={filterOptions.dateTo}
              onChange={(e) => onFilterOptionsChange('dateTo', e.target.value)}
              className="bg-[#2A2A32] border-[#3A3A3D] text-white focus:border-cyrus-blue focus:ring-1 focus:ring-cyrus-blue transition-all duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LogFilterSection;
