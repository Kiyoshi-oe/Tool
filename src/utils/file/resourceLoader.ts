import { parsePropItemFile } from './propItemUtils';
import { parseTextFile } from './parseUtils';

// Erweitere den Window-Typ, um APP_CONFIG zu unterstützen
declare global {
  interface Window {
    APP_CONFIG?: {
      USING_LARGE_FILES?: boolean;
      SPEC_ITEM_PATH?: string;
      SPEC_ITEM_POSITION?: number;
      SPEC_ITEM_ENCODING?: string;
      SPEC_ITEM_TOTAL_SIZE?: number;
      SPEC_ITEM_CHUNKS?: string[];
      SPEC_ITEM_FULLY_LOADED?: boolean;
      PROP_ITEM_PATH?: string;
      PROP_ITEM_POSITION?: number;
      PROP_ITEM_ENCODING?: string;
      PROP_ITEM_TOTAL_SIZE?: number;
      PROP_ITEM_CHUNKS?: string[];
      PROP_ITEM_FULLY_LOADED?: boolean;
    };
  }
}

// Erkennen ob wir in Electron oder im Browser laufen
const isElectron = () => {
  return window && window.process && window.process.versions && window.process.versions.electron;
};

export const loadPredefinedFiles = async (): Promise<{specItem: string | null, propItem: string | null}> => {
  try {
    console.log("Attempting to load files from resource directory");
    console.log("Is Electron environment:", isElectron());
    
    // Performance-Flag setzen für großes Datei-Handling
    window.APP_CONFIG = window.APP_CONFIG || {};
    window.APP_CONFIG.USING_LARGE_FILES = true;
    
    // Bei Electron direkt das Dateisystem verwenden
    if (isElectron()) {
      return await loadFilesFromFileSystem();
    }
    
    // Ansonsten mit Fetch versuchen (Browser)
    return await loadFilesWithFetch();
  } catch (error) {
    console.error('Error loading predefined files:', error);
    return { specItem: null, propItem: null };
  }
};

