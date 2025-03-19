
import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { itemKind1Options, itemKind2Options, itemKind3Options, jobOptions } from "../../utils/resourceEditorUtils";
import { FormField } from "../ui/form-field";
import { Textarea } from "../ui/textarea";
import { getItemIdFromDefine } from "../../utils/file/defineItemParser";
import { getModelFileNameFromDefine } from "../../utils/file/mdlDynaParser";
import { getFileExtension, isSupportedImageFormat, getIconPath, loadImage } from "../../utils/imageLoaders";
import { useEffect, useState } from "react";
import { Texture } from "three";
import { AlertTriangle, ImageIcon } from "lucide-react";
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
        <div className="form-field">
          <label className="form-label">Item ID</label>
          <Input
            type="text"
            className="form-input text-[#707070]"
            value={itemId}
            disabled={true}
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            {itemId ? `ID from defineItem.h` : 'No ID found in defineItem.h'}
          </p>
        </div>
        
        <div className="form-field">
          <label className="form-label">Define</label>
          <Input
            type="text"
            className="form-input text-[#707070]"
            value={itemDefine}
            onChange={(e) => handleDataChange('dwID', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">InGame Name</label>
          <Input
            type="text"
            className="form-input text-[#707070]"
            value={displayName}
            onChange={(e) => handleDataChange('displayName', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field col-span-2">
          <label className="form-label">Description</label>
          <Textarea
            className="form-input h-20 resize-y text-[#707070]"
            value={description}
            onChange={(e) => handleDataChange('description', e.target.value)}
            disabled={!editMode}
            placeholder="Item description"
          />
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
        </div>
        
        <div className="form-field">
          <label className="form-label">File Name</label>
          <Input
            type="text"
            className="form-input text-[#707070]"
            value={modelFileName}
            disabled={true}
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            {modelFileName ? `Filename from mdlDyna.inc` : 'No filename found in mdlDyna.inc'}
          </p>
        </div>
        
        <div className="form-field">
          <label className="form-label">Stack Size</label>
          <Input
            type="number"
            className="form-input text-[#707070]"
            value={localItem.data.dwPackMax as string || '1'}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value <= 9999) {
                handleDataChange('dwPackMax', e.target.value);
              }
            }}
            disabled={!editMode}
            max={9999}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum stack size: 9999
          </p>
        </div>
        
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
          </div>
        </div>
        
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
        
        <div className="form-field">
          <label className="form-label">Gold Value</label>
          <Input
            type="number"
            className="form-input text-[#707070]"
            value={localItem.data.dwCost as string || '0'}
            onChange={(e) => handleDataChange('dwCost', e.target.value)}
            disabled={!editMode}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Required Level</label>
          <Input
            type="number"
            className="form-input text-[#707070]"
            value={localItem.data.dwLimitLevel1 as string || '0'}
            onChange={(e) => handleDataChange('dwLimitLevel1', e.target.value)}
            disabled={!editMode}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralSection;
