import { useState, useEffect, memo, useMemo, lazy, Suspense, Component, ErrorInfo } from "react";
import { ResourceItem, EffectData } from "../types/fileTypes";
import { trackModifiedFile, trackPropItemChanges } from "../utils/file/fileOperations";
import { updateItemIdInDefine } from "../utils/file/defineItemParser";
import { updateModelFileNameInMdlDyna } from "../utils/file/mdlDynaParser";
import { toast } from "sonner";

// Error Boundary Komponente für Fehlerbehandlung bei dynamischen Imports
class ErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Component error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Robustere Import-Funktion mit mehreren Fallbacks und feingranularer Fehlerbehandlung
const robustImport = async (path: string, componentName: string) => {
  try {
    console.log(`Attempting to load ${componentName} from ${path}`);
    // Erster Versuch mit .tsx
    return await import(/* @vite-ignore */ `${path}.tsx`);
  } catch (error) {
    console.error(`Error loading ${componentName} with .tsx extension:`, error);
    try {
      // Zweiter Versuch ohne Erweiterung
      console.log(`Retry loading ${componentName} without extension`);
      return await import(/* @vite-ignore */ path);
    } catch (retryError) {
      console.error(`Failed on second attempt for ${componentName}:`, retryError);
      
      // Letzte Rettung: Wir liefern ein Fallback-Objekt mit einer leeren Komponente zurück,
      // um die Anwendung am Laufen zu halten
      console.warn(`Using fallback for ${componentName}`);
      return {
        default: (props: any) => (
          <FallbackSection 
            title={componentName} 
            error={retryError instanceof Error ? retryError : new Error(`Failed to load ${componentName}`)} 
          />
        )
      };
    }
  }
};

// Definiere die Komponenten mit der robusteren Import-Methode
const GeneralSection = lazy(() => robustImport("./resource-editor/GeneralSection", "General"));
const StatsSection = lazy(() => robustImport("./resource-editor/StatsSection", "Stats"));
const SetEffectsSection = lazy(() => robustImport("./resource-editor/SetEffectsSection", "Set Effects"));
const PropertiesSection = lazy(() => robustImport("./resource-editor/PropertiesSection", "Properties"));
const WeaponPropertiesSection = lazy(() => robustImport("./resource-editor/WeaponPropertiesSection", "Weapon Properties"));
const ResistancesSection = lazy(() => robustImport("./resource-editor/ResistancesSection", "Resistances"));
const VisualPropertiesSection = lazy(() => robustImport("./resource-editor/VisualPropertiesSection", "Visual Properties"));
const SoundEffectsSection = lazy(() => robustImport("./resource-editor/SoundEffectsSection", "Sound Effects"));

// Fallback für Fehler in Sektionen
const FallbackSection = ({ title, error }: { title: string, error: Error }) => (
  <div className="mb-6 p-4 border border-red-500 rounded-md bg-red-100 dark:bg-red-900/20">
    <h2 className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{title} (Fehler beim Laden)</h2>
    <p className="text-sm text-red-500">Die Komponente konnte nicht geladen werden. Fehlermeldung: {error.message}</p>
  </div>
);

// Loading-Fallback für Suspense
const SectionLoader = () => (
  <div className="animate-pulse my-4 p-4 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
    <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);

interface ResourceEditorProps {
  item: ResourceItem;
  onUpdateItem: (updatedItem: ResourceItem, field?: string, oldValue?: any) => void;
  editMode?: boolean;
}

