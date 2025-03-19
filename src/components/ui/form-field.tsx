
import React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Info, AlertCircle, Check } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "number" | "password" | "email";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  min?: number;
  max?: number;
  step?: string | number;
  isValid?: boolean;
}

const FormField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  helperText,
  className,
  inputClassName,
  min,
  max,
  step,
  isValid,
}: FormFieldProps) => {
  const hasError = !!error;
  const showValidIcon = isValid && !hasError;

  return (
    <div className={cn("form-field space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={cn("form-label", hasError && "text-destructive")}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      </div>
      
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            inputClassName,
            hasError && "border-destructive focus-visible:ring-destructive",
            showValidIcon && "pr-10"
          )}
          min={min}
          max={max}
          step={step}
          aria-invalid={hasError}
        />
        
        {showValidIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <Check size={16} />
          </div>
        )}
      </div>
      
      {(hasError || helperText) && (
        <div className="space-y-1">
          {hasError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{error}</span>
            </p>
          )}
          
          {helperText && !hasError && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Info size={14} />
              <span>{helperText}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { FormField };