// Laden direkt über das Dateisystem (nur in Electron)
async function loadFilesFromFileSystem(): Promise<{specItem: string | null, propItem: string | null}> {
  try {
    // In Electron können wir das Node.js fs-Modul verwenden
    // Wir müssen dies dynamisch importieren, damit es im Browser nicht zu Fehlern kommt
    const fs = window.require('fs');
    const path = window.require('path');
    const { app } = window.require('@electron/remote');
    
    // Basis-Pfad zur App-Ressourcen
    let basePath = '';
    if (app) {
      // Im Produktionsmodus
      basePath = path.join(app.getAppPath(), 'public', 'resource');
    } else {
      // Im Entwicklungsmodus
      basePath = path.join(process.cwd(), 'public', 'resource');
    }
    
    // Absolute Pfade zu den Dateien
    const specItemPath = path.join(basePath, 'Spec_Item.txt');
    // Prüfe erst, ob die kleinere Testdatei existiert
    const testSpecItemPath = path.join(basePath, 'Spec_item_Test.txt');
    const propItemPath = path.join(basePath, 'propItem.txt.txt');
    
    let specItemText = null;
    let propItemText = null;
    
    // OPTIMIERUNG: Prüfe zuerst, ob die kleinere Testdatei existiert
    if (fs.existsSync(testSpecItemPath)) {
      console.log(`Gefunden: kleinere Testdatei ${testSpecItemPath}`);
      const buffer = fs.readFileSync(testSpecItemPath);
      specItemText = buffer.toString('utf8');
      console.log(`Geladen: Test-Spec-Datei, Länge: ${specItemText.length}`);
    }
    // Versuche die Spec_Item.txt Datei zu lesen, falls keine Testdatei existiert
    else if (fs.existsSync(specItemPath)) {
      // NEU: Chunked Reading für große Dateien mit Verzögerungspufferung
      const stats = fs.statSync(specItemPath);
      console.log(`Spec_Item.txt Größe: ${stats.size} Bytes`);
      
      // OPTIMIERUNG: Beschränke den initialen Ladevorgang
      // Wir laden nur einen HEAD-Chunk für sofortige Anzeige
      // und laden den Rest im Hintergrund
      const MAX_INITIAL_SIZE = 1 * 1024 * 1024; // 1MB für erstes Laden
      
      // Nur die ersten Bytes lesen, um den BOM zu erkennen
      const headerBuffer = Buffer.alloc(4096);
      const fd = fs.openSync(specItemPath, 'r');
      fs.readSync(fd, headerBuffer, 0, 4096, 0);
      
      // BOM erkennen
      let encoding: BufferEncoding = 'utf8';
      let skipBytes = 0;
      
      if (headerBuffer[0] === 0xEF && headerBuffer[1] === 0xBB && headerBuffer[2] === 0xBF) {
        console.log("UTF-8 BOM detected");
        encoding = 'utf8';
        skipBytes = 3;
      } else if (headerBuffer[0] === 0xFF && headerBuffer[1] === 0xFE) {
        console.log("UTF-16LE BOM detected");
        encoding = 'utf16le';
        skipBytes = 2;
      }
      
      // OPTIMIERUNG: Nur den Anfang der Datei laden für schnelle Anzeige
      const initialBuffer = Buffer.alloc(MAX_INITIAL_SIZE);
      fs.readSync(fd, initialBuffer, 0, MAX_INITIAL_SIZE, skipBytes);
      fs.closeSync(fd);
      
      // Konvertiere den Buffer in Text
      specItemText = initialBuffer.toString(encoding);
      console.log(`Initialer Inhalt geladen: ${specItemText.length} Zeichen`);
      
      // OPTIMIERUNG: Speichern Sie den Dateipfad und die Position für späteres Nachladen
      window.APP_CONFIG = window.APP_CONFIG || {};
      window.APP_CONFIG.SPEC_ITEM_PATH = specItemPath;
      window.APP_CONFIG.SPEC_ITEM_POSITION = skipBytes + MAX_INITIAL_SIZE;
      window.APP_CONFIG.SPEC_ITEM_ENCODING = encoding;
      window.APP_CONFIG.SPEC_ITEM_TOTAL_SIZE = stats.size;
      
      // Starte den Hintergrundprozess für das Nachladen
      setTimeout(() => {
        loadRemainingSpecItemContent(specItemPath, window.APP_CONFIG.SPEC_ITEM_POSITION, encoding, stats.size);
      }, 1000); // 1 Sekunde warten, um die UI-Anzeige zu priorisieren
    } else {
      console.error(`File not found: ${specItemPath}`);
      // Alternatives Pfad versuchen (vom Benutzer angegeben)
      const userPath = 'C:/Users/paypa/Downloads/cluster/Tool/public/resource/Spec_Item.txt';
      console.log(`Trying alternative path: ${userPath}`);
      
      if (fs.existsSync(userPath)) {
        // OPTIMIERUNG: Gleiche Logik wie oben für den alternativen Pfad
        const stats = fs.statSync(userPath);
        const MAX_INITIAL_SIZE = 1 * 1024 * 1024; // 1MB für erstes Laden
        
        const headerBuffer = Buffer.alloc(4096);
        const fd = fs.openSync(userPath, 'r');
        fs.readSync(fd, headerBuffer, 0, 4096, 0);
        
        let encoding: BufferEncoding = 'utf8';
        let skipBytes = 0;
        
        if (headerBuffer[0] === 0xEF && headerBuffer[1] === 0xBB && headerBuffer[2] === 0xBF) {
          encoding = 'utf8';
          skipBytes = 3;
        } else if (headerBuffer[0] === 0xFF && headerBuffer[1] === 0xFE) {
          encoding = 'utf16le';
          skipBytes = 2;
        }
        
        const initialBuffer = Buffer.alloc(MAX_INITIAL_SIZE);
        fs.readSync(fd, initialBuffer, 0, MAX_INITIAL_SIZE, skipBytes);
        fs.closeSync(fd);
        
        specItemText = initialBuffer.toString(encoding);
        
        // Speichern für Nachladen
        window.APP_CONFIG = window.APP_CONFIG || {};
        window.APP_CONFIG.SPEC_ITEM_PATH = userPath;
        window.APP_CONFIG.SPEC_ITEM_POSITION = skipBytes + MAX_INITIAL_SIZE;
        window.APP_CONFIG.SPEC_ITEM_ENCODING = encoding;
        window.APP_CONFIG.SPEC_ITEM_TOTAL_SIZE = stats.size;
        
        setTimeout(() => {
          loadRemainingSpecItemContent(userPath, window.APP_CONFIG.SPEC_ITEM_POSITION, encoding, stats.size);
        }, 1000);
      } else {
        throw new Error("Could not find Spec_item.txt file in any location");
      }
    }
    
    // Versuche die propItem.txt.txt Datei zu lesen
    if (fs.existsSync(propItemPath)) {
      const stats = fs.statSync(propItemPath);
      console.log(`propItem.txt.txt Größe: ${stats.size} Bytes`);
      
      // OPTIMIERUNG: Beschränktes Laden für propItem.txt.txt
      const MAX_INITIAL_SIZE = 500 * 1024; // 500KB für initialen Ladevorgang
      
      // Erkennung der Kodierung
      const headerBuffer = Buffer.alloc(4096);
      const fd = fs.openSync(propItemPath, 'r');
      fs.readSync(fd, headerBuffer, 0, 4096, 0);
      
      let encoding: BufferEncoding = 'utf8';
      let skipBytes = 0;
      
      if (headerBuffer.length >= 2 && headerBuffer[0] === 0xFF && headerBuffer[1] === 0xFE) {
        console.log("UTF-16LE BOM detected in propItem file");
        encoding = 'utf16le';
        skipBytes = 2;
      }
      
      // Lade nur den Anfang
      const initialBuffer = Buffer.alloc(MAX_INITIAL_SIZE);
      fs.readSync(fd, initialBuffer, 0, MAX_INITIAL_SIZE, skipBytes);
      fs.closeSync(fd);
      
      propItemText = initialBuffer.toString(encoding);
      console.log(`Initialer propItem Inhalt geladen: ${propItemText.length} Zeichen`);
      
      // Speichern für Nachladen
      window.APP_CONFIG = window.APP_CONFIG || {};
      window.APP_CONFIG.PROP_ITEM_PATH = propItemPath;
      window.APP_CONFIG.PROP_ITEM_POSITION = skipBytes + MAX_INITIAL_SIZE;
      window.APP_CONFIG.PROP_ITEM_ENCODING = encoding;
      window.APP_CONFIG.PROP_ITEM_TOTAL_SIZE = stats.size;
      
      // Starte das Nachladen im Hintergrund
      setTimeout(() => {
        loadRemainingPropItemContent(propItemPath, window.APP_CONFIG.PROP_ITEM_POSITION, encoding, stats.size);
      }, 1500); // 1,5 Sekunden warten, um UI nicht zu blockieren
    }
    
    return { specItem: specItemText, propItem: propItemText };
  } catch (error) {
    console.error("Error loading files from filesystem:", error);
    throw error;
  }
}

