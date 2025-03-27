import { logImageOperation } from './imageLoaders';

// DDS-Header-Konstanten
const DDPF_ALPHAPIXELS = 0x1;
const DDPF_ALPHA = 0x2;
const DDPF_FOURCC = 0x4;
const DDPF_RGB = 0x40;
const DDPF_RGBA = DDPF_RGB | DDPF_ALPHAPIXELS;
const DDSD_MIPMAPCOUNT = 0x20000;
const DDS_MAGIC = 0x20534444;
const DDSD_CAPS = 0x1;
const DDSD_HEIGHT = 0x2;
const DDSD_WIDTH = 0x4;
const DDSD_PITCH = 0x8;
const DDSD_PIXELFORMAT = 0x1000;
const DDSCAPS_COMPLEX = 0x8;
const DDSCAPS_MIPMAP = 0x400000;
const DDSCAPS_TEXTURE = 0x1000;

// Standard-DDS-Pixelformate
const D3DFMT_DXT1 = 0x31545844; // 'DXT1' in ASCII
const D3DFMT_DXT3 = 0x33545844; // 'DXT3' in ASCII
const D3DFMT_DXT5 = 0x35545844; // 'DXT5' in ASCII
const D3DFMT_A1R5G5B5 = 0x15; 
const D3DFMT_A4R4G4B4 = 0x16;
const D3DFMT_R5G6B5 = 0x17;
const D3DFMT_A8R8G8B8 = 0x21;
const D3DFMT_X8R8G8B8 = 0x22;

// DDS-Header-Struktur
interface DDSHeader {
  magic: number;          // 'DDS '
  size: number;           // 124
  flags: number;          // Pflichtflags
  height: number;         // Texturhöhe
  width: number;          // Texturbreite
  pitchOrLinearSize: number; // Byte-Größe der primären Oberfläche
  depth: number;          // Tiefe einer Volumstextur
  mipMapCount: number;    // Anzahl der Mipmaps
  reserved1: number[];    // Reserviert
  pixelFormat: {
    size: number;         // 32
    flags: number;        // Pixelformat-Flags
    fourCC: number;       // Für komprimierte Texturen
    rgbBitCount: number;  // Bits pro Pixel
    rBitMask: number;     // Rote Bitmaske
    gBitMask: number;     // Grüne Bitmaske
    bBitMask: number;     // Blaue Bitmaske
    aBitMask: number;     // Alpha-Bitmaske
  };
  caps: number;           // Textur-Flags
  caps2: number;          // Zusätzliche Flags für Kubuskarten
  caps3: number;          // Nicht verwendet
  caps4: number;          // Nicht verwendet
  reserved2: number;      // Reserviert
}

// Daten-Views für das Lesen des DDS-Formats
let dv: DataView;
let dataOffset: number;

// Die Textur-Daten
let textureData: Uint8Array | Uint16Array | Uint32Array;
let width: number;
let height: number;
let format: string;

// Lese den DDS-Header und interpretiere die Daten
function parseDDSHeader(arrayBuffer: ArrayBuffer): DDSHeader | null {
  if (arrayBuffer.byteLength < 128) {
    console.error('DDS file too small to contain valid header');
    return null;
  }

  dv = new DataView(arrayBuffer);
  
  // Überprüfe das Magic-Wort 'DDS '
  const magic = dv.getUint32(0, true);
  if (magic !== DDS_MAGIC) {
    console.error('Invalid DDS file, wrong magic number');
    return null;
  }

  const header: DDSHeader = {
    magic,
    size: dv.getUint32(4, true),
    flags: dv.getUint32(8, true),
    height: dv.getUint32(12, true),
    width: dv.getUint32(16, true),
    pitchOrLinearSize: dv.getUint32(20, true),
    depth: dv.getUint32(24, true),
    mipMapCount: dv.getUint32(28, true),
    reserved1: Array(11).fill(0),
    pixelFormat: {
      size: dv.getUint32(76, true),
      flags: dv.getUint32(80, true),
      fourCC: dv.getUint32(84, true),
      rgbBitCount: dv.getUint32(88, true),
      rBitMask: dv.getUint32(92, true),
      gBitMask: dv.getUint32(96, true),
      bBitMask: dv.getUint32(100, true),
      aBitMask: dv.getUint32(104, true),
    },
    caps: dv.getUint32(108, true),
    caps2: dv.getUint32(112, true),
    caps3: dv.getUint32(116, true),
    caps4: dv.getUint32(120, true),
    reserved2: dv.getUint32(124, true),
  };

  return header;
}

