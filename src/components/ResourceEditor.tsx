
import { useState, useEffect } from "react";
import { ResourceItem, EffectData } from "../types/fileTypes";
import GeneralSection from "./resource-editor/GeneralSection";
import StatsSection from "./resource-editor/StatsSection";
import SetEffectsSection from "./resource-editor/SetEffectsSection";
import PropertiesSection from "./resource-editor/PropertiesSection";
import WeaponPropertiesSection from "./resource-editor/WeaponPropertiesSection";
import ResistancesSection from "./resource-editor/ResistancesSection";
import VisualPropertiesSection from "./resource-editor/VisualPropertiesSection";
import SoundEffectsSection from "./resource-editor/SoundEffectsSection";
import { trackModifiedFile, trackPropItemChanges } from "../utils/file/fileOperations";

interface ResourceEditorProps {
  item: ResourceItem;
  onUpdateItem: (updatedItem: ResourceItem, field?: string, oldValue?: any) => void;
  editMode?: boolean;
}

const ResourceEditor = ({ item, onUpdateItem, editMode = false }: ResourceEditorProps) => {
  const [localItem, setLocalItem] = useState<ResourceItem>(item);
  
  useEffect(() => {
    setLocalItem(item);
  }, [item]);
  
  const handleDataChange = (field: string, value: string | number | boolean) => {
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
  
  const handleEffectChange = (index: number, field: 'type' | 'value', value: string | number) => {
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
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Order of sections based on requirements */}
      <GeneralSection 
        localItem={localItem}
        editMode={editMode}
        handleDataChange={handleDataChange}
      />
      
      <StatsSection 
        localItem={localItem}
        editMode={editMode}
        handleEffectChange={handleEffectChange}
      />
      
      <PropertiesSection 
        localItem={localItem}
        editMode={editMode}
        handleDataChange={handleDataChange}
      />
      
      <WeaponPropertiesSection 
        localItem={localItem}
        editMode={editMode}
        handleDataChange={handleDataChange}
      />
      
      <ResistancesSection 
        localItem={localItem}
        editMode={editMode}
        handleDataChange={handleDataChange}
      />
      
      <SoundEffectsSection 
        localItem={localItem}
        editMode={editMode}
        handleDataChange={handleDataChange}
      />
      
      <SetEffectsSection item={localItem} />
    </div>
  );
};

export default ResourceEditor;