// Hintergrund-Ladevorgang für Spec_Item.txt
function loadRemainingSpecItemContent(filePath: string, position: number, encoding: BufferEncoding, totalSize: number) {
  try {
    const fs = window.require('fs');
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
    
    // Funktion für das Laden eines Chunks
    const loadNextChunk = () => {
      if (position >= totalSize) {
        console.log("Spec_Item.txt vollständig geladen");
        // Setze den vollständigen Ladestatus
        window.APP_CONFIG.SPEC_ITEM_FULLY_LOADED = true;
        // Sende ein benutzerdefiniertes Event für die App
        window.dispatchEvent(new CustomEvent('specItemFullyLoaded'));
        return;
      }
      
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(CHUNK_SIZE);
      const bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, position);
      fs.closeSync(fd);
      
      if (bytesRead <= 0) {
        console.log("Spec_Item.txt vollständig geladen (EOF)");
        window.APP_CONFIG.SPEC_ITEM_FULLY_LOADED = true;
        window.dispatchEvent(new CustomEvent('specItemFullyLoaded'));
        return;
      }
      
      // Verarbeite den neu geladenen Chunk
      const chunk = buffer.slice(0, bytesRead).toString(encoding);
      
      // Füge den Chunk zum Cache hinzu
      window.APP_CONFIG.SPEC_ITEM_CHUNKS = window.APP_CONFIG.SPEC_ITEM_CHUNKS || [];
      window.APP_CONFIG.SPEC_ITEM_CHUNKS.push(chunk);
      
      // Aktualisiere die Position
      position += bytesRead;
      window.APP_CONFIG.SPEC_ITEM_POSITION = position;
      
      // Gib Ladestatus aus
      const percent = Math.round((position / totalSize) * 100);
      console.log(`Spec_Item.txt Ladefortschritt: ${percent}%`);
      
      // Sende Event für den geladenen Chunk
      window.dispatchEvent(new CustomEvent('specItemChunkLoaded'));
      
      // Lade den nächsten Chunk mit Verzögerung
      setTimeout(loadNextChunk, 200); // 200ms Pause zwischen Chunks
    };
    
    // Starte den Ladevorgang
    loadNextChunk();
  } catch (error) {
    console.error("Error in background loading of Spec_Item.txt:", error);
  }
}

