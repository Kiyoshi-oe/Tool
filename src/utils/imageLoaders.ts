import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { Texture } from 'three';
import { toast } from "sonner";

// Detailed logging function for image loading operations
export const logImageOperation = (action: string, details: Record<string, any>) => {
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
// Anmerkung: Für eine verbesserte DDS-Unterstützung verwenden Sie
// die spezialisierten Funktionen im ddsLoader.ts Modul
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

// Convert DDS Texture to Canvas
export function ddsTextureToCanvas(texture: Texture): HTMLCanvasElement {
  logImageOperation('CONVERTING_DDS_TO_CANVAS', {
    width: texture.image.width,
    height: texture.image.height,
    format: texture.image.format || 'unknown',
    hasData: !!texture.image.data,
    dataType: texture.image.data ? texture.image.data.constructor.name : 'unknown'
  });
  
  const width = texture.image.width || 64; // Fallback to 64 if width not available
  const height = texture.image.height || 64; // Fallback to 64 if height not available
  
  // Create canvas with texture dimensions
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }
  
  // Create image data to hold RGBA values
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  // Get the texture data (depends on format)
  const textureData = texture.image.data;
  
  if (!textureData) {
    console.error('No texture data found in DDS texture', texture);
    // Create a placeholder pattern to indicate failed conversion
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.fillRect(0, 0, width, height);
    
    // Draw an X to indicate error
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    
    // Add error text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DDS ERROR', width/2, height/2);
    
    return canvas;
  }
  
  try {
    // Check if it's likely a 16-bit texture (B5G5R5A1 format common in FlyFF)
    if (textureData.BYTES_PER_ELEMENT === 2) {
      // Try to process it as a B5G5R5A1 format
      return convertB5G5R5A1Format(textureData as Uint16Array, width, height);
    }
    
    // For other formats (likely RGBA)
    // Map the texture data to canvas data (RGBA to RGBA)
    for (let i = 0; i < width * height * 4; i += 4) {
      data[i] = textureData[i];     // R
      data[i + 1] = textureData[i + 1]; // G
      data[i + 2] = textureData[i + 2]; // B
      data[i + 3] = textureData[i + 3]; // A
    }
    
    // Put the image data on canvas
    ctx.putImageData(imageData, 0, 0);
    
    logImageOperation('DDS_CONVERTED_TO_CANVAS_SUCCESS', {
      width, 
      height,
      format: texture.image.format || 'unknown'
    });
    
    return canvas;
  } catch (error) {
    console.error('Error during DDS texture conversion:', error);
    
    // Create a placeholder on error
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CONVERSION ERROR', width/2, height/2);
    
    return canvas;
  }
}

