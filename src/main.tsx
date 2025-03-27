import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Hilfsfunktion zur Erkennung bestimmter Fehlertypen
const isModuleLoadingError = (message: string = '') => {
  const moduleErrorPatterns = [
    'Failed to fetch dynamically',
    'Loading chunk',
    'Module not found',
    'Cannot find module',
    'ChunkLoadError',
    'NetworkError',
    'SyntaxError',
    'Error loading',
    'TogglerTree'
  ];
  
  return moduleErrorPatterns.some(pattern => message.includes(pattern));
};

// Globale Fehlerbehandlung
window.addEventListener('error', (event) => {
  const errorMessage = event.message || (event.error?.message) || '';
  console.error('Global error caught:', event.error);
  
  // Spezielle Behandlung für "Failed to fetch" Fehler
  if (errorMessage.includes('Failed to fetch')) {
    console.warn('Resource loading error detected and handled globally');
    // Verhindern, dass der Fehler die Anwendung abstürzen lässt
    event.preventDefault();
  }
  
  // Behandlung für TogglerTree und andere dynamisch geladene Module
  if (isModuleLoadingError(errorMessage)) {
    console.warn('Module loading error detected and handled globally:', errorMessage);
    event.preventDefault();
  }
  
  // Fehler bezüglich AbortController oder Netzwerkfehler abfangen
  if (event.error && (
      event.error.name === 'AbortError' || 
      event.error.message?.includes('Failed to fetch') ||
      event.error.message?.includes('Network request failed')
    )) {
    console.warn('Network-related error caught and handled globally');
    event.preventDefault();
  }

  // Spezielle Fehlerbehandlung für TogglerTree
  if (errorMessage.includes('TogglerTree')) {
    console.warn('TogglerTree error caught and suppressed - this component might be missing');
    event.preventDefault();
    
    // Optional: Hier könnte ein globaler Zustand gesetzt werden, der der Anwendung mitteilt,
    // dass TogglerTree nicht verfügbar ist und Fallbacks verwendet werden sollten
  }
});

// Globaler Handler für unbehandelte Promise-Rejections
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason) || '';
  console.error('Unhandled Promise rejection:', event.reason);
  
  // Spezielle Behandlung für Modul-Ladefehler in Promises
  if (isModuleLoadingError(errorMessage)) {
    console.warn('Module loading rejection caught and handled:', errorMessage);
    event.preventDefault();
  }
  
  // Spezielle Behandlung für "Failed to fetch" Fehler in Promises
  if (event.reason && (
      event.reason.message?.includes('Failed to fetch') ||
      event.reason.message?.includes('Network request failed') ||
      event.reason.name === 'AbortError'
    )) {
    console.warn('Network-related promise rejection caught and handled globally');
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
