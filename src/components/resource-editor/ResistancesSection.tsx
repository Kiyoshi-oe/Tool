
import { ResourceItem } from "../../types/fileTypes";
import { Input } from "../ui/input";

interface ResistancesSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

const ResistancesSection = ({ localItem, editMode, handleDataChange }: ResistancesSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Resistances</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">Fire Resistance</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.fItemResistFire as string || '0'}
            onChange={(e) => handleDataChange('fItemResistFire', e.target.value)}
            disabled={!editMode}
            step="0.1"
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Water Resistance</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.fItemResistWater as string || '0'}
            onChange={(e) => handleDataChange('fItemResistWater', e.target.value)}
            disabled={!editMode}
            step="0.1"
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Earth Resistance</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.fItemResistEarth as string || '0'}
            onChange={(e) => handleDataChange('fItemResistEarth', e.target.value)}
            disabled={!editMode}
            step="0.1"
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Wind Resistance</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.fItemResistWind as string || '0'}
            onChange={(e) => handleDataChange('fItemResistWind', e.target.value)}
            disabled={!editMode}
            step="0.1"
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Electricity Resistance</label>
          <Input
            type="number"
            className="form-input"
            value={localItem.data.fItemResistElecricity as string || '0'}
            onChange={(e) => handleDataChange('fItemResistElecricity', e.target.value)}
            disabled={!editMode}
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
};

export default ResistancesSection;
