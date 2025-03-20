
export interface ItemData {
  [key: string]: string | number | boolean;
}

export interface ColumnDefinition {
  field: string;
  header: string;
  editable: boolean;
  type: 'text' | 'number' | 'dropdown' | 'checkbox';
  options?: string[];
}

export interface ResourceTab {
  id: string;
  label: string;
  columns: ColumnDefinition[];
}

export interface EffectData {
  type: string;
  value: string | number;
}

export interface SetEffectData {
  id: string;
  name: string;
  effects: EffectData[];
  requiredPieces: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  displayName: string;
  description?: string; // Added description field
  idPropItem?: string;
  data: ItemData;
  effects: EffectData[];
  setEffects?: SetEffectData[];
}

export interface FileData {
  header: string[];
  items: ResourceItem[];
  originalContent?: string; // Store the original file content for exact preservation
  isSpecItemFile?: boolean; // Flag to indicate if this is a spec_item.txt file
}

// Add LogEntry interface to fix the import error in useResourceState.tsx
export interface LogEntry {
  timestamp: number;
  itemId: string;
  itemName: string;
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
}

// Add additional types for file upload handling to ensure we're not creating duplicate modals
export interface FileUploadConfig {
  isVisible: boolean;
  source: 'header' | 'fileMenu'; // Track where the upload request came from
}
