import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BrandingContextType {
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  setBranding: (primary: string, secondary: string, logo?: string | null) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [logo, setLogo] = useState<string | null>(null);

  // Load branding from localStorage on mount
  useEffect(() => {
    const savedBranding = localStorage.getItem('tenantBranding');
    if (savedBranding) {
      try {
        const branding = JSON.parse(savedBranding);
        setPrimaryColor(branding.primaryColor || '#6366f1');
        setSecondaryColor(branding.secondaryColor || '#8b5cf6');
        setLogo(branding.logo || null);
      } catch (error) {
        console.error('Failed to load branding:', error);
      }
    }
  }, []);

  // Apply colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', primaryColor);
    root.style.setProperty('--brand-secondary', secondaryColor);
    
    // Generate lighter/darker shades for hover states
    const primaryRgb = hexToRgb(primaryColor);
    if (primaryRgb) {
      root.style.setProperty('--brand-primary-hover', adjustBrightness(primaryColor, -15));
      root.style.setProperty('--brand-primary-light', adjustBrightness(primaryColor, 40));
    }
    
    return () => {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-primary-hover');
      root.style.removeProperty('--brand-primary-light');
    };
  }, [primaryColor, secondaryColor]);

  const setBranding = (primary: string, secondary: string, logoValue?: string | null) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    if (logoValue !== undefined) {
      setLogo(logoValue);
    }
    
    // Save to localStorage
    localStorage.setItem('tenantBranding', JSON.stringify({
      primaryColor: primary,
      secondaryColor: secondary,
      logo: logoValue || null,
    }));
  };

  return (
    <BrandingContext.Provider value={{ primaryColor, secondaryColor, logo, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, Math.max(0, rgb.r + percent));
  const g = Math.min(255, Math.max(0, rgb.g + percent));
  const b = Math.min(255, Math.max(0, rgb.b + percent));
  
  return `rgb(${r}, ${g}, ${b})`;
}

