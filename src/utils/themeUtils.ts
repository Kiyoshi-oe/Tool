
export const themes = [
  { 
    id: "dark", 
    name: "Dark Mode", 
    isDark: true,
    background: "#1E1E1E",
    foreground: "#FFFFFF",
    accent: "#0078D7",
    buttonBg: "#252526",
    buttonHover: "#3E3E42"
  },
  { 
    id: "cyber-noir", 
    name: "Cyber Noir", 
    isDark: true,
    background: "#121212",
    foreground: "#E0E0E0",
    accent: "#00FFFF",
    buttonBg: "#1A1A2E",
    buttonHover: "#00A3E0",
    description: "High-Tech-Hacker-Style, inspired by Cyberpunk"
  },
  { 
    id: "paper-white", 
    name: "Paper White", 
    isDark: false,
    background: "#FAFAFA",
    foreground: "#212121",
    accent: "#FF6B6B",
    buttonBg: "#F1F1F1",
    buttonHover: "#D6D6D6",
    description: "Clean, elegant and clearly structured"
  },
  { 
    id: "ocean-breeze", 
    name: "Ocean Breeze", 
    isDark: true,
    background: "#1E3A5F",
    foreground: "#E0F7FA",
    accent: "#4DD0E1",
    buttonBg: "#1565C0",
    buttonHover: "#64B5F6",
    description: "Calming and inspiring, perfect for creative work"
  },
  { 
    id: "solarized-pro", 
    name: "Solarized Pro", 
    isDark: true,
    background: "#002B36",
    foreground: "#839496",
    accent: "#B58900",
    buttonBg: "#073642",
    buttonHover: "#268BD2",
    description: "Developed for long coding sessions without eye strain"
  },
  { 
    id: "apple-web", 
    name: "Apple Web", 
    isDark: false,
    background: "#FFFFFF",
    foreground: "#1D1D1F",
    accent: "#0071E3",
    buttonBg: "#F5F5F7",
    buttonHover: "#E5E5EA",
    description: "Inspired by Apple.com - clean, modern, minimalist"
  },
];

export const fontOptions = [
  { value: "inter", label: "Inter", family: "'Inter', sans-serif" },
  { value: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { value: "opensans", label: "Open Sans", family: "'Open Sans', sans-serif" },
  { value: "lato", label: "Lato", family: "'Lato', sans-serif" },
  { value: "montserrat", label: "Montserrat", family: "'Montserrat', sans-serif" },
  { value: "sourcecode", label: "Source Code Pro", family: "'Source Code Pro', monospace" },
  { value: "robotomono", label: "Roboto Mono", family: "'Roboto Mono', monospace" },
  { value: "playfair", label: "Playfair Display", family: "'Playfair Display', serif" },
  { value: "merriweather", label: "Merriweather", family: "'Merriweather', serif" },
  { value: "nunitosans", label: "Nunito Sans", family: "'Nunito Sans', sans-serif" },
];

export const applyTheme = (theme: any, settings: any) => {
  document.documentElement.style.setProperty('--font-family', fontOptions.find(f => f.value === settings.font)?.family || fontOptions[0].family);
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  
  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];
  
  if (currentTheme.accent) {
    document.documentElement.style.setProperty('--primary-color', currentTheme.accent);
  }
  if (currentTheme.background) {
    document.documentElement.style.setProperty('--background-color', currentTheme.background);
  }
  if (currentTheme.foreground) {
    document.documentElement.style.setProperty('--foreground-color', currentTheme.foreground);
  }
  
  document.body.style.backgroundColor = currentTheme.background || '#1E1E1E';
  document.body.style.color = currentTheme.foreground || '#FFFFFF';
  
  const styleElems = document.querySelectorAll('.themed-bg');
  styleElems.forEach(elem => {
    (elem as HTMLElement).style.backgroundColor = currentTheme.background || '#1E1E1E';
  });
};