// Performance-Optimierung: Memoized Editor-Komponente
const ResourceEditor = memo(({ item, onUpdateItem, editMode = false }: ResourceEditorProps) => {
  const [localItem, setLocalItem] = useState<ResourceItem>(item);
  
  // Performance-Optimierung: Nur bei tatsächlicher Änderung updaten
  useEffect(() => {
    // Deep comparison der Inhalte
    if (JSON.stringify(localItem) !== JSON.stringify(item)) {
      setLocalItem(item);
    }
  }, [item]);
  
  // Performance-Optimierung: Memoized handleDataChange
  const handleDataChange = useMemo(() => {
    return (field: string, value: string | number | boolean) => {
      // If not in edit mode, don't allow changes
      if (!editMode) return;
      
      // Store the old value for logging purposes
      const oldValue = 
        field === 'displayName' ? localItem.displayName : 
        field === 'description' ? localItem.description : 
        localItem.data[field];
      
      // Create an updated item, handling special fields like displayName and description differently
      let updatedItem;
      
      if (field === 'displayName') {
        updatedItem = {
          ...localItem,
          displayName: value as string
        };
        
        // Track propItem.txt.txt modification when display name changes
        trackPropItemChanges(
          localItem.id, 
          localItem.name, 
          value as string, 
          localItem.description || ''
        );
      } else if (field === 'description') {
        updatedItem = {
          ...localItem,
          description: value as string
        };
        
        // Track propItem.txt.txt modification when description changes
        trackPropItemChanges(
          localItem.id, 
          localItem.name, 
          localItem.displayName || '', 
          value as string
        );
      } else if (field === 'itemId') {
        // Special handling for item ID changes (defineItem.h updates)
        const defineName = localItem.data.dwID as string;
        const success = updateItemIdInDefine(defineName, value as string);
        
        if (success) {
          toast.success(`Updated item ID in defineItem.h`);
        } else {
          toast.error(`Failed to update item ID in defineItem.h`);
        }
        
        // This doesn't directly modify the ResourceItem data, as itemId is not stored in it
        // It's retrieved from defineItem.h when needed
        updatedItem = { ...localItem };
      } else if (field === 'modelFileName') {
        // Special handling for model filename changes (mdlDyna.inc updates)
        const defineName = localItem.data.dwID as string;
        const success = updateModelFileNameInMdlDyna(defineName, value as string);
        
        if (success) {
          toast.success(`Updated model filename in mdlDyna.inc`);
        } else {
          toast.error(`Failed to update model filename in mdlDyna.inc`);
        }
        
        // This doesn't directly modify the ResourceItem data, as modelFileName is not stored in it
        // It's retrieved from mdlDyna.inc when needed
        updatedItem = { ...localItem };
      } else {
        updatedItem = {
          ...localItem,
          data: {
            ...localItem.data,
            [field]: value
          }
        };
        
        // Track appropriate file modification based on field
        if (field.startsWith('dw') || field.startsWith('f')) {
          // These typically go in Spec_Item.txt
          trackModifiedFile("Spec_Item.txt", `Field ${field} updated in item ${localItem.id}`);
        } else if (field.includes('Model') || field.includes('Texture')) {
          // These might be related to mdlDyna.inc
          trackModifiedFile("mdlDyna.inc", `Visual property ${field} updated for item ${localItem.id}`);
        } else if (field.includes('Sound')) {
          // Sound-related fields
          trackModifiedFile("Sound.txt", `Sound property ${field} updated for item ${localItem.id}`);
        }
      }
      
      setLocalItem(updatedItem);
      onUpdateItem(updatedItem, field, oldValue);
    };
  }, [localItem, editMode, onUpdateItem]);
  
  // Performance-Optimierung: Memoized handleEffectChange
  const handleEffectChange = useMemo(() => {
    return (index: number, field: 'type' | 'value', value: string | number) => {
      // If not in edit mode, don't allow changes
      if (!editMode) return;
      
      const updatedEffects = [...localItem.effects];
      
      // Store old effect for logging
      const oldEffect = updatedEffects[index] ? { ...updatedEffects[index] } : null;
      
      if (index >= updatedEffects.length) {
        // Add a new effect if we're editing beyond current array length
        updatedEffects.push({ type: field === 'type' ? value as string : '', value: field === 'value' ? value : '' });
      } else {
        // Update existing effect
        updatedEffects[index] = {
          ...updatedEffects[index],
          [field]: value
        };
      }
      
      const updatedItem = {
        ...localItem,
        effects: updatedEffects
      };
      
      // Track effects modification in defineItem.h
      trackModifiedFile("defineItem.h", `Effect ${index} ${field} updated for item ${localItem.id}`);
      
      setLocalItem(updatedItem);
      onUpdateItem(updatedItem, `effect_${index}_${field}`, oldEffect ? oldEffect[field] : null);
    };
  }, [localItem, editMode, onUpdateItem]);
  
  // Performance-Optimierung: Memoized visageWeight
  // Analysiere das Item, um zu entscheiden, welche Sektionen gezeigt werden sollen
  const { showWeaponProps, showResistances, showVisualProps, showSoundEffects } = useMemo(() => {
    // Analyse des Items für bedingte Rendering-Entscheidungen
    const itemType = localItem.data?.dwItemKind;
    const isWeapon = itemType === "IK_WEAPON";
    const hasResistances = localItem.data?.dwAddAbility || localItem.data?.dwAbnormalKind;
    const hasVisuals = localItem.data?.dwItemKind1 || localItem.data?.dwItemLV;
    const hasSounds = localItem.data?.dwSndAttack1 || localItem.data?.dwSndAttack2;
    
    return {
      showWeaponProps: isWeapon,
      showResistances: hasResistances,
      showVisualProps: hasVisuals,
      showSoundEffects: hasSounds
    };
  }, [localItem.data]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ErrorBoundary fallback={<FallbackSection title="General" error={new Error("Komponente konnte nicht gerendert werden")} />}>
        <Suspense fallback={<SectionLoader />}>
          <GeneralSection 
            localItem={localItem}
            editMode={editMode}
            handleDataChange={handleDataChange}
          />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<FallbackSection title="Stats" error={new Error("Komponente konnte nicht gerendert werden")} />}>
        <Suspense fallback={<SectionLoader />}>
          <StatsSection 
            localItem={localItem}
            editMode={editMode}
            handleEffectChange={handleEffectChange}
          />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<FallbackSection title="Properties" error={new Error("Komponente konnte nicht gerendert werden")} />}>
        <Suspense fallback={<SectionLoader />}>
          <PropertiesSection 
            localItem={localItem}
            editMode={editMode}
            handleDataChange={handleDataChange}
          />
        </Suspense>
      </ErrorBoundary>
      
      {showWeaponProps && (
        <ErrorBoundary fallback={<FallbackSection title="Weapon Properties" error={new Error("Komponente konnte nicht gerendert werden")} />}>
          <Suspense fallback={<SectionLoader />}>
            <WeaponPropertiesSection 
              localItem={localItem}
              editMode={editMode}
              handleDataChange={handleDataChange}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      
      {showResistances && (
        <ErrorBoundary fallback={<FallbackSection title="Resistances" error={new Error("Komponente konnte nicht gerendert werden")} />}>
          <Suspense fallback={<SectionLoader />}>
            <ResistancesSection 
              localItem={localItem}
              editMode={editMode}
              handleDataChange={handleDataChange}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      
      {showSoundEffects && (
        <ErrorBoundary fallback={<FallbackSection title="Sound Effects" error={new Error("Komponente konnte nicht gerendert werden")} />}>
          <Suspense fallback={<SectionLoader />}>
            <SoundEffectsSection 
              localItem={localItem}
              editMode={editMode}
              handleDataChange={handleDataChange}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      
      {showVisualProps && (
        <ErrorBoundary fallback={<FallbackSection title="Visual Properties" error={new Error("Komponente konnte nicht gerendert werden")} />}>
          <Suspense fallback={<SectionLoader />}>
            <VisualPropertiesSection 
              localItem={localItem}
              editMode={editMode}
              handleDataChange={handleDataChange}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      
      <ErrorBoundary fallback={<FallbackSection title="Set Effects" error={new Error("Komponente konnte nicht gerendert werden")} />}>
        <Suspense fallback={<SectionLoader />}>
          <SetEffectsSection item={localItem} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

// Display name für bessere Debug-Erfahrung
ResourceEditor.displayName = 'ResourceEditor';

export default ResourceEditor;
