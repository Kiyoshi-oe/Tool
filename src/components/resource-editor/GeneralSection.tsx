
import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { itemKind1Options, itemKind2Options, itemKind3Options, jobOptions } from "../../utils/resourceEditorUtils";
import { FormField } from "../ui/form-field";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { getItemIdFromDefine } from "../../utils/file/defineItemParser";
import { getModelFileNameFromDefine } from "../../utils/file/mdlDynaParser";
import { getFileExtension, isSupportedImageFormat, getIconPath, loadImage } from "../../utils/imageLoaders";
import { useEffect, useState } from "react";
import { Texture } from "three";
import { AlertTriangle, ImageIcon, Info } from "lucide-react";
import ModernToggle from "../ModernToggle";

interface GeneralSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

const GeneralSection = ({ localItem, editMode, handleDataChange }: GeneralSectionProps) => {
  const [imageError, setImageError] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageType, setImageType] = useState<"generic" | "dds" | "none">("none");
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [ddsTexture, setDdsTexture] = useState<Texture | null>(null);
  
  // The ID from propItem.txt.txt (e.g. IDS_PROPITEM_TXT_000124)
  const propItemId = localItem.data.szName as string || '';
  
  // Get the actual display name from the item 
  const displayName = localItem.displayName || propItemId;
  
  // Get the description (which was loaded from propItem.txt.txt)
  const description = localItem.description || 'No description available';
  
  // Get the item define ID (e.g. II_WEA_AXE_RODNEY)
  const itemDefine = localItem.data.dwID as string || '';
  
  // Get the numerical item ID from defineItem.h
  const itemId = getItemIdFromDefine(itemDefine);
  
  // Get the model filename from mdlDyna.inc
  const modelFileName = getModelFileNameFromDefine(itemDefine);
  
  // Get icon name from item data and clean it
  const iconName = localItem.data.szIcon as string || '';
  const cleanedIconName = iconName.replace(/^"+|"+$/g, '');
  
  const hasIcon = cleanedIconName && isSupportedImageFormat(cleanedIconName);
  const iconPath = hasIcon ? getIconPath(cleanedIconName) : '';
  
  // Load the image based on its type when icon path changes
  useEffect(() => {
    setImageError(false);
    setImageElement(null);
    setDdsTexture(null);
    setImageType("none");
    
    if (!hasIcon || !iconPath) return;
    
    const loadIconImage = async () => {
      setLoadingImage(true);
      try {
        console.log("Loading image:", iconPath);
        const result = await loadImage(iconPath);
        
        if (!result) {
          throw new Error("Failed to load image");
        }
        
        if (result instanceof HTMLImageElement) {
          setImageElement(result);
          setImageType("generic");
          console.log("Loaded generic image successfully:", iconPath);
        } else { // Texture from DDS
          setDdsTexture(result);
          setImageType("dds");
          console.log("Loaded DDS texture successfully:", iconPath);
        }
        setImageError(false);
      } catch (error) {
        console.error(`Failed to load image ${iconPath}:`, error);
        setImageError(true);
        setImageType("none");
      } finally {
        setLoadingImage(false);
      }
    };
    
    loadIconImage();
  }, [iconPath, hasIcon]);
  
  return (
    <div className="mb-6">
      <h2 className="text-cyrus-blue text-lg font-semibold mb-2">General</h2>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="item-id"
          label="Item ID"
          value={itemId}
          onChange={() => {}} // No onChange needed for read-only fields
          disabled={true}
          helperText={itemId ? `ID from defineItem.h` : 'No ID found in defineItem.h'}
        />
        
        <FormField
          id="define"
          label="Define"
          value={itemDefine}
          onChange={(value) => handleDataChange('dwID', value)}
          disabled={!editMode}
          helperText="Item definition identifier (e.g. II_WEA_AXE_RODNEY)"
        />
        
        <FormField
          id="ingame-name"
          label="InGame Name"
          value={displayName}
          onChange={(value) => handleDataChange('displayName', value)}
          disabled={!editMode}
          helperText="Name displayed in game"
        />
        
        <div className="form-field col-span-2">
          <label className="form-label">Description</label>
          <Textarea
            className="form-input h-20 resize-y text-[#707070]"
            value={description}
            onChange={(e) => handleDataChange('description', e.target.value)}
            disabled={!editMode}
            placeholder="Item description"
          />
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Detailed description of the item</span>
          </p>
        </div>
        
        <div className="form-field col-span-2">
          <label className="form-label">Item Icon</label>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              className="form-input flex-grow text-[#707070]"
              value={iconName}
              onChange={(e) => handleDataChange('szIcon', e.target.value)}
              disabled={!editMode}
              placeholder="e.g. itm_WeaAxeCurin.png"
            />
            <div className="border border-gray-600 bg-gray-800 w-12 h-12 flex items-center justify-center rounded overflow-hidden relative">
              {loadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 z-10">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 rounded-full border-t-transparent"></div>
                </div>
              )}
              
              {!loadingImage && imageType === "generic" && imageElement && (
                <img 
                  src={imageElement.src} 
                  alt={cleanedIconName}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {!loadingImage && imageType === "dds" && ddsTexture && (
                <div className="flex flex-col items-center justify-center text-xs text-green-400">
                  <ImageIcon size={16} />
                  <span>DDS</span>
                </div>
              )}
              
              {!loadingImage && imageError && (
                <div className="flex flex-col items-center justify-center text-xs text-red-400">
                  <AlertTriangle size={16} />
                  <span>Error</span>
                </div>
              )}
              
              {!loadingImage && imageType === "none" && !imageError && !hasIcon && (
                <span className="text-xs text-gray-500">No icon</span>
              )}
            </div>
          </div>
          {iconName && !isSupportedImageFormat(iconName) && (
            <p className="text-xs text-yellow-500 mt-1">
              Unsupported file format. Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP, DDS
            </p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Icon image displayed in game inventory</span>
          </p>
        </div>
        
        <FormField
          id="file-name"
          label="File Name"
          value={modelFileName}
          onChange={() => {}} // No onChange needed for read-only fields
          disabled={true}
          helperText={modelFileName ? `Filename from mdlDyna.inc` : 'No filename found in mdlDyna.inc'}
        />
        
        <FormField
          id="stack-size"
          label="Stack Size"
          type="number"
          value={localItem.data.dwPackMax as string || '1'}
          onChange={(value) => {
            const numValue = parseInt(value);
            if (numValue <= 9999) {
              handleDataChange('dwPackMax', value);
            }
          }}
          disabled={!editMode}
          max={9999}
          helperText="Maximum stack size: 9999"
        />
        
        <div className="form-field">
          <label className="form-label">Item Kind 1</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 text-[#707070]"
              value={localItem.data.dwItemKind1 as string || ''}
              onChange={(e) => handleDataChange('dwItemKind1', e.target.value)}
              disabled={!editMode}
            >
              {itemKind1Options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Primary item category (e.g. Weapon, Armor)</span>
          </p>
        </div>
        
        <div className="form-field">
          <label className="form-label">Item Kind 2</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 text-[#707070]"
              value={localItem.data.dwItemKind2 as string || ''}
              onChange={(e) => handleDataChange('dwItemKind2', e.target.value)}
              disabled={!editMode}
            >
              {itemKind2Options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Secondary item category</span>
          </p>
        </div>
        
        <div className="form-field">
          <label className="form-label">Item Kind 3</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 text-[#707070]"
              value={localItem.data.dwItemKind3 as string || ''}
              onChange={(e) => handleDataChange('dwItemKind3', e.target.value)}
              disabled={!editMode}
            >
              {itemKind3Options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Job / Class</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 text-[#707070]"
              value={localItem.data.dwItemJob as string || ''}
              onChange={(e) => handleDataChange('dwItemJob', e.target.value)}
              disabled={!editMode}
            >
              {jobOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Item Job Class</span>
          </p>
          </div>
        </div>

        <FormField
          id="gold-value"
          label="Gold Value"
          type="number"
          value={localItem.data.dwCost as string || '0'}
          onChange={(value) => handleDataChange('dwCost', value)}
          disabled={!editMode}
          helperText="In-game Shop Price"
        />
        
        <FormField
          id="required-level"
          label="Required Level"
          type="number"
          value={localItem.data.dwLimitLevel1 as string || '0'}
          onChange={(value) => handleDataChange('dwLimitLevel1', value)}
          disabled={!editMode}
          helperText="Minimum character level required to use this item"
        />
        <div className="form-field">
        <label className="form-label">Tradable</label>
        <div className="mt-2">
            <ModernToggle
              value={localItem.data.bPermanence === "1"}
              onChange={(value) => handleDataChange('bPermanence', value ? "1" : "0")}
              falseLabel="No"
              trueLabel="Yes"
              disabled={!editMode}
            />
          </div>
        </div>
      </div>
    </div>

  );
};

export default GeneralSection;
