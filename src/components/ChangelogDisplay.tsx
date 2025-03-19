
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

interface ChangelogDisplayProps {
  onBack: () => void;
}

const ChangelogDisplay = ({ onBack }: ChangelogDisplayProps) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([
    {
      version: "1.2.0",
      date: "2024-03-18",
      changes: [
        "Added support for DDS file format in item previews",
        "Improved tab management with temporary and pinned tabs",
        "Updated text field styling with white text on gray background",
        "Added accordion view option for change logs",
        "Fixed resource file loading with clearer selection options",
        "Improved file saving mechanism to edit files in place"
      ]
    },
    {
      version: "1.1.0",
      date: "2024-02-15",
      changes: [
        "Added support for parsing propItem.txt",
        "Implemented dark mode theme switching",
        "Added auto-save functionality",
        "Added change logging system",
        "Improved performance for large file loading"
      ]
    },
    {
      version: "1.0.0",
      date: "2024-01-10",
      changes: [
        "Initial release of Cyrus Resource Tool",
        "Basic resource file editing capabilities",
        "Support for Spec_item.txt parsing and editing",
        "Tab-based navigation for different item categories",
        "Settings panel for customization",
        "Item search and filtering"
      ]
    }
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          <h2 className="text-2xl font-semibold text-cyrus-gold">Changelog</h2>
        </div>
        
        <div className="space-y-8">
          {changelog.map((entry) => (
            <div 
              key={entry.version} 
              className="border border-cyrus-dark-lightest rounded-lg p-6 bg-cyrus-dark-light"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-white">Version {entry.version}</h3>
                <span className="text-sm text-gray-400">{entry.date}</span>
              </div>
              
              <ul className="space-y-2">
                {entry.changes.map((change, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-cyrus-blue mr-2">•</span>
                    <span className="text-gray-300">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogDisplay;
