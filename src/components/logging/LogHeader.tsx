
import { X, Download, ArrowUpDown, Filter } from "lucide-react";

interface LogHeaderProps {
  onClose: () => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  onToggleAdvancedFilters: () => void;
  onDownloadLogs: () => void;
}

const LogHeader = ({ 
  onClose, 
  sortOrder, 
  onToggleSortOrder, 
  onToggleAdvancedFilters,
  onDownloadLogs 
}: LogHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-[#1E1E24] to-[#2D2D36] p-4 rounded-t-lg border-b border-[#3A3A3D] shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyrus-gold to-cyrus-blue bg-clip-text text-transparent animate-pulse">
            Change Log
          </h2>
          <div className="h-6 w-6 rounded-full bg-cyrus-blue animate-pulse opacity-75"></div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#2A2A32] text-gray-300 hover:bg-[#3A3A42] hover:text-white transition-all duration-200 hover:shadow-lg"
            onClick={onToggleSortOrder}
          >
            <ArrowUpDown size={16} className="text-cyrus-blue" />
            <span className="text-sm">{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
          <button 
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#2A2A32] text-gray-300 hover:bg-[#3A3A42] hover:text-white transition-all duration-200 hover:shadow-lg"
            onClick={onToggleAdvancedFilters}
          >
            <Filter size={16} className="text-cyrus-gold" />
            <span className="text-sm">Filters</span>
          </button>
          <button 
            className="p-2 rounded-md bg-[#2A2A32] text-gray-300 hover:bg-[#3A3A42] hover:text-white transition-all duration-200 hover:shadow-lg"
            onClick={onDownloadLogs}
            title="Download Logs"
          >
            <Download size={18} className="text-cyrus-blue" />
          </button>
          <button 
            className="p-2 rounded-md bg-[#2A2A32] text-gray-400 hover:bg-[#3A3A42] hover:text-white transition-all duration-200 hover:shadow-lg hover:bg-red-900/50"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogHeader;
