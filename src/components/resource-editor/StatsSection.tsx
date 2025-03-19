
import { ResourceItem, EffectData } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { effectTypes } from "../../utils/resourceEditorUtils";

interface StatsSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleEffectChange: (index: number, field: 'type' | 'value', value: string | number) => void;
}

const StatsSection = ({ localItem, editMode, handleEffectChange }: StatsSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Support for up to 6 dwDestParam/nAdjParamVal pairs as per the spec_item.txt file format */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`effect-${index}`} className="form-field flex items-center space-x-2">
            <div className="flex-grow">
              <label className="form-label">Effect {index + 1}</label>
              <div className="relative">
                <select
                  className="form-input appearance-none pr-10"
                  value={localItem.effects[index]?.type || '-'}
                  onChange={(e) => handleEffectChange(index, 'type', e.target.value)}
                  disabled={!editMode}
                >
                  <option value="-">-</option>
                  {effectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="w-24">
              <label className="form-label">&nbsp;</label>
              <Input
                type="text"
                className="form-input"
                disabled={!editMode || !localItem.effects[index]?.type || localItem.effects[index]?.type === '-'}
                value={localItem.effects[index]?.value || ''}
                onChange={(e) => handleEffectChange(index, 'value', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSection;
