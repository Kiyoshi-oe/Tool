import { useState, useEffect } from "react";

interface ModernToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  trueLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
}

const ModernToggle = ({ 
  value, 
  onChange, 
  label, 
  trueLabel = "Yes", 
  falseLabel = "No",
  disabled = false 
}: ModernToggleProps) => {
  // Zuverlässigere State-Verwaltung mit Fehlerbehandlung
  const [internalValue, setInternalValue] = useState<boolean>(false);
  
  // Sichere Aktualisierung des internen States basierend auf Props
  useEffect(() => {
    try {
      setInternalValue(Boolean(value));
    } catch (error) {
      console.error("Error setting ModernToggle internal value:", error);
      // Fallback auf false, wenn der Wert ungültig ist
      setInternalValue(false);
    }
  }, [value]);
  
  // Sicheres Ändern des Werts mit Fehlerbehandlung
  const handleToggle = (newValue: boolean) => {
    try {
      if (disabled) return;
      
      setInternalValue(newValue);
      
      // Prop-Callback sicher aufrufen
      if (typeof onChange === 'function') {
        onChange(newValue);
      }
    } catch (error) {
      console.error("Error in ModernToggle change handler:", error);
    }
  };
  
  try {
    return (
      <div className="flex items-center space-x-3">
        {label && <span className="text-sm text-gray-400">{label}</span>}
        
        <div className="flex bg-cyrus-dark-lighter rounded-lg p-0.5 border border-cyrus-dark-lightest">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              !internalValue 
                ? 'bg-cyrus-dark-lightest text-cyrus-gold shadow-sm' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleToggle(false)}
            disabled={disabled}
          >
            {falseLabel}
          </button>
          
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              internalValue 
                ? 'bg-cyrus-blue text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleToggle(true)}
            disabled={disabled}
          >
            {trueLabel}
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering ModernToggle:", error);
    return (
      <div className="flex items-center space-x-3 text-red-500 text-sm">
        {label && <span>{label}</span>}
        <span>Toggle Error</span>
      </div>
    );
  }
};

export default ModernToggle;
