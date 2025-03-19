
import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { attackStyleOptions, weaponTypeOptions } from "../../utils/resourceEditorUtils";

interface WeaponPropertiesSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

const WeaponPropertiesSection = ({ localItem, editMode, handleDataChange }: WeaponPropertiesSectionProps) => {
  if (localItem.data.dwItemKind1 !== "IK1_WEAPON") {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Weapon Properties</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">Attack Min</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.dwAbilityMin as string || '0'}
            onChange={(e) => handleDataChange('dwAbilityMin', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Attack Max</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.dwAbilityMax as string || '0'}
            onChange={(e) => handleDataChange('dwAbilityMax', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Attack Style 1</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={localItem.data.dwItemAtkOrder1 as string || ''}
              onChange={(e) => handleDataChange('dwItemAtkOrder1', e.target.value)}
              disabled={!editMode}
            >
              {attackStyleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Attack Style 2</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={localItem.data.dwItemAtkOrder2 as string || ''}
              onChange={(e) => handleDataChange('dwItemAtkOrder2', e.target.value)}
              disabled={!editMode}
            >
              {attackStyleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Weapon Type</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={localItem.data.dwWeaponType as string || ''}
              onChange={(e) => handleDataChange('dwWeaponType', e.target.value)}
              disabled={!editMode}
            >
              {weaponTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Hit Rate Adjustment</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.nAdjHitRate as string || '0'}
            onChange={(e) => handleDataChange('nAdjHitRate', e.target.value)}
            disabled={!editMode}
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

export default WeaponPropertiesSection;
