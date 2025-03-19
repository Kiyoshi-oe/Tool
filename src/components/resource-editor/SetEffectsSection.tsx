
import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";

interface SetEffectsSectionProps {
  item: ResourceItem;
}

const SetEffectsSection = ({ item }: SetEffectsSectionProps) => {
  if (!item.setEffects || item.setEffects.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Set Effect</h2>
      <div className="grid grid-cols-1 gap-2">
        {item.setEffects.map((setEffect, idx) => (
          <div key={`set-${idx}`} className="form-field">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="form-label">ID</label>
                <Input
                  type="text"
                  className="form-input"
                  value={setEffect.id}
                  readOnly
                />
              </div>
              <div>
                <label className="form-label">Name</label>
                <Input
                  type="text"
                  className="form-input"
                  value={setEffect.name}
                  readOnly
                />
              </div>
            </div>
            
            {setEffect.effects.map((effect, effectIdx) => (
              <div key={`set-effect-${effectIdx}`} className="flex items-center space-x-2 mb-2">
                <div className="flex-grow">
                  <div className="relative">
                    <select
                      className="form-input appearance-none pr-10"
                      value={effect.type}
                      disabled
                    >
                      <option value={effect.type}>{effect.type}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="w-24">
                  <Input
                    type="text"
                    className="form-input"
                    value={effect.value}
                    readOnly
                  />
                </div>
                <div className="w-28 text-xs text-gray-400">
                  Active as of {Math.min(effectIdx + 1, setEffect.requiredPieces)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetEffectsSection;
