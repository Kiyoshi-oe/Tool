
import { LogEntry } from "../../types/fileTypes";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LogTableSectionProps {
  filteredEntries: LogEntry[];
  formatDate: (timestamp: number) => string;
  onRestoreVersion?: (itemId: string, timestamp: number) => void;
  viewMode?: 'accordion' | 'list';
}

const LogTableSection = ({ 
  filteredEntries, 
  formatDate, 
  onRestoreVersion,
  viewMode = 'list'
}: LogTableSectionProps) => {
  if (filteredEntries.length === 0) {
    return (
      <div className="p-8 text-center text-gray-300 animate-fade-in">
        <div className="bg-cyrus-dark-lighter p-6 rounded-lg border border-cyrus-dark-lightest shadow-lg">
          <p className="text-lg">No log entries found matching your criteria.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or loading more data.</p>
        </div>
      </div>
    );
  }

  // Group entries by itemId for accordion view
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const key = entry.itemId;
    if (!groups[key]) {
      groups[key] = {
        itemId: key,
        itemName: entry.itemName,
        entries: []
      };
    }
    groups[key].entries.push(entry);
    return groups;
  }, {} as Record<string, { itemId: string; itemName: string; entries: LogEntry[] }>);

  return (
    <div className="flex-1 overflow-auto">
      {viewMode === 'list' ? (
        <table className="w-full whitespace-nowrap">
          <thead className="bg-cyrus-dark sticky top-0 z-10">
            <tr className="border-b border-cyrus-dark-lightest">
              <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Item</th>
              <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Field</th>
              <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Old Value</th>
              <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">New Value</th>
              {onRestoreVersion && (
                <th className="px-4 py-3 text-center text-gray-300 text-sm font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <tr 
                key={`${entry.itemId}-${entry.field}-${entry.timestamp}-${index}`}
                className="border-b border-cyrus-dark-lightest hover:bg-[#2C2C30] transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <td className="px-4 py-3 text-sm text-gray-300">{formatDate(entry.timestamp)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-[#333336] rounded-md text-cyrus-blue">{entry.itemName}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{entry.field}</td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px] truncate group relative">
                  <div className="truncate">
                    {String(entry.oldValue)}
                  </div>
                  <div className="absolute hidden group-hover:block bg-[#3A3A3D] p-2 rounded shadow-lg z-20 left-0 top-full whitespace-normal break-words max-w-[300px] text-xs">
                    {String(entry.oldValue)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px] truncate group relative">
                  <div className="truncate">
                    {String(entry.newValue)}
                  </div>
                  <div className="absolute hidden group-hover:block bg-[#3A3A3D] p-2 rounded shadow-lg z-20 left-0 top-full whitespace-normal break-words max-w-[300px] text-xs">
                    {String(entry.newValue)}
                  </div>
                </td>
                {onRestoreVersion && (
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestoreVersion(entry.itemId, entry.timestamp)}
                      className="text-xs bg-transparent hover:bg-cyrus-blue hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Accordion type="multiple" className="px-4 py-2 animate-fade-in">
          {Object.values(groupedEntries).map((group, groupIndex) => (
            <AccordionItem 
              key={group.itemId} 
              value={group.itemId}
              className="border-b border-[#3A3A3D] mb-2 rounded-md overflow-hidden bg-[#252528] hover:bg-[#2A2A2E] transition-colors"
              style={{ animationDelay: `${groupIndex * 0.05}s` }}
            >
              <AccordionTrigger className="text-white hover:no-underline px-4 py-3">
                <span className="flex items-center">
                  <span className="font-medium text-cyrus-blue">{group.itemName}</span>
                  <span className="ml-2 text-xs text-gray-400 px-2 py-1 bg-[#333336] rounded-full">
                    {group.entries.length} changes
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="animate-accordion-down">
                <div className="bg-[#1E1E20] p-2 rounded-md mb-4">
                  <table className="w-full whitespace-nowrap">
                    <thead className="bg-[#2C2C30]">
                      <tr className="border-b border-[#3A3A3D]">
                        <th className="px-4 py-2 text-left text-gray-300 text-xs font-medium">Timestamp</th>
                        <th className="px-4 py-2 text-left text-gray-300 text-xs font-medium">Field</th>
                        <th className="px-4 py-2 text-left text-gray-300 text-xs font-medium">Old Value</th>
                        <th className="px-4 py-2 text-left text-gray-300 text-xs font-medium">New Value</th>
                        {onRestoreVersion && (
                          <th className="px-4 py-2 text-center text-gray-300 text-xs font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((entry, index) => (
                        <tr 
                          key={`${entry.itemId}-${entry.field}-${entry.timestamp}-${index}`}
                          className="border-b border-[#3A3A3D] hover:bg-[#2C2C32] transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <td className="px-4 py-2 text-xs text-gray-300">{formatDate(entry.timestamp)}</td>
                          <td className="px-4 py-2 text-xs">
                            <span className="px-2 py-1 bg-[#333336] rounded-md text-cyrus-gold">{entry.field}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-300 max-w-[200px] truncate group relative">
                            <div className="truncate">
                              {String(entry.oldValue)}
                            </div>
                            <div className="absolute hidden group-hover:block bg-[#3A3A3D] p-2 rounded shadow-lg z-20 left-0 top-full whitespace-normal break-words max-w-[300px] text-xs">
                              {String(entry.oldValue)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-300 max-w-[200px] truncate group relative">
                            <div className="truncate">
                              {String(entry.newValue)}
                            </div>
                            <div className="absolute hidden group-hover:block bg-[#3A3A3D] p-2 rounded shadow-lg z-20 left-0 top-full whitespace-normal break-words max-w-[300px] text-xs">
                              {String(entry.newValue)}
                            </div>
                          </td>
                          {onRestoreVersion && (
                            <td className="px-4 py-2 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRestoreVersion(entry.itemId, entry.timestamp)}
                                className="text-xs bg-transparent hover:bg-cyrus-blue hover:text-white transition-colors"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default LogTableSection;
