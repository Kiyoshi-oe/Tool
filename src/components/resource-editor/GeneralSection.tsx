import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { itemKind1Options, itemKind2Options, itemKind3Options, jobOptions, itemGradeOptions } from "../../utils/resourceEditorUtils";
import { FormField } from "../ui/form-field";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { getItemIdFromDefine } from "../../utils/file/defineItemParser";
import { getModelFileNameFromDefine } from "../../utils/file/mdlDynaParser";
import { getFileExtension, isSupportedImageFormat, getIconPath, loadImage } from "../../utils/imageLoaders";
import { useEffect, useState, useRef } from "react";
import { Texture } from "three";
import { AlertTriangle, ImageIcon, Info } from "lucide-react";
import ModernToggle from "../ModernToggle";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";

interface GeneralSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

type EditableField = 'itemId' | 'modelFileName';

const GeneralSection = ({ localItem, editMode, handleDataChange }: GeneralSectionProps) => {
  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fieldBeingEdited, setFieldBeingEdited] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState('');
  const itemIdRef = useRef<HTMLInputElement>(null);
  const fileNameRef = useRef<HTMLInputElement>(null);
  
  // Track which fields have been approved for editing
  const [approvedFields, setApprovedFields] = useState<Set<EditableField>>(new Set());
  
  // Reset approved fields when edit mode changes
  useEffect(() => {
    setApprovedFields(new Set());
  }, [editMode]);

  const [imageError, setImageError] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageType, setImageType] = useState<"generic" | "dds" | "none">("none");
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [ddsTexture, setDdsTexture] = useState<Texture | null>(null);
  
  // Handle when a sensitive field is focused
  const handleSensitiveFieldFocus = (field: EditableField, currentValue: string) => {
    if (editMode) {
      // Only show the dialog if the field hasn't been approved yet
      if (!approvedFields.has(field)) {
        setFieldBeingEdited(field);
        setTempValue(currentValue);
        setShowConfirmDialog(true);
      }
    }
  };
  
  // Handle when user confirms the edit
  const handleConfirmEdit = () => {
    setShowConfirmDialog(false);
    
    // Add the field to approved fields to prevent the dialog from appearing again
    if (fieldBeingEdited) {
      setApprovedFields(prev => {
        const newSet = new Set(prev);
        newSet.add(fieldBeingEdited);
        return newSet;
      });
    }
    
    // Keep focus on the field for editing
    setTimeout(() => {
      if (fieldBeingEdited === 'itemId' && itemIdRef.current) {
        itemIdRef.current.focus();
      } else if (fieldBeingEdited === 'modelFileName' && fileNameRef.current) {
        fileNameRef.current.focus();
      }
    }, 100);
  };
  
  // Handle when user cancels the edit
  const handleCancelEdit = () => {
    setShowConfirmDialog(false);
    
    // Blur the current field to prevent editing
    if (fieldBeingEdited === 'itemId' && itemIdRef.current) {
      itemIdRef.current.blur();
    } else if (fieldBeingEdited === 'modelFileName' && fileNameRef.current) {
      fileNameRef.current.blur();
    }
    
    setFieldBeingEdited(null);
  };
  
  // Get dialog title and description based on field being edited
  const getDialogContent = () => {
    switch(fieldBeingEdited) {
      case 'itemId':
        return {
          title: 'Warning: Editing Item ID',
          description: 'Changing the item ID may lead to compatibility issues. Do you really want to modify this field?'
        };
      case 'modelFileName':
        return {
          title: 'Warning: Editing File Name',
          description: 'Changing the file name may lead to rendering issues. Do you really want to modify this field?'
        };
      default:
        return {
          title: 'Warning',
          description: 'This field contains important system data. Do you really want to modify it?'
        };
    }
  };
  
  // Dialog content based on current field
  const dialogContent = getDialogContent();
  
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
        {/* Item ID field with onFocus handler */}
        <div className="form-field">
          <label htmlFor="item-id" className="form-label">Item ID</label>
          <Input
            ref={itemIdRef}
            id="item-id"
            type="text"
            value={itemId}
            onChange={(e) => handleDataChange('itemId', e.target.value)}
            disabled={!editMode}
            className="form-input text-[#707070]"
            onFocus={() => handleSensitiveFieldFocus('itemId', itemId)}
          />
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span>{itemId ? `ID from defineItem.h - Edit with caution` : 'No ID found in defineItem.h'}</span>
          </p>
        </div>
        
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
            value={cleanedIconName}
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
        
        {/* File Name field with onFocus handler */}
        <div className="form-field">
          <label htmlFor="file-name" className="form-label">File Name</label>
          <Input
            ref={fileNameRef}
            id="file-name"
            type="text"
            value={modelFileName}
            onChange={(e) => handleDataChange('modelFileName', e.target.value)}
            disabled={!editMode}
            className="form-input text-[#707070]"
            onFocus={() => handleSensitiveFieldFocus('modelFileName', modelFileName)}
          />
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span>{modelFileName ? `Filename from mdlDyna.inc - Edit with caution` : 'No filename found in mdlDyna.inc'}</span>
          </p>
        </div>
        
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
          id="required-level"
          label="Required Level"
          type="number"
          value={localItem.data.dwLimitLevel1 as string || '0'}
          onChange={(value) => handleDataChange('dwLimitLevel1', value)}
          disabled={!editMode}
          helperText="Minimum character level required to use this item"
        />
        
        <div className="form-field">
          <label className="form-label">Item Rarity</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 text-[#707070]"
              value={localItem.data.dwItemGrade as string || 'ITEM_GRADE_NORMAL'}
              onChange={(e) => handleDataChange('dwItemGrade', e.target.value)}
              disabled={!editMode}
            >
              {itemGradeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Info size={14} />
            <span>Rarity level of the item</span>
          </p>
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
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md border border-gray-600 bg-gray-900 shadow-lg">
          <DialogHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="rounded-full bg-yellow-500 bg-opacity-20 p-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <DialogTitle className="text-cyrus-blue text-lg font-semibold">{dialogContent.title}</DialogTitle>
              <DialogDescription className="text-gray-300 mt-1">
                {dialogContent.description}
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="my-2 border-t border-gray-700"></div>
          <div className="flex justify-center">
            <DialogFooter className="flex justify-center gap-4 mt-4 space-x-4">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                className="border-red-800 bg-red-900 text-white hover:bg-red-800 hover:border-red-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmEdit} 
                className="bg-cyrus-blue hover:bg-blue-700 text-white"
              >
                I understand, edit
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralSection;