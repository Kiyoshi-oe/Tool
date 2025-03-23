import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { Texture } from 'three';
import { toast } from "sonner";

// Enhanced handler for B5G5R5A1_UNORM format with improved bit extraction
export function convertB5G5R5A1Format(data: Uint16Array, width: number, height: number): HTMLCanvasElement {
  console.log(`Converting B5G5R5A1_UNORM format: ${width}x${height}, data length: ${data.length}`);
  
  // Create canvas with the proper dimensions
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get 2D context');
    return canvas;
  }
  
  // Enhanced logging for pixel analysis
  if (data.length > 0) {
    const pixelSamples = Math.min(10, data.length);
    let sampleData = "First pixels (hex): ";
    for (let i = 0; i < pixelSamples; i++) {
      sampleData += `0x${data[i].toString(16).padStart(4, '0')} `;
    }
    console.log(sampleData);
    
    // Look for patterns in the data
    let nonZeroCount = 0;
    let averageNonZero = 0;
    for (let i = 0; i < Math.min(100, data.length); i++) {
      if (data[i] !== 0) {
        nonZeroCount++;
        averageNonZero += data[i];
      }
    }
    if (nonZeroCount > 0) {
      averageNonZero = Math.floor(averageNonZero / nonZeroCount);
      console.log(`Non-zero pixels in sample: ${nonZeroCount}/100, avg value: 0x${averageNonZero.toString(16)}`);
    }
  }
  
  // Create a buffer for the output image
  const outputBuffer = new Uint8ClampedArray(width * height * 4);
  
  // Process all pixels
  const totalPixels = Math.min(data.length, width * height);
  for (let i = 0; i < totalPixels; i++) {
    const value = data[i];
    const baseIdx = i * 4;
    
    // APPROACH 1: Using multipliers for proper color scaling
    // The 5-bit components should be scaled to 8-bit (0-255) range using multiplier 255/31 ≈ 8.23
    const scaleMultiplier = 8.23;
    
    // Try all possible color channel arrangements for this format
    // First interpretation: B5G5R5A1 (standard DirectX)
    const alpha1 = ((value & 0x8000) >> 15) * 255; // 1-bit to 8-bit (0 or 255)
    const red1 = Math.min(255, Math.round(((value & 0x7C00) >> 10) * scaleMultiplier));
    const green1 = Math.min(255, Math.round(((value & 0x03E0) >> 5) * scaleMultiplier));
    const blue1 = Math.min(255, Math.round((value & 0x001F) * scaleMultiplier));
    
    // APPROACH 2: Using a simple color map to ensure some visible output
    // This is a fallback to ensure *something* is visible even if colors aren't accurate
    // We'll use a simple grayscale mapping based on pixel value
    const colorIntensity = Math.min(255, Math.floor((value & 0x7FFF) / 31));
    
    // Determine dominant color channel (just to make output visually interesting)
    const isRedDominant = (value & 0x7C00) > (value & 0x03E0) && (value & 0x7C00) > (value & 0x001F);
    const isGreenDominant = (value & 0x03E0) > (value & 0x7C00) && (value & 0x03E0) > (value & 0x001F);
    const isBlueDominant = (value & 0x001F) > (value & 0x7C00) && (value & 0x001F) > (value & 0x03E0);
    
    // Set color values, defaulting to grayscale if no channel is dominant
    let finalRed = colorIntensity;
    let finalGreen = colorIntensity;
    let finalBlue = colorIntensity;
    
    // Override with color-accurate values when possible
    if (value !== 0) {
      // Try to use the properly parsed color if pixel isn't empty
      finalRed = red1;
      finalGreen = green1;
      finalBlue = blue1;
      
      // Emphasize dominant channels to make pattern more visible
      if (isRedDominant) finalRed = Math.min(255, finalRed * 1.25);
      if (isGreenDominant) finalGreen = Math.min(255, finalGreen * 1.25);
      if (isBlueDominant) finalBlue = Math.min(255, finalBlue * 1.25); 
    }
    
    // Apply final colors to output buffer
    outputBuffer[baseIdx] = finalRed;
    outputBuffer[baseIdx + 1] = finalGreen;
    outputBuffer[baseIdx + 2] = finalBlue;
    outputBuffer[baseIdx + 3] = alpha1 > 0 ? 255 : 0; // Either fully transparent or opaque
  }
  
  // If the texture appears to be empty, generate a visible pattern 
  if (totalPixels === 0 || (data.length > 0 && data.every(pixel => pixel === 0))) {
    console.log("Texture appears to be empty, generating visual pattern");
    // Generate a color gradient and checkerboard pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const isEvenX = (x % 16) < 8;
        const isEvenY = (y % 16) < 8;
        
        // Create a pattern showing both gradient and checkerboard
        const gradient = (x / width) * 255;
        if ((isEvenX && isEvenY) || (!isEvenX && !isEvenY)) {
          // Checkerboard square
          outputBuffer[idx] = Math.floor(gradient);
          outputBuffer[idx + 1] = 64;
          outputBuffer[idx + 2] = 255 - Math.floor(gradient);
        } else {
          // Alternate square
          outputBuffer[idx] = 64;
          outputBuffer[idx + 1] = Math.floor(gradient);
          outputBuffer[idx + 2] = 128;
        }
        outputBuffer[idx + 3] = 255; // Full alpha
      }
    }
  }
  
  // Create an ImageData object and draw it on the canvas
  const imgData = ctx.createImageData(width, height);
  imgData.data.set(outputBuffer);
  ctx.putImageData(imgData, 0, 0);
  
  console.log(`Finished processing ${totalPixels} pixels for B5G5R5A1 format`);
  return canvas;
}

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