// Identifiziere das Pixelformat basierend auf Header-Werten
function identifyPixelFormat(header: DDSHeader): string {
  const { pixelFormat } = header;
  
  // Komprimierte Textur (DXT)
  if (pixelFormat.flags & DDPF_FOURCC) {
    switch (pixelFormat.fourCC) {
      case D3DFMT_DXT1: return 'DXT1';
      case D3DFMT_DXT3: return 'DXT3';
      case D3DFMT_DXT5: return 'DXT5';
      default: return 'UNKNOWN_COMPRESSED';
    }
  }
  
  // Unkomprimierte RGB/RGBA-Textur
  if (pixelFormat.flags & DDPF_RGB) {
    const hasAlpha = Boolean(pixelFormat.flags & DDPF_ALPHAPIXELS);
    
    // Identifiziere gängige Formate anhand von Bitmasken
    if (pixelFormat.rgbBitCount === 16) {
      if (
        pixelFormat.rBitMask === 0x7C00 && 
        pixelFormat.gBitMask === 0x03E0 && 
        pixelFormat.bBitMask === 0x001F &&
        hasAlpha && pixelFormat.aBitMask === 0x8000
      ) {
        return 'A1R5G5B5';
      }
      
      if (
        pixelFormat.rBitMask === 0x001F && 
        pixelFormat.gBitMask === 0x03E0 && 
        pixelFormat.bBitMask === 0x7C00 &&
        hasAlpha && pixelFormat.aBitMask === 0x8000
      ) {
        return 'A1B5G5R5';
      }
      
      if (
        pixelFormat.rBitMask === 0xF00 && 
        pixelFormat.gBitMask === 0xF0 && 
        pixelFormat.bBitMask === 0xF &&
        hasAlpha && pixelFormat.aBitMask === 0xF000
      ) {
        return 'A4R4G4B4';
      }
      
      if (
        pixelFormat.rBitMask === 0xF800 && 
        pixelFormat.gBitMask === 0x07E0 && 
        pixelFormat.bBitMask === 0x001F &&
        !hasAlpha
      ) {
        return 'R5G6B5';
      }
      
      // FlyFF spezifische Formate basierend auf Erfahrungswerten
      if (pixelFormat.rgbBitCount === 16) {
        // Wenn Bitmasken nicht exakt übereinstimmen, verwenden wir die häufigsten Formate
        return 'A1R5G5B5'; // Standard FlyFF Format
      }
    }
    
    if (pixelFormat.rgbBitCount === 32) {
      if (
        pixelFormat.rBitMask === 0x00FF0000 && 
        pixelFormat.gBitMask === 0x0000FF00 && 
        pixelFormat.bBitMask === 0x000000FF &&
        hasAlpha && pixelFormat.aBitMask === 0xFF000000
      ) {
        return 'A8R8G8B8';
      }
      
      if (
        pixelFormat.rBitMask === 0x00FF0000 && 
        pixelFormat.gBitMask === 0x0000FF00 && 
        pixelFormat.bBitMask === 0x000000FF &&
        !hasAlpha
      ) {
        return 'X8R8G8B8';
      }
    }
    
    // Generisches Format
    return hasAlpha ? `RGBA${pixelFormat.rgbBitCount}` : `RGB${pixelFormat.rgbBitCount}`;
  }
  
  // Nur Alpha-Textur
  if (pixelFormat.flags & DDPF_ALPHA) {
    return `ALPHA${pixelFormat.rgbBitCount}`;
  }
  
  return 'UNKNOWN';
}

// Lade die Textur und interpretiere die Daten
export async function loadDDSFile(url: string): Promise<{
  width: number;
  height: number;
  format: string;
  data: Uint8Array | Uint16Array | Uint32Array | null;
}> {
  try {
    logImageOperation('LOADING_DDS_DIRECT', { url });
    
    // Fetch und Parse der DDS-Datei
    let response;
    try {
      response = await fetch(url, { 
        // Cache-Control hinzufügen, um Caching-Probleme zu vermeiden
        headers: { 'Cache-Control': 'no-cache' },
        // Timeout hinzufügen
        signal: AbortSignal.timeout(10000) // 10 Sekunden Timeout
      });
    } catch (fetchError) {
      console.error('Network error while fetching DDS:', fetchError);
      throw new Error(`Netzwerkfehler beim Laden der DDS-Datei: ${fetchError instanceof Error ? fetchError.message : 'Unbekannter Fehler'}`);
    }
    
    if (!response.ok) {
      throw new Error(`DDS-Datei konnte nicht geladen werden: ${response.status} ${response.statusText}`);
    }
    
    let arrayBuffer;
    try {
      arrayBuffer = await response.arrayBuffer();
    } catch (bufferError) {
      console.error('Error reading DDS data:', bufferError);
      throw new Error(`Fehler beim Lesen der DDS-Daten: ${bufferError instanceof Error ? bufferError.message : 'Unbekannter Fehler'}`);
    }
    
    const header = parseDDSHeader(arrayBuffer);
    
    if (!header) {
      throw new Error('DDS-Header konnte nicht interpretiert werden');
    }
    
    width = header.width;
    height = header.height;
    format = identifyPixelFormat(header);
    
    // Hole die Rohdaten der Textur
    dataOffset = 128; // Standard-DDS-Header ist 128 Bytes
    const dataSize = arrayBuffer.byteLength - dataOffset;
    
    if (dataSize <= 0) {
      throw new Error('Keine Texturdaten in der DDS-Datei');
    }
    
    // Erstelle das richtige TypedArray basierend auf dem Pixelformat
    if (format === 'A1R5G5B5' || format === 'A1B5G5R5' || format === 'R5G6B5' || format === 'A4R4G4B4') {
      textureData = new Uint16Array(arrayBuffer, dataOffset);
    } else if (format === 'A8R8G8B8' || format === 'X8R8G8B8') {
      textureData = new Uint32Array(arrayBuffer, dataOffset);
    } else {
      // Für andere Formate oder komprimierte Texturen
      textureData = new Uint8Array(arrayBuffer, dataOffset);
    }
    
    logImageOperation('DDS_LOADED_DIRECT', { 
      width, 
      height, 
      format,
      dataSize,
      bytesPerElement: textureData.BYTES_PER_ELEMENT || 1,
      dataLength: textureData.length
    });
    
    return {
      width,
      height,
      format,
      data: textureData
    };
  } catch (error) {
    console.error('Error loading DDS file:', error);
    logImageOperation('DDS_LOAD_ERROR', { 
      url, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return {
      width: 0,
      height: 0,
      format: 'ERROR',
      data: null
    };
  }
}

// Erstelle ein Canvas mit einer Fehlermeldung
export function createErrorCanvas(width: number, height: number, message: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }
  
  // Dunkelgrauer Hintergrund statt pinkem Hintergrund
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, width, height);
  
  // X-Symbol
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(width - 10, height - 10);
  ctx.moveTo(width - 10, 10);
  ctx.lineTo(10, height - 10);
  ctx.stroke();
  
  // Nachricht
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height / 2);
  
  return canvas;
}

// Konvertiere A1R5G5B5 16-bit Daten in ein Canvas (speziell für FlyFF)
export function convertA1R5G5B5ToCanvas(
  data: Uint16Array, 
  width: number,
  height: number,
  swapRedBlue: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }
  
  const imageData = ctx.createImageData(width, height);
  const rgba = imageData.data;
  
  const pixelCount = Math.min(data.length, width * height);
  
  // Magenta-Farbe, die wir als transparent behandeln wollen (FF00FF)
  const magentaR = 255;
  const magentaG = 0;
  const magentaB = 255;
  
  // Toleranzwert für die Magenta-Erkennung (erlaube kleine Abweichungen)
  const colorTolerance = 20;
  
  for (let i = 0; i < pixelCount; i++) {
    const pixelValue = data[i];
    const rgbaIndex = i * 4;
    
    // A1R5G5B5 Format
    let alpha = ((pixelValue & 0x8000) >> 15) * 255; // 1 bit alpha
    let red, green, blue;
    
    if (swapRedBlue) {
      // A1B5G5R5 Format
      blue = ((pixelValue & 0x7C00) >> 10) * 8;  // Bits 10-14, zu 0-255 skaliert
      green = ((pixelValue & 0x03E0) >> 5) * 8;  // Bits 5-9, zu 0-255 skaliert
      red = (pixelValue & 0x001F) * 8;          // Bits 0-4, zu 0-255 skaliert
    } else {
      // A1R5G5B5 Format
      red = ((pixelValue & 0x7C00) >> 10) * 8;   // Bits 10-14, zu 0-255 skaliert
      green = ((pixelValue & 0x03E0) >> 5) * 8;  // Bits 5-9, zu 0-255 skaliert
      blue = (pixelValue & 0x001F) * 8;          // Bits 0-4, zu 0-255 skaliert
    }
    
    // Prüfe, ob der Pixel im Magenta-Bereich liegt (FF00FF oder ähnlich)
    if (
      Math.abs(red - magentaR) <= colorTolerance && 
      green <= colorTolerance && 
      Math.abs(blue - magentaB) <= colorTolerance
    ) {
      alpha = 0; // Transparenz setzen
    }
    
    rgba[rgbaIndex] = red;
    rgba[rgbaIndex + 1] = green;
    rgba[rgbaIndex + 2] = blue;
    rgba[rgbaIndex + 3] = alpha;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Hauptfunktion zum Laden und Konvertieren
export async function loadAndConvertDDS(url: string): Promise<HTMLCanvasElement> {
  try {
    const result = await loadDDSFile(url);
    
    if (!result.data || result.width === 0 || result.height === 0) {
      return createErrorCanvas(64, 64, 'Failed to load DDS');
    }
    
    if (result.format === 'A1R5G5B5' || result.format === 'A1B5G5R5') {
      // Versuche mit beiden Formaten, falls eines nicht gut aussieht
      try {
        return convertA1R5G5B5ToCanvas(
          result.data as Uint16Array, 
          result.width, 
          result.height,
          result.format === 'A1B5G5R5'
        );
      } catch (error) {
        console.error('Error converting DDS to canvas:', error);
        return createErrorCanvas(result.width, result.height, 'Conversion Error');
      }
    }
    
    // Für andere Formate könnte man weitere Konvertierungen implementieren
    return createErrorCanvas(result.width, result.height, `Unsupported format: ${result.format}`);
  } catch (error) {
    console.error('Failed to load and convert DDS:', error);
    return createErrorCanvas(64, 64, 'DDS Processing Error');
  }
}

// Eine Funktion, die versucht, die beste Darstellung für ein DDS-Format zu finden
export async function getBestDDSRepresentation(url: string, retryCount = 0): Promise<{
  canvas: HTMLCanvasElement,
  format: string,
  width: number,
  height: number
}> {
  try {
    // Füge zufälligen Parameter für Cache-Busting hinzu
    const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    
    let ddsData;
    try {
      ddsData = await loadDDSFile(cacheBustUrl);
    } catch (loadError) {
      // Bei Netzwerkfehlern einen Retry versuchen
      if (retryCount < 2) {
        console.warn(`Retry ${retryCount + 1}/2 for DDS load: ${url}`);
        // Kurze Verzögerung vor dem Retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return getBestDDSRepresentation(url, retryCount + 1);
      }
      
      // Nach Retries - erstelle Fallback-Canvas
      console.error("Failed to load DDS after retries:", loadError);
      return createFallbackDDSRepresentation("LOAD_ERROR");
    }
    
    if (!ddsData.data || ddsData.width === 0 || ddsData.height === 0) {
      return createFallbackDDSRepresentation("NO_DATA");
    }
    
    // Erstelle Standardformat
    let canvas = createErrorCanvas(ddsData.width, ddsData.height, 'Unsupported Format');
    
    // Versuche beide Formate für 16-bit Texturen
    if (ddsData.format === 'A1R5G5B5' || ddsData.format === 'A1B5G5R5' || 
        ddsData.format.includes('RGB16') || ddsData.format === 'UNKNOWN') {
      
      // Versuche verschiedene Formate
      try {
        // Standard A1R5G5B5
        const canvas1 = convertA1R5G5B5ToCanvas(
          ddsData.data as Uint16Array, 
          ddsData.width, 
          ddsData.height,
          false
        );
        
        // Vertauschtes A1B5G5R5
        const canvas2 = convertA1R5G5B5ToCanvas(
          ddsData.data as Uint16Array, 
          ddsData.width, 
          ddsData.height,
          true
        );
        
        // Wähle das Format, das am wahrscheinlichsten richtig ist
        // Versuch zu erkennen, welches Canvas weniger Magenta-Pixel hat
        
        // Beide Canvas-Objekte analysieren
        const imgData1 = canvas1.getContext('2d')?.getImageData(0, 0, canvas1.width, canvas1.height).data;
        const imgData2 = canvas2.getContext('2d')?.getImageData(0, 0, canvas2.width, canvas2.height).data;
        
        if (imgData1 && imgData2) {
          // Zähle die nicht-transparenten Pixel in beiden Versionen
          let nonTransparentPixels1 = 0;
          let nonTransparentPixels2 = 0;
          
          for (let i = 3; i < imgData1.length; i += 4) {
            if (imgData1[i] > 0) nonTransparentPixels1++;
            if (imgData2[i] > 0) nonTransparentPixels2++;
          }
          
          // Wähle das Canvas mit mehr nicht-transparenten Pixeln
          // da dieses wahrscheinlich weniger Magenta-Pixel hat
          canvas = nonTransparentPixels1 >= nonTransparentPixels2 ? canvas1 : canvas2;
          ddsData.format = nonTransparentPixels1 >= nonTransparentPixels2 ? 'A1R5G5B5' : 'A1B5G5R5';
        } else {
          // Wenn die Analyse nicht funktioniert, verwende Standard A1R5G5B5
          canvas = canvas1;
          ddsData.format = 'A1R5G5B5';
        }
      } catch (error) {
        console.error('Error during format testing:', error);
      }
    }
    
    return {
      canvas,
      format: ddsData.format,
      width: ddsData.width,
      height: ddsData.height
    };
  } catch (error) {
    console.error('Error getting best DDS representation:', error);
    return createFallbackDDSRepresentation("PROCESSING_ERROR");
  }
}

// Hilfs-Funktion, um eine Fallback-Darstellung für fehlgeschlagene DDS-Texturen zu erstellen
function createFallbackDDSRepresentation(errorType: string): {
  canvas: HTMLCanvasElement,
  format: string,
  width: number,
  height: number
} {
  // Erstelle ein Fallback-Canvas
  const canvas = document.createElement('canvas');
  const width = 64;
  const height = 64;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Hintergrund füllen - verschiedene Farben je nach Fehlertyp aber keine pinken Farben
    switch (errorType) {
      case "LOAD_ERROR":
        ctx.fillStyle = '#553333'; // Rötlich für Ladefehler
        break;
      case "NO_DATA":
        ctx.fillStyle = '#335555'; // Grünlich/Bläulich für fehlende Daten
        break;
      case "PROCESSING_ERROR":
        ctx.fillStyle = '#555533'; // Gelblich für Verarbeitungsfehler
        break;
      default:
        ctx.fillStyle = '#333333'; // Dunkelgrau für unbekannte Fehler
    }
    ctx.fillRect(0, 0, width, height);
    
    // Grid-Muster für bessere Sichtbarkeit
    const squareSize = 8;
    for (let y = 0; y < height; y += squareSize) {
      for (let x = 0; x < width; x += squareSize) {
        if ((x / squareSize + y / squareSize) % 2 === 0) {
          // Dunklere Version der Hintergrundfarbe
          ctx.fillStyle = errorType === "LOAD_ERROR" ? '#442222' : 
                         errorType === "NO_DATA" ? '#224444' : 
                         errorType === "PROCESSING_ERROR" ? '#444422' : '#222222';
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }
    
    // DDS Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DDS', width / 2, height / 2 - 6);
    
    // Fehlertyp anzeigen
    ctx.font = '8px Arial';
    ctx.fillText(errorType, width / 2, height / 2 + 8);
  }
  
  return {
    canvas,
    format: "FALLBACK:" + errorType,
    width,
    height
  };
} 