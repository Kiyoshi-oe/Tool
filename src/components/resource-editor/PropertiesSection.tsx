
import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";

interface PropertiesSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

const PropertiesSection = ({ localItem, editMode, handleDataChange }: PropertiesSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Additional Properties</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">Version</label>
          <Input
            type="text"
            className="form-input"
            value={localItem.data.ver6 as string || ''}
            onChange={(e) => handleDataChange('ver6', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Durability</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.dwEndurance as string || '0'}
            onChange={(e) => handleDataChange('dwEndurance', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Max Repair</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.nMaxRepair as string || '0'}
            onChange={(e) => handleDataChange('nMaxRepair', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Handed</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={localItem.data.dwHanded as string || ''}
              onChange={(e) => handleDataChange('dwHanded', e.target.value)}
              disabled={!editMode}
            >
              <option value="HD_ONE">One Hand</option>
              <option value="HD_TWO">Two Hand</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Parts</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={localItem.data.dwParts as string || ''}
              onChange={(e) => handleDataChange('dwParts', e.target.value)}
              disabled={!editMode}
            >
              <option value="PARTS_RWEAPON">Right Weapon</option>
              <option value="PARTS_LWEAPON">Left Weapon</option>
              <option value="PARTS_HEAD">Head</option>
              <option value="PARTS_UPPER">Upper Body</option>
              <option value="PARTS_LOWER">Lower Body</option>
              <option value="PARTS_HAND">Hands</option>
              <option value="PARTS_FOOT">Feet</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Item Level</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.dwItemLV as string || '0'}
            onChange={(e) => handleDataChange('dwItemLV', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Item Rarity</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.dwItemRare as string || '0'}
            onChange={(e) => handleDataChange('dwItemRare', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Shop-able</label>
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                className="form-radio"
                name="shopable"
                checked={localItem.data.dwShopAble === "0"}
                onChange={() => handleDataChange('dwShopAble', "0")}
                disabled={!editMode}
              />
              <span className="text-sm text-gray-300">No</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                className="form-radio"
                name="shopable"
                checked={localItem.data.dwShopAble === "1"}
                onChange={() => handleDataChange('dwShopAble', "1")}
                disabled={!editMode}
              />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Can Trade</label>
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                className="form-radio"
                name="canTrade"
                checked={localItem.data.bCanTrade === "0"}
                onChange={() => handleDataChange('bCanTrade', "0")}
                disabled={!editMode}
              />
              <span className="text-sm text-gray-300">No</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                className="form-radio"
                name="canTrade"
                checked={localItem.data.bCanTrade === "1"}
                onChange={() => handleDataChange('bCanTrade', "1")}
                disabled={!editMode}
              />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesSection;
