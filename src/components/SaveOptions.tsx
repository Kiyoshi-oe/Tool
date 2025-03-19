
import { useState } from "react";
import { Save, SaveAll, Download } from "lucide-react";
import { toast } from "sonner";

interface SaveOptionsProps {
  onSave: () => void;
  onSaveAs: (fileName: string) => void;
  onSaveAllFiles: () => void;
}

const SaveOptions = ({ onSave, onSaveAs, onSaveAllFiles }: SaveOptionsProps) => {
  const [fileName, setFileName] = useState("Spec_Item.txt");
  const [showSaveAsInput, setShowSaveAsInput] = useState(false);
  
  const handleSaveAs = () => {
    if (fileName.trim()) {
      onSaveAs(fileName);
      setShowSaveAsInput(false);
    } else {
      toast.error("Please enter a valid filename");
    }
  };
  
  return (
    <div className="absolute right-0 top-full mt-1 bg-cyrus-dark-light border border-cyrus-dark-lightest rounded-md shadow-lg z-50 w-64">
      <div className="p-2">
        <button 
          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm"
          onClick={onSave}
        >
          <Save size={16} />
          <span>Save Current File</span>
        </button>
        
        <button 
          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm"
          onClick={onSaveAllFiles}
        >
          <SaveAll size={16} />
          <span>Save All Modified Files</span>
        </button>
        
        <button 
          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm"
          onClick={() => setShowSaveAsInput(true)}
        >
          <SaveAll size={16} />
          <span>Save As...</span>
        </button>
        
        <button 
          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm"
          onClick={() => onSaveAs(fileName + '.download')}
        >
          <Download size={16} />
          <span>Download Copy</span>
        </button>
        
        {showSaveAsInput && (
          <div className="mt-2 p-2 border-t border-cyrus-dark-lightest">
            <div className="text-xs text-gray-400 mb-1">Enter file name:</div>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 bg-cyrus-dark-lighter border border-cyrus-dark-lightest rounded px-2 py-1 text-sm text-white"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                autoFocus
              />
              <button
                className="bg-cyrus-blue hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                onClick={handleSaveAs}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveOptions;