// Hintergrund-Ladevorgang für propItem.txt.txt
function loadRemainingPropItemContent(filePath: string, position: number, encoding: BufferEncoding, totalSize: number) {
  try {
    const fs = window.require('fs');
    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
    
    // Funktion für das Laden eines Chunks
    const loadNextChunk = () => {
      if (position >= totalSize) {
        console.log("propItem.txt.txt vollständig geladen");
        window.APP_CONFIG.PROP_ITEM_FULLY_LOADED = true;
        window.dispatchEvent(new CustomEvent('propItemFullyLoaded'));
        return;
      }
      
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(CHUNK_SIZE);
      const bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, position);
      fs.closeSync(fd);
      
      if (bytesRead <= 0) {
        console.log("propItem.txt.txt vollständig geladen (EOF)");
        window.APP_CONFIG.PROP_ITEM_FULLY_LOADED = true;
        window.dispatchEvent(new CustomEvent('propItemFullyLoaded'));
        return;
      }
      
      // Verarbeite den neu geladenen Chunk
      const chunk = buffer.slice(0, bytesRead).toString(encoding);
      
      // Füge den Chunk zum Cache hinzu
      window.APP_CONFIG.PROP_ITEM_CHUNKS = window.APP_CONFIG.PROP_ITEM_CHUNKS || [];
      window.APP_CONFIG.PROP_ITEM_CHUNKS.push(chunk);
      
      // Aktualisiere die Position
      position += bytesRead;
      window.APP_CONFIG.PROP_ITEM_POSITION = position;
      
      // Gib Ladestatus aus
      const percent = Math.round((position / totalSize) * 100);
      console.log(`propItem.txt.txt Ladefortschritt: ${percent}%`);
      
      // Sende Event für den geladenen Chunk
      window.dispatchEvent(new CustomEvent('propItemChunkLoaded'));
      
      // Lade den nächsten Chunk mit Verzögerung
      setTimeout(loadNextChunk, 300); // 300ms Pause zwischen Chunks
    };
    
    // Starte den Ladevorgang
    loadNextChunk();
  } catch (error) {
    console.error("Error in background loading of propItem.txt.txt:", error);
  }
}

// Browser-basiertes Laden mit Fetch (bestehender Code)
async function loadFilesWithFetch(): Promise<{specItem: string | null, propItem: string | null}> {
  // Versuche beide mögliche Dateipfade: relativ und absolut
  const possiblePaths = [
    '/resource/Spec_item.txt',
    '/public/resource/Spec_item.txt',
    'C:/Users/paypa/Downloads/cluster/Tool/public/resource/Spec_item.txt'
  ];
  
  let specItemText = null;
  let specItemPath = "";
  
  // Versuche alle möglichen Pfade
  for (const path of possiblePaths) {
    try {
      console.log(`Trying path: ${path}`);
      
      // Bei lokalen Dateipfaden verwende Fetch mit file:// Protokoll
      const isLocalPath = path.includes(':');
      const fetchPath = isLocalPath ? `file://${path}` : path;
      
      // Performance-Optimierung: Head-Request für Metadaten und Content-Length
      try {
        const headResponse = await fetch(fetchPath, { method: 'HEAD' });
        if (headResponse.ok) {
          const contentLength = headResponse.headers.get('content-length');
          console.log(`Datei gefunden: ${path}, Größe: ${contentLength || 'unbekannt'} Bytes`);
          
          // Bei großen Dateien Stream-basiertes Laden verwenden
          const isLargeFile = contentLength && parseInt(contentLength) > 5 * 1024 * 1024;
          
          if (isLargeFile && typeof ReadableStream !== 'undefined') {
            console.log("Große Datei erkannt, verwende Stream-basiertes Laden");
            
            // Streaming Fetch API verwenden
            const response = await fetch(fetchPath);
            if (!response.ok) continue;
            
            const reader = response.body?.getReader();
            if (!reader) continue;
            
            // Speicher für Chunks
            const chunks: Uint8Array[] = [];
            let totalBytesRead = 0;
            
            // BOM-Detektion beim ersten Chunk
            let decoder: TextDecoder | null = null;
            let skipBytes = 0;
            
            // Chunks einlesen
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              if (value) {
                // BOM beim ersten Chunk erkennen
                if (chunks.length === 0 && value.length > 0) {
                  if (value[0] === 0xEF && value[1] === 0xBB && value[2] === 0xBF) {
                    console.log("UTF-8 BOM erkannt");
                    decoder = new TextDecoder('utf-8');
                    skipBytes = 3;
                  } else if (value[0] === 0xFF && value[1] === 0xFE) {
                    console.log("UTF-16LE BOM erkannt");
                    decoder = new TextDecoder('utf-16le');
                    skipBytes = 2;
                  } else {
                    console.log("Kein BOM erkannt, verwende UTF-8");
                    decoder = new TextDecoder('utf-8');
                    skipBytes = 0;
                  }
                  
                  // Ersten Chunk mit BOM-Offset speichern
                  chunks.push(value.slice(skipBytes));
                } else {
                  chunks.push(value);
                }
                
                totalBytesRead += value.length;
                
                // Status-Updates für große Dateien
                if (contentLength && chunks.length % 5 === 0) {
                  const progress = Math.round((totalBytesRead / parseInt(contentLength)) * 100);
                  console.log(`Ladefortschritt: ${progress}% (${totalBytesRead} von ${contentLength} Bytes)`);
                }
              }
            }
            
            // Chunked-Decodierung
            if (!decoder) decoder = new TextDecoder('utf-8');
            
            console.log(`${chunks.length} Chunks geladen, Gesamtgröße: ${totalBytesRead} Bytes`);
            
            // Chunks zusammenführen und dekodieren
            // Performance-Optimierung: TextDecoder auf vereinigtem Array statt einzelne Strings verketten
            const mergedArray = new Uint8Array(totalBytesRead - skipBytes);
            let offset = 0;
            
            for (const chunk of chunks) {
              mergedArray.set(chunk, offset);
              offset += chunk.byteLength;
            }
            
            specItemText = decoder.decode(mergedArray);
            specItemPath = path;
            console.log(`Stream-basiertes Laden abgeschlossen, Inhaltslänge: ${specItemText.length}`);
          } else {
            // Standardmethode für kleinere Dateien
            const specItemResponse = await fetch(fetchPath);
            if (!specItemResponse.ok) continue;
            
            // Lade den Inhalt als ArrayBuffer um mit verschiedenen Codierungen umgehen zu können
            const specItemBuffer = await specItemResponse.arrayBuffer();
            console.log(`Loaded ${path}, buffer size:`, specItemBuffer.byteLength);
            
            // Prüfe auf BOM und wähle korrekte Decodierung
            const firstBytes = new Uint8Array(specItemBuffer.slice(0, 4));
            
            // Prüfe auf verschiedene BOMs
            let decoder;
            if (firstBytes[0] === 0xEF && firstBytes[1] === 0xBB && firstBytes[2] === 0xBF) {
              console.log("UTF-8 BOM detected");
              decoder = new TextDecoder('utf-8');
              specItemText = decoder.decode(specItemBuffer.slice(3));
            } else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
              console.log("UTF-16LE BOM detected");
              decoder = new TextDecoder('utf-16le');
              specItemText = decoder.decode(specItemBuffer.slice(2));
            } else if (firstBytes[0] === 0xFE && firstBytes[1] === 0xFF) {
              console.log("UTF-16BE BOM detected");
              decoder = new TextDecoder('utf-16be');
              specItemText = decoder.decode(specItemBuffer.slice(2));
            } else {
              // Fallback: UTF-8 ohne BOM
              decoder = new TextDecoder('utf-8');
              specItemText = decoder.decode(specItemBuffer);
            }
            
            specItemPath = path;
            console.log(`Successfully decoded ${path}, content length:`, specItemText.length);
          }
            
          // Zeige einen kurzen Ausschnitt der Datei für Diagnose
          if (specItemText && specItemText.length > 0) {
            console.log("First 200 chars:", specItemText.substring(0, 200).replace(/\n/g, '\\n'));
          }
            
          break; // Erfolgreich geladen, beende die Schleife
        }
      } catch (headError) {
        console.warn(`HEAD request failed for ${path}, falling back to standard fetch`);
        
        // Fallback zu normaler Fetch-Methode
        const specItemResponse = await fetch(fetchPath);
        console.log(`Path ${path} response status:`, specItemResponse.status);
        
        if (specItemResponse.ok) {
          // Standard-Ladeverfahren (bestehender Code)
          // ... existing code ...
          // Lade den Inhalt als ArrayBuffer um mit verschiedenen Codierungen umgehen zu können
          const specItemBuffer = await specItemResponse.arrayBuffer();
          console.log(`Loaded ${path}, buffer size:`, specItemBuffer.byteLength);
          
          // Prüfe auf BOM und wähle korrekte Decodierung
          const firstBytes = new Uint8Array(specItemBuffer.slice(0, 4));
          
          // Prüfe auf verschiedene BOMs
          let decoder;
          if (firstBytes[0] === 0xEF && firstBytes[1] === 0xBB && firstBytes[2] === 0xBF) {
            console.log("UTF-8 BOM detected");
            decoder = new TextDecoder('utf-8');
          } else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
            console.log("UTF-16LE BOM detected");
            decoder = new TextDecoder('utf-16le');
          } else if (firstBytes[0] === 0xFE && firstBytes[1] === 0xFF) {
            console.log("UTF-16BE BOM detected");
            decoder = new TextDecoder('utf-16be');
          } else {
            // Fallback: Versuche anhand der Daten zu erraten, ob UTF-16 vorliegt
            // Überprüfe auf Muster von UTF-16 (Nullbytes an alternierenden Positionen)
            let hasAlternatingZeros = true;
            for (let i = 0; i < Math.min(100, specItemBuffer.byteLength); i += 2) {
              if (firstBytes[i] !== 0 && firstBytes[i+1] !== 0) {
                hasAlternatingZeros = false;
                break;
              }
            }
            
            if (hasAlternatingZeros) {
              console.log("UTF-16 format detected (without BOM)");
              decoder = new TextDecoder('utf-16le'); // Üblicherweise LE unter Windows
            } else {
              console.log("No BOM detected, using UTF-8");
              decoder = new TextDecoder('utf-8');
            }
          }
          
          specItemText = decoder.decode(specItemBuffer);
          specItemPath = path;
          console.log(`Successfully decoded ${path}, content length:`, specItemText.length);
          
          // Zeige einen kurzen Ausschnitt der Datei für Diagnose
          if (specItemText.length > 0) {
            console.log("First 200 chars:", specItemText.substring(0, 200).replace(/\n/g, '\\n'));
          }
          
          break; // Erfolgreich geladen, beende die Schleife
        }
      }
    } catch (error) {
      console.warn(`Error loading from path ${path}:`, error);
    }
  }
  
  if (!specItemText) {
    throw new Error("Failed to load Spec_item.txt from any of the attempted paths");
  }
  
  // Versuche nun propItem.txt.txt zu laden aus dem gleichen Verzeichnis
        let propItemText = null;
  const propItemBasePath = specItemPath.substring(0, specItemPath.lastIndexOf('/'));
  
  try {
    const propItemPath = `${propItemBasePath}/propItem.txt.txt`;
    console.log(`Trying to load propItem.txt.txt from: ${propItemPath}`);
    
    const propItemResponse = await fetch(propItemPath);
    
          if (propItemResponse.ok) {
            // Get the file as an ArrayBuffer to handle different encodings
            const propItemBuffer = await propItemResponse.arrayBuffer();
            
            // Check for UTF-16LE BOM (FF FE)
            const firstBytes = new Uint8Array(propItemBuffer.slice(0, 2));
            
            if (firstBytes[0] === 0xFF && firstBytes[1] === 0xFE) {
        console.log("UTF-16LE encoding detected for propItem.txt.txt");
              propItemText = new TextDecoder('utf-16le').decode(propItemBuffer);
            } else {
              // Fallback to UTF-8
              propItemText = new TextDecoder('utf-8').decode(propItemBuffer);
            }
            
      console.log("propItem.txt.txt loaded, content length:", propItemText.length);
    } else {
      console.warn("propItem.txt.txt could not be loaded, status:", propItemResponse.status);
          }
  } catch (propError) {
    console.warn("Could not load propItem.txt.txt:", propError);
        }
        
        return { specItem: specItemText, propItem: propItemText };
}
