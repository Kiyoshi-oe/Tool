import { useState, useEffect } from 'react';

// Hook für das Zusammenführen und Überwachen von Chunk-basierten Daten
export function useChunkedData(initialData: string | null, sourceType: 'specItem' | 'propItem') {
  const [data, setData] = useState<string | null>(initialData);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    // Aktualisiere den initialen Zustand
    if (initialData) {
      setData(initialData);
    }

    // Prüfe, ob Chunks bereits vorhanden sind
    if (window.APP_CONFIG) {
      const chunks = sourceType === 'specItem' 
        ? window.APP_CONFIG.SPEC_ITEM_CHUNKS 
        : window.APP_CONFIG.PROP_ITEM_CHUNKS;
      
      const totalSize = sourceType === 'specItem'
        ? window.APP_CONFIG.SPEC_ITEM_TOTAL_SIZE
        : window.APP_CONFIG.PROP_ITEM_TOTAL_SIZE;
        
      const currentPosition = sourceType === 'specItem'
        ? window.APP_CONFIG.SPEC_ITEM_POSITION
        : window.APP_CONFIG.PROP_ITEM_POSITION;

      // Berechne Fortschritt wenn möglich
      if (totalSize && currentPosition) {
        setLoadProgress(Math.round((currentPosition / totalSize) * 100));
      }
        
      // Wenn Chunks vorhanden sind, füge sie zum initialData hinzu
      if (chunks && chunks.length > 0) {
        setData((prevData) => {
          return (prevData || '') + chunks.join('');
        });
      }
    }

    // Event-Handler für neue Chunks
    const handleNewChunks = () => {
      if (window.APP_CONFIG) {
        const chunks = sourceType === 'specItem' 
          ? window.APP_CONFIG.SPEC_ITEM_CHUNKS 
          : window.APP_CONFIG.PROP_ITEM_CHUNKS;
            
        // Nur die neuesten Chunks hinzufügen
        if (chunks && chunks.length > 0) {
          // Letzten Chunk nehmen (wir gehen davon aus, dass alte Chunks bereits verarbeitet wurden)
          const latestChunk = chunks[chunks.length - 1];
            
          setData((prevData) => {
            return (prevData || '') + latestChunk;
          });
            
          // Leere den Chunks-Array um Speicher freizugeben
          if (sourceType === 'specItem') {
            window.APP_CONFIG.SPEC_ITEM_CHUNKS = [];
          } else {
            window.APP_CONFIG.PROP_ITEM_CHUNKS = [];
          }
        }
          
        // Update Fortschritt
        const totalSize = sourceType === 'specItem'
          ? window.APP_CONFIG.SPEC_ITEM_TOTAL_SIZE
          : window.APP_CONFIG.PROP_ITEM_TOTAL_SIZE;
            
        const currentPosition = sourceType === 'specItem'
          ? window.APP_CONFIG.SPEC_ITEM_POSITION
          : window.APP_CONFIG.PROP_ITEM_POSITION;
            
        if (totalSize && currentPosition) {
          setLoadProgress(Math.round((currentPosition / totalSize) * 100));
        }
      }
    };

    // Event-Handler für vollständig geladene Daten
    const handleFullyLoaded = () => {
      setIsFullyLoaded(true);
      // Finale Datenverarbeitung, wenn notwendig
      if (window.APP_CONFIG) {
        const chunks = sourceType === 'specItem' 
          ? window.APP_CONFIG.SPEC_ITEM_CHUNKS 
          : window.APP_CONFIG.PROP_ITEM_CHUNKS;
            
        // Füge alle verbleibenden Chunks hinzu
        if (chunks && chunks.length > 0) {
          setData((prevData) => {
            return (prevData || '') + chunks.join('');
          });
            
          // Speicher freigeben
          if (sourceType === 'specItem') {
            window.APP_CONFIG.SPEC_ITEM_CHUNKS = [];
          } else {
            window.APP_CONFIG.PROP_ITEM_CHUNKS = [];
          }
        }
      }
      setLoadProgress(100);
    };

    // Event-Listener für Chunk-Updates
    window.addEventListener(sourceType === 'specItem' ? 'specItemChunkLoaded' : 'propItemChunkLoaded', handleNewChunks);
    
    // Event-Listener für vollständig geladene Daten
    window.addEventListener(sourceType === 'specItem' ? 'specItemFullyLoaded' : 'propItemFullyLoaded', handleFullyLoaded);

    // Check if data is already fully loaded
    if (window.APP_CONFIG) {
      const isAlreadyLoaded = sourceType === 'specItem' 
        ? window.APP_CONFIG.SPEC_ITEM_FULLY_LOADED 
        : window.APP_CONFIG.PROP_ITEM_FULLY_LOADED;
        
      if (isAlreadyLoaded) {
        setIsFullyLoaded(true);
        setLoadProgress(100);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener(sourceType === 'specItem' ? 'specItemChunkLoaded' : 'propItemChunkLoaded', handleNewChunks);
      window.removeEventListener(sourceType === 'specItem' ? 'specItemFullyLoaded' : 'propItemFullyLoaded', handleFullyLoaded);
    };
  }, [initialData, sourceType]);

  return { data, isFullyLoaded, loadProgress };
} 