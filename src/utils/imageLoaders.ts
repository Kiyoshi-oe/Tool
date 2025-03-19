
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { Texture } from 'three';
import { toast } from "sonner";

// Detailed logging function for image loading operations
const logImageOperation = (action: string, details: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] IMAGE_LOADER - ${action}:`, details);
};

// Get file extension from filename
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  // Remove any triple quotes or regular quotes that might be in the path
  const cleanFilename = filename.replace(/^"+|"+$/g, '');
  return cleanFilename.slice((cleanFilename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

// Check if a file format is supported
export function isSupportedImageFormat(filename: string): boolean {
  if (!filename) return false;
  const ext = getFileExtension(filename);
  return ['png', 'jpg', 'jpeg', 'dds', 'gif', 'bmp', 'webp'].includes(ext);
}

// Load native browser-supported image formats
export async function loadGenericImage(url: string): Promise<HTMLImageElement> {
  logImageOperation('LOADING_GENERIC_IMAGE', { url });
  
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      logImageOperation('GENERIC_IMAGE_LOADED', { 
        url, 
        width: image.width, 
        height: image.height 
      });
      resolve(image);
    };
    
    image.onerror = (error) => {
      const errorDetails = {
        url,
        error: error instanceof Event ? 'Error event triggered' : String(error)
      };
      logImageOperation('GENERIC_IMAGE_LOAD_ERROR', errorDetails);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    // Set crossOrigin to anonymous to avoid CORS issues when loading images
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

// DDS Loader using three.js
export async function loadDDSImage(url: string): Promise<Texture> {
  logImageOperation('LOADING_DDS_IMAGE', { url });
  
  return new Promise<Texture>((resolve, reject) => {
    const loader = new DDSLoader();
    
    loader.load(
      url,
      (texture: Texture) => {
        logImageOperation('DDS_IMAGE_LOADED', {
          url,
          width: texture.image.width,
          height: texture.image.height
        });
        resolve(texture);
      },
      (progress) => {
        // Optional progress callback
        if (progress.lengthComputable) {
          const percentComplete = (progress.loaded / progress.total) * 100;
          logImageOperation('DDS_LOADING_PROGRESS', {
            url,
            progress: Math.round(percentComplete)
          });
        }
      },
      (error) => {
        const errorDetails = { url, error: String(error) };
        logImageOperation('DDS_IMAGE_LOAD_ERROR', errorDetails);
        reject(new Error(`Failed to load DDS image: ${url}`));
      }
    );
  });
}

// Main image loading function
export async function loadImage(url: string): Promise<HTMLImageElement | Texture | null> {
  const ext = getFileExtension(url);
  logImageOperation('LOADING_IMAGE', { url, extension: ext });
  
  try {
    if (ext === 'dds') {
      return await loadDDSImage(url);
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
      return await loadGenericImage(url);
    } else {
      const error = `Unsupported image format: ${ext}`;
      logImageOperation('UNSUPPORTED_FORMAT', { url, extension: ext });
      toast.error(error);
      return null;
    }
  } catch (error) {
    logImageOperation('IMAGE_LOAD_FAILED', { 
      url, 
      extension: ext,
      error: error instanceof Error ? error.message : String(error)
    });
    toast.error(`Error loading image: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Function to get the full path for the icon based on filename
export function getIconPath(iconName: string): string {
  if (!iconName) return '';
  
  // Remove any triple quotes or regular quotes that might be in the path
  const cleanIconName = iconName.replace(/^"+|"+$/g, '');
  
  // Check if the path already has a leading slash or contains http/https
  if (cleanIconName.startsWith('/') || cleanIconName.startsWith('http')) {
    return cleanIconName;
  }
  
  // Use absolute path starting with / to ensure it looks in the public folder
  const iconPath = `/resource/Item/${cleanIconName}`;
  logImageOperation('RESOLVED_ICON_PATH', { 
    original: iconName, 
    cleaned: cleanIconName, 
    resolved: iconPath 
  });
  return iconPath;
}
