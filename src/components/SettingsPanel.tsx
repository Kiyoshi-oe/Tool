
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Define the font option type
interface FontOption {
  value: string;
  label: string;
  family: string;
}

// Define the theme type
interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  buttonBg?: string;
  buttonHover?: string;
  description?: string;
}

interface SettingsPanelProps {
  settings: {
    autoSaveInterval: number;
    enableLogging: boolean;
    darkMode: boolean;
    font?: string;
    fontSize?: number;
    theme?: string;
    shortcuts?: Record<string, string>;
    localStoragePath?: string;
  };
  onSaveSettings: (settings: any) => void;
  fontOptions?: FontOption[];
  themes?: Theme[];
}

const SettingsPanel = ({ settings, onSaveSettings, fontOptions = [], themes = [] }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  const handleSave = () => {
    onSaveSettings(localSettings);
    toast.success("Settings saved successfully");
  };

  // Get the current theme
  const currentTheme = themes.find(t => t.id === localSettings.theme) || themes[0];
  
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ 
      backgroundColor: currentTheme?.background || '#1E1E1E', 
      color: currentTheme?.foreground || '#FFFFFF' 
    }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: currentTheme?.accent || '#FFC940' }}>Settings</h2>
        
        <div className={`rounded-lg p-6 mb-6 ${currentTheme?.isDark ? 'bg-cyrus-dark-light' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-medium mb-4" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Application Settings</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block mb-2" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Auto-save Interval (minutes)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="60"
                  className="form-input w-24"
                  style={{ 
                    backgroundColor: currentTheme?.isDark ? '#2D2D30' : '#F1F1F1',
                    color: currentTheme?.foreground || '#FFFFFF',
                    borderColor: currentTheme?.isDark ? '#3E3E42' : '#D6D6D6'
                  }}
                  value={localSettings.autoSaveInterval}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoSaveInterval: parseInt(e.target.value) || 0
                  })}
                />
                <span className="ml-2 text-sm text-gray-400">Set to 0 to disable auto-save</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Enable change logging</label>
                <Switch 
                  checked={localSettings.enableLogging}
                  onCheckedChange={(checked) => setLocalSettings({
                    ...localSettings,
                    enableLogging: checked
                  })}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Track all changes made to resources. This allows you to review and restore previous versions.
              </p>
            </div>

            {themes.length > 0 && (
              <div>
                <label className="block mb-2" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Application Theme</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {themes.map(theme => (
                    <div
                      key={theme.id}
                      className={`cursor-pointer p-3 rounded border transition-all ${
                        localSettings.theme === theme.id 
                          ? 'ring-2' 
                          : 'hover:border-gray-500'
                      }`}
                      style={{
                        backgroundColor: theme.background || (theme.isDark ? '#1a1a1a' : '#ffffff'),
                        borderColor: localSettings.theme === theme.id 
                          ? (theme.accent || '#0078D7') 
                          : (theme.isDark ? '#444' : '#ddd'),
                        boxShadow: localSettings.theme === theme.id 
                          ? `0 0 0 2px ${theme.accent || '#0078D7'}20` 
                          : 'none'
                      }}
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        theme: theme.id,
                        darkMode: theme.isDark
                      })}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor: theme.accent || (theme.isDark ? '#1a1a1a' : '#ffffff'),
                            border: theme.isDark ? '1px solid #444' : '1px solid #ddd'
                          }}
                        ></div>
                        <span style={{ color: theme.foreground || (theme.isDark ? '#E0E0E0' : '#212121') }} className="text-sm">
                          {theme.name}
                        </span>
                      </div>
                      {theme.description && (
                        <p className="text-xs mt-1" style={{ color: theme.foreground || (theme.isDark ? '#A0A0A0' : '#666666') }}>
                          {theme.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fontOptions.length > 0 && (
              <div>
                <label className="block mb-2" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Font Family</label>
                <select
                  className="form-select w-full rounded px-3 py-2"
                  style={{ 
                    backgroundColor: currentTheme?.isDark ? '#2D2D30' : '#F1F1F1',
                    color: currentTheme?.foreground || '#FFFFFF',
                    borderColor: currentTheme?.isDark ? '#3E3E42' : '#D6D6D6'
                  }}
                  value={localSettings.font}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    font: e.target.value
                  })}
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.family }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {localSettings.fontSize !== undefined && (
              <div>
                <label className="block mb-2" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>
                  Font Size ({localSettings.fontSize}px)
                </label>
                <input
                  type="range"
                  min="10"
                  max="36"
                  step="1"
                  className="w-full"
                  value={localSettings.fontSize}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    fontSize: parseInt(e.target.value)
                  })}
                />
              </div>
            )}

            {localSettings.localStoragePath !== undefined && (
              <div>
                <label className="block mb-2" style={{ color: currentTheme?.foreground || '#FFFFFF' }}>Local Storage Path</label>
                <input
                  type="text"
                  className="form-input w-full"
                  style={{ 
                    backgroundColor: currentTheme?.isDark ? '#2D2D30' : '#F1F1F1',
                    color: currentTheme?.foreground || '#FFFFFF',
                    borderColor: currentTheme?.isDark ? '#3E3E42' : '#D6D6D6'
                  }}
                  value={localSettings.localStoragePath}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    localStoragePath: e.target.value
                  })}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="py-2 px-6 rounded"
            style={{ 
              backgroundColor: currentTheme?.accent || '#0078D7',
              color: currentTheme?.isDark ? '#FFFFFF' : '#FFFFFF',
              borderColor: currentTheme?.isDark ? '#3E3E42' : '#D6D6D6'
            }}
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
