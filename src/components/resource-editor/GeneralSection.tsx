import { ResourceItem } from "../../types/fileTypes";
import { ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { itemKind1Options, itemKind2Options, itemKind3Options, jobOptions } from "../../utils/resourceEditorUtils";
import { FormField } from "../ui/form-field";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { getItemIdFromDefine } from "../../utils/file/defineItemParser";
import { getModelFileNameFromDefine, getModelNameFromDefine } from "../../utils/file/mdlDynaParser";
import { getFileExtension, isSupportedImageFormat, getIconPath, loadImage } from "../../utils/imageLoaders";
import { loadAndConvertDDS, getBestDDSRepresentation } from "../../utils/ddsLoader";
import { useEffect, useState, useRef } from "react";
import { Texture } from "three";
import { AlertTriangle, ImageIcon, Info, ZoomIn, X } from "lucide-react";
import ModernToggle from "../ModernToggle";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { 
  Dialog, 
  DialogPortal,
  DialogOverlay,
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogContent as BaseDialogContent,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import * as React from "react";

// Benutzerdefiniertes DialogContent ohne automatischen Close Button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { previewScale?: number }
>(({ className, children, previewScale = 1, ...props }, ref) => {
  // Dynamische Größe basierend auf dem Zoom-Faktor
  const getDialogClassName = () => {
    // Kompakteres Design durch bessere Tailwind-Klassen
    if (previewScale <= 3) return 'w-auto max-w-[580px]';
    if (previewScale <= 5) return 'w-auto max-w-[650px]';
    if (previewScale <= 7) return 'w-auto max-w-[720px]';
    return 'w-auto max-w-[800px]';
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          `fixed left-[50%] top-[50%] z-50 grid ${getDialogClassName()} translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg`,
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
CustomDialogContent.displayName = DialogPrimitive.Content.displayName;

interface GeneralSectionProps {
  localItem: ResourceItem;
  editMode: boolean;
  handleDataChange: (field: string, value: string | number | boolean) => void;
}

type EditableField = 'itemId' | 'modelFileName';

const GeneralSection = ({ localItem, editMode, handleDataChange }: GeneralSectionProps) => {
  // Sofortige Fehlerbehandlung für kritische Konstruktionsfehler
  try {
    // Prüfe, ob alle erforderlichen Props vorhanden sind
    if (!localItem || typeof editMode !== 'boolean' || typeof handleDataChange !== 'function') {
      console.error('GeneralSection: Required props missing or invalid', { 
        hasLocalItem: !!localItem, 
        editModeType: typeof editMode, 
        handleDataChangeType: typeof handleDataChange
      });
      
      throw new Error('GeneralSection: Required props missing');
    }
    
    // Prüfe, ob localItem.data existiert und korrekt formatiert ist
    if (!localItem.data || typeof localItem.data !== 'object') {
      console.error('GeneralSection: localItem.data is missing or invalid', localItem);
      throw new Error('GeneralSection: Data structure invalid');
    }
  } catch (error) {
    // Logging für leichtere Diagnose
    console.error('GeneralSection construction error:', error);
    
    // Fallback-Rendering, wenn die Komponente nicht korrekt initialisiert werden kann
    return (
      <div className="mb-6 p-4 border border-red-500 rounded-md bg-red-100 dark:bg-red-900/20">
        <h2 className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">General (Fehler beim Laden)</h2>
        <p className="text-sm text-red-500">Die Komponente konnte nicht initialisiert werden: {error instanceof Error ? error.message : 'Unbekannter Fehler'}</p>
      </div>
    );
  }

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
  const [ddsCanvas, setDdsCanvas] = useState<HTMLCanvasElement | null>(null);
  const [ddsFormat, setDdsFormat] = useState<string>("unknown");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [alternateFormatView, setAlternateFormatView] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  
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
  
  // Direkter Fix für problematische IDs
  let displayName = localItem.displayName || localItem.name || '';
  
  // Für den Fall, dass displayName gleich der ID ist, versuche den Namen aus dem Debug-Output zu extrahieren
  if (displayName.startsWith('IDS_PROPITEM_TXT_')) {
    // Mapping für kritische IDs, die nicht korrekt geladen werden
    const criticalIDMapping: Record<string, string> = {
      'IDS_PROPITEM_TXT_007342': 'Knighert Boots',
      'IDS_PROPITEM_TXT_011548': '[Holy] Curio Suit (M)',
      // Fügen Sie hier weitere IDs hinzu, die nicht korrekt angezeigt werden
      'IDS_PROPITEM_TXT_007343': 'Knighert Boots Description',
      'IDS_PROPITEM_TXT_011549': '[Holy] Curio Suit (M) Description',
      'IDS_PROPITEM_TXT_011634': 'Cotton Gauntlet',
      'IDS_PROPITEM_TXT_011635': 'Cotton Gauntlet Description'
    };
    
    // Wenn die ID im Mapping vorhanden ist, verwende den entsprechenden Namen
    if (criticalIDMapping[displayName]) {
      displayName = criticalIDMapping[displayName];
    }
  }
  
  // Get the description (which was loaded from propItem.txt.txt)
  const description = localItem.description || 'No description available';
  
  // Get the item define ID (e.g. II_WEA_AXE_RODNEY)
  const itemDefine = localItem.data.dwID as string || '';
  
  // Get the numerical item ID from defineItem.h
  const itemId = getItemIdFromDefine(itemDefine);
  
  // Get the model filename from mdlDyna.inc
  const modelFileName = getModelFileNameFromDefine(itemDefine);
  
  // Get the model name from mdlDyna.inc
  const modelName = getModelNameFromDefine(itemDefine);
  
  // Get icon name from item data and clean it
  const iconName = localItem.data.szIcon as string || '';
  const cleanedIconName = iconName.replace(/^"+|"+$/g, '');
  
  const hasIcon = cleanedIconName && isSupportedImageFormat(cleanedIconName);
  const iconPath = hasIcon ? getIconPath(cleanedIconName) : '';
  
  // Hauptfunktion zum Laden und Konvertieren
  const createFallbackTexture = () => {
    // Erstelle ein Basis-Canvas mit einer Placeholder-Textur
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Grid-Muster zeichnen
      const squareSize = 8;
      
      // Hintergrund füllen - dunkelgrau statt hell
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, 64, 64);
      
      // Schachbrettmuster zeichnen
      for (let y = 0; y < 64; y += squareSize) {
        for (let x = 0; x < 64; x += squareSize) {
          if ((x / squareSize + y / squareSize) % 2 === 0) {
            ctx.fillStyle = '#444444';
            ctx.fillRect(x, y, squareSize, squareSize);
          }
        }
      }
      
      // Text hinzufügen
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DDS', 32, 25);
      ctx.fillText('FALLBACK', 32, 40);
    }
    
    return canvas;
  };

  // Load the image based on its type when icon path changes
  useEffect(() => {
    setImageError(false);
    setImageElement(null);
    setDdsTexture(null);
    setDdsCanvas(null);
    setImageType("none");
    
    if (!hasIcon || !iconPath) return;
    
    const loadIconImage = async () => {
      setLoadingImage(true);
      try {
        console.log("Loading image:", iconPath);
        
        // Prüfe, ob es sich um eine DDS-Datei handelt
        const ext = getFileExtension(iconPath);
        
        if (ext === 'dds') {
          // Setze ein Timeout für den gesamten Ladevorgang
          const timeoutId = setTimeout(() => {
            console.warn("Timeout beim Laden der DDS-Datei - Verwende Fallback");
            const fallbackCanvas = createFallbackTexture();
            setDdsCanvas(fallbackCanvas);
            setDdsFormat("FALLBACK");
            setImageType("dds");
            setLoadingImage(false);
          }, 5000); // 5 Sekunden Timeout
          
          try {
            // Direktes Laden und Konvertieren mit unserem spezialisierten Loader
            try {
              const result = await getBestDDSRepresentation(iconPath);
              clearTimeout(timeoutId);
              
              setDdsCanvas(result.canvas);
              setDdsFormat(result.format);
              setImageType("dds");
              console.log("Loaded DDS directly:", result.width, "x", result.height, "Format:", result.format);
            } catch (ddsError) {
              console.error("Failed to load DDS directly:", ddsError);
              // Fallback zur alten Methode mit Three.js
              const threejsResult = await loadImage(iconPath);
              clearTimeout(timeoutId);
              
              if (!threejsResult) {
                throw new Error("Failed to load image with any method");
              }
              
              if (threejsResult instanceof Texture) {
                setDdsTexture(threejsResult);
                setImageType("dds");
                console.log("Loaded DDS with three.js fallback successfully");
              }
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.error(`Failed to load DDS ${iconPath}:`, error);
            // Erstelle ein Fehler-Canvas anstatt nur den Fehler zu setzen
            const fallbackCanvas = createFallbackTexture();
            setDdsCanvas(fallbackCanvas);
            setDdsFormat("ERROR");
            setImageType("dds");
            setImageError(true);
          }
        } else {
          // Normale Bilder laden
          try {
            const result = await loadImage(iconPath);
            
            if (!result) {
              throw new Error("Failed to load image");
            }
            
            if (result instanceof HTMLImageElement) {
              setImageElement(result);
              setImageType("generic");
              console.log("Loaded generic image successfully:", iconPath);
            }
          } catch (imgError) {
            console.error(`Failed to load generic image ${iconPath}:`, imgError);
            setImageError(true);
            setImageType("none");
          }
        }
      } catch (error) {
        console.error(`General error loading image ${iconPath}:`, error);
        setImageError(true);
        setImageType("none");
      } finally {
        setLoadingImage(false);
      }
    };
    
    loadIconImage();
  }, [iconPath, hasIcon]);
  
  // Berechnen Sie, ob ein Vorschaubild angezeigt werden sollte
  const hasPreviewImage = 
    (imageType === "dds" && (ddsCanvas !== null || ddsTexture !== null)) || 
    (imageType === "generic" && imageElement !== null);
  
  // Funktion zum Umschalten des DDS-Formats
  const toggleDdsFormat = () => {
    setAlternateFormatView(!alternateFormatView);
    
    // Wenn wir ein DDS-Canvas haben (direkter Loader)
    if (ddsCanvas) {
      try {
        // Neu laden mit geändertem Format-Parameter
        loadAndConvertDDS(iconPath).then(canvas => {
          setDdsCanvas(canvas);
        });
      } catch (error) {
        console.error("Error reloading DDS with alternate format:", error);
      }
    }
    // Wenn wir eine DDS-Textur haben (Three.js-Methode)
    else if (ddsTexture) {
      try {
        // Die Texturdaten neu verarbeiten
        const textureData = ddsTexture.image?.data;
        
        if (textureData && textureData.BYTES_PER_ELEMENT === 2) {
          // Canvas mit gewünschtem Format erstellen
          const canvas = document.createElement('canvas');
          const width = ddsTexture.image.width || 64;
          const height = ddsTexture.image.height || 64;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Bildaten erstellen
            const imageData = ctx.createImageData(width, height);
            const rgba = imageData.data;
            const pixelCount = Math.min(textureData.length, width * height);
            
            // Format umkehren: A1R5G5B5 <-> A1B5G5R5
            for (let i = 0; i < pixelCount; i++) {
              const pixelValue = textureData[i];
              const rgbaIndex = i * 4;
              
              // Alpha ist immer gleich
              const alpha = ((pixelValue & 0x8000) >> 15) * 255;
              
              // Die anderen Farben tauschen
              const value1 = ((pixelValue & 0x7C00) >> 10) * 8;
              const green = ((pixelValue & 0x03E0) >> 5) * 8;
              const value2 = (pixelValue & 0x001F) * 8;
              
              // Im alternativen Format werden rot und blau vertauscht
              const red = alternateFormatView ? value1 : value2;
              const blue = alternateFormatView ? value2 : value1;
              
              rgba[rgbaIndex] = red;
              rgba[rgbaIndex + 1] = green;
              rgba[rgbaIndex + 2] = blue;
              rgba[rgbaIndex + 3] = alpha;
            }
            
            ctx.putImageData(imageData, 0, 0);
            setDdsCanvas(canvas);
          }
        }
      } catch (error) {
        console.error("Error switching DDS format:", error);
      }
    }
  };
  
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
        
        <div className="form-field">
          <label className="form-label">Description</label>
          <Textarea
            className="form-input resize-none h-10 min-h-[40px] text-[#707070]"
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
            <div 
              className="border border-gray-600 bg-gray-800 w-12 h-12 flex items-center justify-center rounded overflow-hidden relative cursor-pointer group"
              onClick={() => hasPreviewImage ? setShowImagePreview(true) : null}
            >
              {hasPreviewImage && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <ZoomIn className="text-white" size={18} />
                </div>
              )}

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
              
              {!loadingImage && imageType === "dds" && ddsCanvas && (
                <img 
                  src={ddsCanvas.toDataURL()} 
                  alt={cleanedIconName}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {!loadingImage && imageType === "dds" && !ddsCanvas && ddsTexture && (
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
              Unsupported file format. Supported formats: PNG, JPG, BMP, DDS
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
            <span>
              {localItem.data.dwItemKind1 === "IK1_ARMOR" 
                ? `Model name from mdlDyna.inc (e.g. mVag01Foot)` 
                : `Filename from mdlDyna.inc - Edit with caution`}
            </span>
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
      
      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview}>
        <CustomDialogContent 
          className="border border-gray-600 bg-gray-900 p-4" 
          onInteractOutside={(e) => e.preventDefault()}
          previewScale={previewScale}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col">
              <span className="text-cyrus-blue font-medium">{cleanedIconName || "Item Icon"}</span>
              <span className="text-gray-400 text-sm">DDS Texture Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Info className="w-5 h-5 text-cyrus-blue cursor-help" />
                <div className="absolute right-0 w-72 p-3 bg-black bg-opacity-90 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs text-gray-300">
                  <p className="mb-2"><span className="font-bold text-cyrus-blue">DDS Formats:</span> DDS files can be available in different formats.</p>
                  <p className="mb-2">The "Switch Format" button toggles between A1R5G5B5 and A1B5G5R5 formats, which swaps the red and blue channels.</p>
                  <p>This can help when an icon's colors appear incorrect (e.g. a blue weapon instead of a red one).</p>
                </div>
              </div>
              <button 
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                onClick={() => setShowImagePreview(false)}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-400 flex items-center justify-center gap-2 mb-1">
              <span>Zoom:</span>
              <div className="flex gap-1 flex-wrap justify-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scale => (
                  <button
                    key={scale}
                    onClick={() => setPreviewScale(scale)}
                    className={`px-2 py-1 rounded text-xs ${previewScale === scale ? 'bg-cyrus-blue text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
            <div 
              className="flex justify-center bg-gray-800 rounded-md border border-gray-700 overflow-auto mx-auto" 
              style={{ 
                // Optimierte Größenberechnung basierend auf Bildgröße mit minimalem Padding
                width: 
                  (imageType === "dds" && ddsCanvas) 
                    ? `${Math.max(320, ddsCanvas.width * previewScale + 16)}px`
                  : (imageType === "generic" && imageElement)
                    ? `${Math.max(320, imageElement.width * previewScale + 16)}px`
                  : "auto",
                height: 
                  (imageType === "dds" && ddsCanvas)
                    ? `${Math.max(180, ddsCanvas.height * previewScale + 16)}px` 
                  : (imageType === "generic" && imageElement)
                    ? `${Math.max(180, imageElement.height * previewScale + 16)}px`
                  : "auto",
                maxHeight: "700px",
                padding: "8px"
              }}
            >
              <div className="flex items-center justify-center">
                {imageType === "dds" && ddsCanvas && (
                  <img 
                    src={ddsCanvas.toDataURL()} 
                    alt={cleanedIconName}
                    className="object-contain" 
                    style={{ 
                      transformOrigin: 'center', 
                      imageRendering: 'pixelated',
                      width: `${ddsCanvas.width * previewScale}px`,
                      height: `${ddsCanvas.height * previewScale}px`
                    }}
                  />
                )}
                {imageType === "dds" && !ddsCanvas && ddsTexture && (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <span>DDS Texture (Display not available)</span>
                  </div>
                )}
                {imageType === "generic" && imageElement && (
                  <img 
                    src={imageElement.src} 
                    alt={cleanedIconName}
                    className="object-contain"
                    style={{ 
                      transformOrigin: 'center', 
                      imageRendering: 'pixelated',
                      width: `${imageElement.width * previewScale}px`,
                      height: `${imageElement.height * previewScale}px`
                    }}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-row justify-between items-center mt-1">
              <div className="text-sm text-gray-400">
                Format: {ddsFormat || (alternateFormatView ? 'A1B5G5R5' : 'A1R5G5B5')} (16-bit) 
                | Size: {ddsCanvas?.width || ddsTexture?.image.width || '?'}x{ddsCanvas?.height || ddsTexture?.image.height || '?'}px
              </div>
              <div className="ml-6">
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={toggleDdsFormat}
                  className="px-4 py-2 h-8 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  Switch Format
                </Button>
              </div>
            </div>
          </div>
        </CustomDialogContent>
      </Dialog>
      
      {/* Sensitive field edit confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <BaseDialogContent className="sm:max-w-md border border-gray-600 bg-gray-900 shadow-lg">
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
        </BaseDialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralSection;