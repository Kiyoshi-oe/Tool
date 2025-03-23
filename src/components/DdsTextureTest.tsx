import { useEffect, useState } from 'react';
import { Texture } from 'three';
import { 
  loadImage, 
  ddsTextureToCanvas,
  createTestPattern,
  convertB5G5R5A1Format,
  getIconPath
} from '../utils/imageLoaders';

const DdsTextureTest = () => {
  // Available test files
  const ddsFiles = [
    "itm_WeaAxeCurin.dds",
    "itm_WeaAxeSteel.dds"
  ];
  
  const [selectedFile, setSelectedFile] = useState(ddsFiles[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ddsTexture, setDdsTexture] = useState<Texture | null>(null);
  const [ddsCanvas, setDdsCanvas] = useState<HTMLCanvasElement | null>(null);
  const [pixelData, setPixelData] = useState<string[]>([]);
  const [alternateCanvases, setAlternateCanvases] = useState<HTMLCanvasElement[]>([]);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [testPattern, setTestPattern] = useState<HTMLCanvasElement | null>(null);

  // Create test pattern on component mount
  useEffect(() => {
    // Generate test pattern to verify canvas rendering works
    const pattern = createTestPattern(64, 64);
    setTestPattern(pattern);
  }, []);
  
  // Load texture when selected file changes
  useEffect(() => {
    loadDdsTexture(selectedFile);
  }, [selectedFile]);
  
  const loadDdsTexture = async (filename: string) => {
    setLoading(true);
    setError(null);
    setDdsCanvas(null);
    setAlternateCanvases([]);
    setPixelData([]);
    
    try {
      // Get full path with icon utilities
      const ddsPath = getIconPath(filename);
      console.log('Loading DDS texture:', ddsPath);
      
      const result = await loadImage(ddsPath);
      
      if (!result) {
        throw new Error('Failed to load DDS texture');
      }
      
      if (result instanceof Texture) {
        setDdsTexture(result);
        console.log('DDS texture loaded successfully:', result);
        
        // Extract debug info
        const textureData = result.image?.data;
        const info = {
          width: result.image.width,
          height: result.image.height,
          format: result.image.format,
          bytesPerElement: textureData?.BYTES_PER_ELEMENT || 0,
          dataType: textureData?.constructor?.name || 'unknown',
          dataLength: textureData?.length || 0
        };
        setDebugInfo(info);
        
        // Extract and display sample pixel data for analysis
        if (textureData && textureData.BYTES_PER_ELEMENT === 2) {
          const sampleSize = Math.min(10, textureData.length);
          const pixels = [];
          
          for (let i = 0; i < sampleSize; i++) {
            const pixel = textureData[i];
            const hexValue = `0x${pixel.toString(16).padStart(4, '0')}`;
            
            // Try different bit interpretations to see what works
            // Format 1: A1R5G5B5 (alpha bit 15, red bits 10-14, green bits 5-9, blue bits 0-4)
            const alpha1 = ((pixel & 0x8000) >> 15) * 255;
            const red1 = ((pixel & 0x7C00) >> 10) * 8; 
            const green1 = ((pixel & 0x03E0) >> 5) * 8;
            const blue1 = (pixel & 0x001F) * 8;
            
            // Format 2: A1B5G5R5 (alpha bit 15, blue bits 10-14, green bits 5-9, red bits 0-4)
            const blue2 = ((pixel & 0x7C00) >> 10) * 8;
            const red2 = (pixel & 0x001F) * 8;
            
            pixels.push(`Pixel ${i}: ${hexValue} → A:${alpha1} | Format1: R:${red1},G:${green1},B:${blue1} | Format2: R:${red2},G:${green1},B:${blue2}`);
          }
          
          setPixelData(pixels);
          
          // Create multiple conversion interpretations for comparison
          try {
            const fallbackWidth = 64;
            const fallbackHeight = 64;
            
            // Try our specialized converter with those dimensions
            const directCanvas = convertB5G5R5A1Format(
              textureData as Uint16Array, 
              fallbackWidth, 
              fallbackHeight
            );
            
            // Set as our primary canvas
            setDdsCanvas(directCanvas);
            
            // Also save it to alternate canvases
            const canvases = [directCanvas];
            setAlternateCanvases(canvases);
            
          } catch (conversionError) {
            console.error('Error creating conversion variants:', conversionError);
          }
        } else {
          // Standard conversion
          try {
            const canvas = ddsTextureToCanvas(result);
            setDdsCanvas(canvas);
            console.log('Converted DDS texture to canvas:', canvas.width, 'x', canvas.height);
          } catch (conversionError) {
            console.error('Failed to convert DDS texture to canvas:', conversionError);
            setError(`Conversion error: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
          }
        }
      } else if (result instanceof HTMLCanvasElement) {
        // Direct canvas result
        console.log('Received pre-converted canvas:', result.width, 'x', result.height);
        setDdsCanvas(result);
      } else {
        throw new Error('Unexpected result type from loadImage');
      }
    } catch (err) {
      console.error('Error loading DDS texture:', err);
      setError(`Loading error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-cyrus-blue">DDS Texture Test (B5G5R5A1_UNORM Format)</h1>
      
      {/* File selection */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Test File:</label>
            <select 
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
            >
              {ddsFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => loadDdsTexture(selectedFile)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Reload'}
          </button>
          
          <div className="text-sm text-gray-400 ml-auto">
            <strong>Format:</strong> B5G5R5A1_UNORM (16-bit)
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-600 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Pattern (Reference)</h2>
          
          <div className="bg-gray-900 p-4 rounded flex items-center justify-center">
            {testPattern && (
              <img 
                src={testPattern.toDataURL()}
                alt="Test Pattern"
                className="max-w-full max-h-64 object-contain border border-gray-700"
              />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">This pattern verifies canvas rendering works correctly</p>
        </div>
        
        <div className="border border-gray-600 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Original DDS Texture</h2>
          
          {loading && (
            <div className="flex items-center justify-center h-48 bg-gray-900 rounded">
              <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-transparent"></div>
            </div>
          )}
          
          {!loading && error && (
            <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded">
              <p>Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && ddsTexture && (
            <div className="bg-gray-900 p-4 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-green-400 mb-2">
                  DDS Texture Loaded (Raw)
                </div>
                <div className="text-sm text-gray-400">
                  {ddsTexture.image.width} x {ddsTexture.image.height}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border border-gray-600 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">DDS Converted Output</h2>
          
          {loading && (
            <div className="flex items-center justify-center h-48 bg-gray-900 rounded">
              <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-transparent"></div>
            </div>
          )}
          
          {!loading && error && !ddsCanvas && (
            <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded">
              <p>Failed to convert DDS to canvas</p>
            </div>
          )}
          
          {!loading && ddsCanvas && (
            <div className="bg-gray-900 p-4 rounded flex items-center justify-center">
              <img 
                src={ddsCanvas.toDataURL()}
                alt="Converted DDS Texture"
                className="max-w-full max-h-64 object-contain border border-gray-700"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Pixel Data Analysis */}
      {pixelData.length > 0 && (
        <div className="mb-6 border border-gray-600 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Raw Pixel Data</h2>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            {pixelData.map((pixel, index) => (
              <pre key={index} className="text-sm font-mono text-green-400 mb-1">{pixel}</pre>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Sample of raw pixel values showing different bit interpretations</p>
        </div>
      )}
      
      {/* Multiple conversion attempts */}
      {alternateCanvases.length > 0 && (
        <div className="mb-6 border border-gray-600 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Alternative Conversion Methods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {alternateCanvases.map((canvas, index) => (
              <div key={index} className="bg-gray-900 p-2 rounded">
                <div className="flex items-center justify-center">
                  <img 
                    src={canvas.toDataURL()}
                    alt={`Method ${index + 1}`}
                    className="max-w-full border border-gray-700" 
                  />
                </div>
                <p className="text-xs text-center text-gray-400 mt-1">Method {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Debug Information */}
      <div className="border border-gray-600 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <pre className="bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
        
        <div className="mt-4 text-sm text-gray-400 space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-1">B5G5R5A1_UNORM Format Details:</h3>
            <p>16-bit pixel format with 5 bits each for blue, green, red, and 1 bit for alpha</p>
            <p>This format was commonly used in older games and DirectX applications.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-1">Bit Layout Possibilities:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-gray-700 px-1 rounded">ABBBBBGG GGGRRRRR</code> - Microsoft DirectX style (A1B5G5R5)</li>
              <li><code className="bg-gray-700 px-1 rounded">ARRRRRGG GGGBBBBB</code> - Alternative interpretation (A1R5G5B5)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-1">Bit Position Details:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bit 15: Alpha (0 = transparent, 1 = opaque)</li>
              <li>Bits 10-14: Red or Blue component (5 bits, values 0-31)</li>
              <li>Bits 5-9: Green component (5 bits, values 0-31)</li>
              <li>Bits 0-4: Blue or Red component (5 bits, values 0-31)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DdsTextureTest;