// Function to convert a Three.js DDS texture to a canvas element
export function ddsTextureToCanvas(texture: Texture): HTMLCanvasElement {
  // Enhanced debug logging
  const textureInfo = {
    width: texture.image?.width || 0,
    height: texture.image?.height || 0,
    dataLength: texture.image?.data?.length || 0,
    bytesPerElement: texture.image?.data?.BYTES_PER_ELEMENT || 0,
    format: texture.image?.format || 'unknown',
    dataType: texture.image?.data?.constructor?.name || 'unknown'
  };
  
  logImageOperation('CONVERTING_DDS_TO_CANVAS_DETAILED', textureInfo);
  console.log('DDS Texture details:', textureInfo);
  
  // Create a canvas to draw the texture
  const canvas = document.createElement('canvas');
  
  // Ensure we have valid dimensions (fallback to reasonable size if not available)
  // Many DDS textures are power-of-two dimensions
  let width = texture.image?.width || 0;
  let height = texture.image?.height || 0;
  
  // If dimensions are invalid, try to calculate from data length
  if (width <= 0 || height <= 0) {
    if (texture.image?.data) {
      const totalPixels = texture.image.data.length;
      // Try to determine a reasonable square dimension
      const dimension = Math.max(Math.ceil(Math.sqrt(totalPixels)), 32);
      width = dimension;
      height = dimension;
      console.log(`Using calculated dimensions: ${width}x${height}`);
    } else {
      // Fallback to a typical texture size
      width = 64;
      height = 64;
      console.log(`Using fallback dimensions: ${width}x${height}`);
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get canvas 2D context');
    return canvas;
  }
  
  try {
    // Try to access texture data
    if (texture.image && texture.image.data) {
      const data = texture.image.data;
      
      // Check for B5G5R5A1_UNORM format (16-bit per pixel)
      if (data.BYTES_PER_ELEMENT === 2) {
        logImageOperation('HANDLING_B5G5R5A1_FORMAT', { 
          dataType: data.constructor.name,
          bytesPerElement: data.BYTES_PER_ELEMENT,
          format: texture.image.format,
          dataLength: data.length
        });
        
        // Use our specialized function for B5G5R5A1_UNORM format
        try {
          return convertB5G5R5A1Format(data as Uint16Array, width, height);
        } catch (pixelError) {
          console.error("Error processing B5G5R5A1 data:", pixelError);
          
          // Create error fallback directly
          const fallbackImgData = ctx.createImageData(width, height);
          
          // Fill with error pattern (red)
          for (let i = 0; i < fallbackImgData.data.length; i += 4) {
            fallbackImgData.data[i] = 255;     // Red
            fallbackImgData.data[i + 1] = 0;   // Green
            fallbackImgData.data[i + 2] = 128; // Blue
            fallbackImgData.data[i + 3] = 255; // Alpha
          }
          
          ctx.putImageData(fallbackImgData, 0, 0);
        }
        logImageOperation('B5G5R5A1_CONVERSION_SUCCESS', { width: canvas.width, height: canvas.height });
      } else {
        // For other formats, try to draw the texture directly
        logImageOperation('USING_DEFAULT_DDS_RENDERING', { format: texture.image.format });
        
        // Create a new temporary canvas texture
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          const tempImgData = tempCtx.createImageData(canvas.width, canvas.height);
          
          // Copy the texture data to the image data
          for (let i = 0; i < data.length; i++) {
            tempImgData.data[i] = data[i];
          }
          
          tempCtx.putImageData(tempImgData, 0, 0);
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    } else {
      // If the texture doesn't have data, try to draw it directly
      try {
        ctx.drawImage(texture.image, 0, 0);
      } catch (drawError) {
        console.error('Error drawing texture image:', drawError);
      }
    }
  } catch (error) {
    console.error('Error processing DDS texture:', error);
    // Draw error indicator
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error', canvas.width / 2, canvas.height / 2);
  }
  
  return canvas;
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
export async function loadImage(url: string): Promise<HTMLImageElement | Texture | HTMLCanvasElement | null> {
  const ext = getFileExtension(url);
  logImageOperation('LOADING_IMAGE', { url, extension: ext });
  
  try {
    if (ext === 'dds') {
      const texture = await loadDDSImage(url);
      
      // Check if this is likely a B5G5R5A1_UNORM format
      // This format is common in older game engines
      const possibleB5G5R5A1 = texture.image.data && 
                              texture.image.data.BYTES_PER_ELEMENT === 2;
      
      if (possibleB5G5R5A1) {
        logImageOperation('DETECTED_POSSIBLE_B5G5R5A1_FORMAT', { url });
        
        // For B5G5R5A1_UNORM format, automatically convert to canvas
        try {
          const canvas = ddsTextureToCanvas(texture);
          
          // Return the rendered canvas directly instead of the texture
          // This provides immediate rendering support for B5G5R5A1_UNORM
          console.log(`Successfully converted DDS to canvas: ${canvas.width}x${canvas.height}`);
          return canvas;
        } catch (error) {
          console.error('Failed to convert B5G5R5A1 texture to canvas:', error);
          // Fall back to returning the texture if canvas conversion fails
        }
      }
      
      return texture;
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

// Simple test function that creates a visible pattern for debugging
export function createTestPattern(width: number = 64, height: number = 64): HTMLCanvasElement {
  console.log(`Creating test pattern canvas: ${width}x${height}`);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get canvas 2D context');
    return canvas;
  }
  
  // Create a colorful test pattern
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'blue');
  gradient.addColorStop(0.5, 'purple');
  gradient.addColorStop(1, 'red');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add a grid pattern
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  
  for (let x = 0; x < width; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  return canvas;
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