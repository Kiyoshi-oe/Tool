
import { useState } from "react";
import { toast } from "sonner";

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  settings: {
    autoSaveInterval: number;
    enableLogging: boolean;
    darkMode: boolean;
  };
  onSaveSettings: (settings: any) => void;
}

const SettingsModal = ({ isVisible, onClose, settings, onSaveSettings }: SettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  if (!isVisible) return null;
  
  const handleSave = () => {
    onSaveSettings(localSettings);
    toast.success("Settings saved successfully");
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-cyrus-dark-light rounded-lg p-6 shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-cyrus-gold">Settings</h2>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Auto-save Interval (minutes)</label>
          <input
            type="number"
            min="0"
            max="60"
            className="form-input"
            value={localSettings.autoSaveInterval}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              autoSaveInterval: parseInt(e.target.value) || 0
            })}
          />
          <p className="text-xs text-gray-400 mt-1">Set to 0 to disable auto-save</p>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localSettings.enableLogging}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                enableLogging: e.target.checked
              })}
            />
            <span className="text-gray-300">Enable change logging</span>
          </label>
        </div>
        
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localSettings.darkMode}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                darkMode: e.target.checked
              })}
            />
            <span className="text-gray-300">Dark mode</span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-4 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-cyrus-blue hover:bg-blue-700 text-white py-1 px-4 rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
