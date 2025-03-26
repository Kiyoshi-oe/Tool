import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { loadPredefinedFiles } from "../utils/file";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

interface FileUploadModalProps {
  onFileLoaded: (content: string, propItemContent?: string) => void;
  onCancel: () => void;
  isVisible: boolean;
  source?: 'header' | 'fileMenu'; // Track upload source to prevent duplicates
}

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks für bessere Performance bei großen Dateien

const FileUploadModal = ({ onFileLoaded, onCancel, isVisible, source = 'header' }: FileUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadMode, setLoadMode] = useState<'predefined' | 'custom'>('predefined');
  
  const loadPredefinedResourceFiles = () => {
    setIsLoading(true);
    setLoadingMessage("Loading resource files...");
    
    console.log("Loading predefined resource files...");
    loadPredefinedFiles()
      .then(({ specItem, propItem }) => {
        if (!specItem) {
          console.error("Failed to load Spec_item.txt - file not found or empty");
          throw new Error("Failed to load Spec_item.txt");
        }
        
        console.log("Spec_item.txt loaded successfully, content length:", specItem.length);
        console.log("Spec_item.txt first 100 chars:", specItem.substring(0, 100));
        
        if (propItem) {
          console.log("propItem.txt.txt loaded successfully, content length:", propItem.length);
          console.log("propItem.txt.txt first 100 chars:", propItem?.substring(0, 100));
        } else {
          console.warn("propItem.txt.txt could not be loaded or is empty");
        }
        
        console.log("Calling onFileLoaded with specItem and propItem");
        
        toast.success("Loaded resource files successfully");
        onFileLoaded(specItem, propItem || "");
        setIsLoading(false);
        onCancel(); // Close the modal after loading
      })
      .catch(error => {
        console.error("Error loading resource files:", error);
        toast.error("Failed to load resource files. Please check the console for details.");
        setIsLoading(false);
      });
  };
  
  if (!isVisible) return null;
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const specItemFile = Array.from(files).find(f => 
      f.name.toLowerCase().includes('spec_item') || f.name.toLowerCase().includes('specitem')
    );
    
    const propItemFile = Array.from(files).find(f => 
      f.name.toLowerCase().includes('propitem') || f.name.toLowerCase().includes('prop_item')
    );
    
    if (!specItemFile) {
      await loadFile(files[0], "specItem");
      return;
    }
    
    let specItemContent = "";
    let propItemContent = "";
    
    if (specItemFile) {
      specItemContent = await loadFile(specItemFile, "specItem");
    }
    
    if (propItemFile) {
      propItemContent = await loadFile(propItemFile, "propItem");
    }
    
    console.log("Files loaded via upload, calling onFileLoaded");
    onFileLoaded(specItemContent, propItemContent);
    onCancel(); // Close modal after successful upload
  };
  
  const loadFile = async (file: File, fileType: "specItem" | "propItem"): Promise<string> => {
    setIsLoading(true);
    setProgress(0);
    setLoadingMessage(`Loading ${file.name}...`);
    toast.info(`Loading file ${file.name}...`);
    
    console.log(`Starting to load ${file.name} (${file.size} bytes / ${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    try {
      // Bei sehr großen Dateien (>100MB) Warnung ausgeben
      if (file.size > 100 * 1024 * 1024) {
        console.warn(`File ${file.name} is very large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Processing may take some time.`);
        toast.warning(`The file ${file.name} is very large. This may take some time to process.`);
      }
      
      let content = "";
      const fileSize = file.size;
      let offset = 0;
      
      // Zeige detailliertere Fortschrittsinformationen
      const updateInterval = Math.max(1, Math.floor(fileSize / (CHUNK_SIZE * 10))); // Update bei ~10% Intervallen
      let chunkCount = 0;
      
      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const chunkText = await readChunk(chunk);
        content += chunkText;
        offset += CHUNK_SIZE;
        chunkCount++;
        
        const currentProgress = Math.min(100, Math.round((offset / fileSize) * 100));
        setProgress(currentProgress);
        
        // Log nur bei größeren Fortschritten für bessere Performance
        if (chunkCount % updateInterval === 0 || offset >= fileSize) {
          console.log(`Processed ${offset} of ${fileSize} bytes (${currentProgress}%)`);
          setLoadingMessage(`Loading ${file.name}: ${currentProgress}% complete (${(offset / (1024 * 1024)).toFixed(1)} / ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`);
        }
        
        // Gib dem Browser Zeit zum Rendering und verhindere UI-Blockierung
        if (chunkCount % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      console.log(`Finished loading ${file.name}: ${content.length} characters loaded`);
      toast.success(`File ${file.name} loaded successfully`);
      
      return content;
    } catch (error) {
      console.error(`Error reading ${fileType} file:`, error);
      toast.error(`Error reading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Bei Out-of-Memory Fehlern spezifischere Hilfe anbieten
      if (error instanceof Error && error.message.includes('memory')) {
        toast.error(`The file ${file.name} is too large to process in browser memory. Try splitting the file or using a smaller file.`);
      }
      
      return "";
    } finally {
      setIsLoading(false);
      setProgress(0);
      setLoadingMessage("");
    }
  };
  
  const readChunk = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // First try to detect encoding by reading the first few bytes
      const encodingReader = new FileReader();
      
      encodingReader.onload = (event) => {
        if (event.target?.result) {
          const buffer = event.target.result as ArrayBuffer;
          const firstBytes = new Uint8Array(buffer);
          
          // Check for UTF-16LE BOM (FF FE)
          if (buffer.byteLength >= 2 && firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
            console.log("UTF-16LE encoding detected in uploaded file");
            
            // Read the entire chunk with the correct encoding
            const reader = new FileReader();
            
            reader.onload = (event) => {
              if (event.target?.result) {
                resolve(event.target.result as string);
              } else {
                reject(new Error("Failed to read file chunk"));
              }
            };
            
            reader.onerror = (error) => {
              reject(error);
            };
            
            // Use UTF-16LE encoding
            reader.readAsText(blob, 'utf-16le');
          } else {
            // Use default UTF-8 encoding
            const reader = new FileReader();
            
            reader.onload = (event) => {
              if (event.target?.result) {
                resolve(event.target.result as string);
              } else {
                reject(new Error("Failed to read file chunk"));
              }
            };
            
            reader.onerror = (error) => {
              reject(error);
            };
            
            reader.readAsText(blob, 'utf-8');
          }
        } else {
          reject(new Error("Failed to read file header for encoding detection"));
        }
      };
      
      encodingReader.onerror = (error) => {
        reject(error);
      };
      
      // Read just the first few bytes to detect encoding
      encodingReader.readAsArrayBuffer(blob.slice(0, 4));
    });
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-cyrus-dark-light rounded-lg p-6 shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-cyrus-gold">Load Resource Files</h2>
        
        <div className="mb-4 flex space-x-2">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded ${loadMode === 'predefined' ? 'bg-cyrus-blue text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setLoadMode('predefined')}
          >
            Default Files
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded ${loadMode === 'custom' ? 'bg-cyrus-blue text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setLoadMode('custom')}
          >
            Custom Files
          </button>
        </div>
        
        <p className="mb-4 text-gray-300">
          {isLoading ? loadingMessage : 
            loadMode === 'predefined' ? 
              "Load files from the default location (./public/resource)" :
              "Upload your custom resource files"
          }
        </p>
        
        {isLoading && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {loadMode === 'predefined' ? (
          <div className="mb-6">
            <Button
              className="w-full bg-cyrus-blue hover:bg-blue-700"
              disabled={isLoading}
              onClick={loadPredefinedResourceFiles}
            >
              Load Default Files
            </Button>
          </div>
        ) : (
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.h,.inc"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
            <div className="flex flex-col space-y-2">
              <Button
                className="w-full bg-cyrus-blue hover:bg-blue-700 flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload size={16} className="mr-2" />
                Browse Files
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Select both Spec_item.txt and propItem.txt.txt files for best results
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-4 rounded"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
