
import { ResourceItem } from "../../types/fileTypes";
import { FormField } from "../ui/form-field";
import { useState, useEffect } from "react";

interface SoundEffectsSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

// Simple validation for sound file names
const validateSoundFile = (value: string): string | null => {
  if (!value) return null; // Empty is allowed
  
  // Sound files should generally end with .wav or .mp3
  if (!/\.(wav|mp3|ogg)$/i.test(value)) {
    return "Sound file should end with .wav, .mp3, or .ogg";
  }
  
  return null;
};

const SoundEffectsSection = ({ localItem, editMode, handleDataChange }: SoundEffectsSectionProps) => {
  const [errors, setErrors] = useState({
    sound1: "",
    sound2: "",
  });
  
  const [touched, setTouched] = useState({
    sound1: false,
    sound2: false,
  });
  
  // Sound attack 1 value
  const sound1Value = localItem.data.dwSndAttack1 as string || '';
  const sound2Value = localItem.data.dwSndAttack2 as string || '';
  
  // Validate whenever the values change
  useEffect(() => {
    if (touched.sound1) {
      setErrors(prev => ({
        ...prev,
        sound1: validateSoundFile(sound1Value) || "",
      }));
    }
    
    if (touched.sound2) {
      setErrors(prev => ({
        ...prev,
        sound2: validateSoundFile(sound2Value) || "",
      }));
    }
  }, [sound1Value, sound2Value, touched]);
  
  const handleChange = (field: string, value: string) => {
    handleDataChange(field, value);
    
    // Mark as touched when user makes a change
    if (field === 'dwSndAttack1') {
      setTouched(prev => ({ ...prev, sound1: true }));
    } else if (field === 'dwSndAttack2') {
      setTouched(prev => ({ ...prev, sound2: true }));
    }
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">Sound Effects</h2>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="sound-attack-1"
          label="Sound Attack 1"
          value={sound1Value}
          onChange={(value) => handleChange('dwSndAttack1', value)}
          disabled={!editMode}
          error={errors.sound1}
          helperText="WAV or MP3 file for the attack sound"
          isValid={touched.sound1 && !errors.sound1 && sound1Value !== ''}
        />
        
        <FormField
          id="sound-attack-2"
          label="Sound Attack 2"
          value={sound2Value}
          onChange={(value) => handleChange('dwSndAttack2', value)}
          disabled={!editMode}
          error={errors.sound2}
          helperText="WAV or MP3 file for the second attack sound"
          isValid={touched.sound2 && !errors.sound2 && sound2Value !== ''}
        />
      </div>
    </div>
  );
};

export default SoundEffectsSection;
