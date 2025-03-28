export interface ResourceItem {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  setEffects?: any[];
  data: {
    dwID?: string | number;
    szName?: string | number;
    dwItemKind1?: string | number;
    [key: string]: any;
  };
  [key: string]: any;
} 