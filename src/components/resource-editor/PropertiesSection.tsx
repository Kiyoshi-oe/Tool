import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown, Info } from "lucide-react";
import { Input } from "../ui/input";
import { FormField } from "../ui/form-field";
import ModernToggle from "../ModernToggle";

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

        
        <FormField
          id="durability"
          label="Durability"
          type="number"
          value={localItem.data.dwEndurance as string || '0'}
          onChange={(value) => handleDataChange('dwEndurance', value)}
          disabled={!editMode}
          helperText="Item durability"
        />
        
        <FormField
          id="max-repair"
          label="Max Repair"
          type="number"
          value={localItem.data.nMaxRepair as string || '0'}
          onChange={(value) => handleDataChange('nMaxRepair', value)}
          disabled={!editMode}
          helperText="Maximum number of times the item can be repaired"
        />
        
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
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Whether the item is one-handed or two-handed</span>
          </p>
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
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Body part where the item is equipped</span>
          </p>
        </div>
        
        <FormField
          id="item-level"
          label="Item Level"
          type="number"
          value={localItem.data.dwItemLV as string || '0'}
          onChange={(value) => handleDataChange('dwItemLV', value)}
          disabled={!editMode}
          helperText="Level requirement to use this item"
        />
        
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="form-field">
            <label className="form-label">Shop-able</label>
            <div className="mt-2">
              <ModernToggle
                value={localItem.data.dwShopAble === "1"}
                onChange={(value) => handleDataChange('dwShopAble', value ? "1" : "0")}
                falseLabel="No"
                trueLabel="Yes"
                disabled={!editMode}
              />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Info size={14} />
              <span>Whether the item can be sold in shops</span>
            </p>
          </div>

          <div className="form-field">
            <label className="form-label">Can Trade</label>
            <div className="mt-2">
              <ModernToggle
                value={localItem.data.bCanTrade === "1"}
                onChange={(value) => handleDataChange('bCanTrade', value ? "1" : "0")}
                falseLabel="No"
                trueLabel="Yes"
                disabled={!editMode}
              />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Info size={14} />
              <span>Whether the item can be traded between players</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesSection;
