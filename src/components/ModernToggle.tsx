
import { useState } from "react";

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
  return (
    <div className="flex items-center space-x-3">
      {label && <span className="text-sm text-gray-400">{label}</span>}
      
      <div className="flex bg-cyrus-dark-lighter rounded-lg p-0.5 border border-cyrus-dark-lightest">
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            !value 
              ? 'bg-cyrus-dark-lightest text-cyrus-gold shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => !disabled && onChange(false)}
          disabled={disabled}
        >
          {falseLabel}
        </button>
        
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            value 
              ? 'bg-cyrus-blue text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => !disabled && onChange(true)}
          disabled={disabled}
        >
          {trueLabel}
        </button>
      </div>
    </div>
  );
};

export default ModernToggle;