// Specialized conversion for B5G5R5A1_UNORM format
// This is a common format used in FlyFF DDS files
export function convertB5G5R5A1Format(
  data: Uint16Array, 
  width: number, 
  height: number
): HTMLCanvasElement {
  logImageOperation('CONVERTING_B5G5R5A1_FORMAT', { 
    width, 
    height, 
    dataLength: data.length,
    bytesPerElement: data.BYTES_PER_ELEMENT,
    expectedLength: width * height
  });
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }
  
  // Create an image data object
  const imageData = ctx.createImageData(width, height);
  const rgba = imageData.data;
  
  // Verify data length matches expected dimensions
  const expectedLength = width * height;
  if (data.length < expectedLength) {
    console.warn(`Data length mismatch: got ${data.length}, expected ${expectedLength}. Using available data.`);
  }
  
  try {
    // Process each pixel
    const pixelCount = Math.min(data.length, width * height);
    
    // Try using A1R5G5B5 format first (more common in FlyFF)
    let useFormat = 'A1R5G5B5'; // Starting format
    
    // Try to detect format from first few pixels
    // If we see mostly magenta/pink pixels, we'll try the alternate format
    let testCanvas = document.createElement('canvas');
    testCanvas.width = Math.min(width, 32);
    testCanvas.height = Math.min(height, 32);
    let testCtx = testCanvas.getContext('2d');
    
    if (testCtx) {
      let testImageData = testCtx.createImageData(testCanvas.width, testCanvas.height);
      let testRgba = testImageData.data;
      
      // Process a small sample of pixels to test format
      const testPixelCount = Math.min(data.length, testCanvas.width * testCanvas.height);
      
      // Try A1R5G5B5 format first (most common)
      for (let i = 0; i < testPixelCount; i++) {
        const pixelValue = data[i];
        const rgbaIndex = i * 4;
        
        // A1R5G5B5 format
        const alpha = ((pixelValue & 0x8000) >> 15) * 255; // Bit 15
        const red = ((pixelValue & 0x7C00) >> 10) * 8;     // Bits 10-14
        const green = ((pixelValue & 0x03E0) >> 5) * 8;    // Bits 5-9
        const blue = (pixelValue & 0x001F) * 8;            // Bits 0-4
        
        testRgba[rgbaIndex] = red;
        testRgba[rgbaIndex + 1] = green;
        testRgba[rgbaIndex + 2] = blue;
        testRgba[rgbaIndex + 3] = alpha;
      }
      
      testCtx.putImageData(testImageData, 0, 0);
      
      // Analyze colors - if we see too many magenta pixels, it might be the wrong format
      let testCanvasImageData = testCtx.getImageData(0, 0, testCanvas.width, testCanvas.height);
      let testCanvasPixels = testCanvasImageData.data;
      let magentaCount = 0;
      
      for (let i = 0; i < testCanvasPixels.length; i += 4) {
        // Check for magenta/pink colors (high red, low green, high blue)
        if (testCanvasPixels[i] > 180 && testCanvasPixels[i+1] < 100 && testCanvasPixels[i+2] > 180) {
          magentaCount++;
        }
      }
      
      // If more than 50% of pixels are magenta, try the alternate format
      if (magentaCount > (testPixelCount / 2)) {
        useFormat = 'A1B5G5R5';
        console.log('Detected likely A1B5G5R5 format based on color analysis');
      } else {
        console.log('Using standard A1R5G5B5 format');
      }
    }
    
    // Now process the full image with the detected format
    for (let i = 0; i < pixelCount; i++) {
      const pixelValue = data[i];
      const rgbaIndex = i * 4;
      
      let red, green, blue, alpha;
      
      if (useFormat === 'A1R5G5B5') {
        // A1R5G5B5 format
        alpha = ((pixelValue & 0x8000) >> 15) * 255; // Bit 15
        red = ((pixelValue & 0x7C00) >> 10) * 8;     // Bits 10-14
        green = ((pixelValue & 0x03E0) >> 5) * 8;    // Bits 5-9
        blue = (pixelValue & 0x001F) * 8;            // Bits 0-4
      } else {
        // A1B5G5R5 format
        alpha = ((pixelValue & 0x8000) >> 15) * 255; // Bit 15
        blue = ((pixelValue & 0x7C00) >> 10) * 8;    // Bits 10-14
        green = ((pixelValue & 0x03E0) >> 5) * 8;    // Bits 5-9
        red = (pixelValue & 0x001F) * 8;             // Bits 0-4
      }
      
      // For debugging the first few pixels
      if (i < 5) {
        console.log(`Pixel ${i} [${useFormat}]: 0x${pixelValue.toString(16).padStart(4, '0')} → R:${red},G:${green},B:${blue},A:${alpha}`);
      }
      
      // Set RGBA values
      rgba[rgbaIndex] = red;
      rgba[rgbaIndex + 1] = green;
      rgba[rgbaIndex + 2] = blue;
      rgba[rgbaIndex + 3] = alpha;
    }
    
    // If we didn't have enough data to fill the image, log a warning
    if (data.length < expectedLength) {
      console.warn(`Only filled ${data.length} pixels out of ${expectedLength} expected pixels.`);
    }
    
    // Put the image data on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Log success
    logImageOperation('B5G5R5A1_CONVERSION_COMPLETE', { 
      width, 
      height, 
      pixelsProcessed: pixelCount,
      formatUsed: useFormat
    });
    
    return canvas;
  } catch (error) {
    console.error('Error processing B5G5R5A1 format:', error);
    
    // Draw error indicator
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('B5G5R5A1 ERROR', width/2, height/2);
    
    return canvas;
  }
}

// Create a test pattern to verify canvas rendering
export function createTestPattern(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }
  
  // Create a checkerboard pattern
  const squareSize = 8;
  
  // Fill background
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, width, height);
  
  // Draw grid
  for (let y = 0; y < height; y += squareSize) {
    for (let x = 0; x < width; x += squareSize) {
      if ((x / squareSize + y / squareSize) % 2 === 0) {
        ctx.fillStyle = '#666666';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  }
  
  // Draw RGB test bars
  const barHeight = height / 4;
  
  // Red bar
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, width, barHeight);
  
  // Green bar
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(0, barHeight, width, barHeight);
  
  // Blue bar
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(0, barHeight * 2, width, barHeight);
  
  // Half-transparent bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(0, barHeight * 3, width, barHeight);
  
  // Draw cross pattern for alignment testing
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, height);
  ctx.moveTo(width, 0);
  ctx.lineTo(0, height);
  ctx.stroke();
  
  return canvas;
}
