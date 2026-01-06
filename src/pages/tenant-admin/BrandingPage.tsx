import { useState, useEffect } from 'react';
import { Palette, Upload, Image as ImageIcon, Save, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  description: string;
}

const themes: Theme[] = [
  {
    id: 'modern',
    name: 'Modern',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    description: 'Contemporary indigo and purple',
  },
  {
    id: 'classic',
    name: 'Classic',
    primary: '#1e40af',
    secondary: '#7c3aed',
    description: 'Traditional blue and violet',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    primary: '#374151',
    secondary: '#6b7280',
    description: 'Clean grayscale palette',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    primary: '#f59e0b',
    secondary: '#ef4444',
    description: 'Energetic orange and red',
  },
  {
    id: 'professional',
    name: 'Professional',
    primary: '#059669',
    secondary: '#0284c7',
    description: 'Trustworthy green and blue',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    description: 'Calming blue tones',
  },
  {
    id: 'forest',
    name: 'Forest',
    primary: '#16a34a',
    secondary: '#84cc16',
    description: 'Natural green shades',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#ec4899',
    description: 'Warm orange and pink',
  },
];

const BrandingPage = () => {
  const { primaryColor, secondaryColor, logo, setBranding } = useBranding();
  const [selectedTheme, setSelectedTheme] = useState<string>('modern');
  const [localPrimaryColor, setLocalPrimaryColor] = useState(primaryColor);
  const [localSecondaryColor, setLocalSecondaryColor] = useState(secondaryColor);
  const [localLogo, setLocalLogo] = useState<string | null>(logo);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Sync local state with context
  useEffect(() => {
    setLocalPrimaryColor(primaryColor);
    setLocalSecondaryColor(secondaryColor);
    setLocalLogo(logo);
  }, [primaryColor, secondaryColor, logo]);

  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(themeId);
      setLocalPrimaryColor(theme.primary);
      setLocalSecondaryColor(theme.secondary);
      // Apply immediately to context for live preview
      setBranding(theme.primary, theme.secondary, localLogo);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        setLocalLogo(logoData);
        setBranding(localPrimaryColor, localSecondaryColor, logoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Apply the branding globally
      setBranding(localPrimaryColor, localSecondaryColor, localLogo);
      
      // TODO: Implement branding API endpoint
      // const formData = new FormData();
      // if (logoFile) {
      //   formData.append('logo', logoFile);
      // }
      // formData.append('primaryColor', localPrimaryColor);
      // formData.append('secondaryColor', localSecondaryColor);
      // formData.append('theme', selectedTheme);
      // await api.post('/tenant/branding', formData);
      alert('Branding settings saved and applied!');
    } catch (error) {
      console.error('Failed to save branding:', error);
      alert('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Local Branding</h1>
        <p className="text-gray-600 mt-1">Customize your organization's look and feel</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="label-field flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Organization Logo
          </label>
          <div className="mt-2 flex items-center gap-4">
            {logo && (
              <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <label 
              className="flex items-center gap-2 cursor-pointer bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {localLogo ? 'Change Logo' : 'Upload Logo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">Recommended size: 200x200px, PNG or SVG format</p>
        </div>

        {/* Theme Selection */}
        <div className="border-t pt-6">
          <label className="label-field flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Select Theme
          </label>
          <p className="text-sm text-gray-500 mb-4">Choose a predefined theme or customize colors manually</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-gray-400 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedTheme === theme.id ? {
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}10`,
                } : {}}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                  ></div>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.secondary }}
                  ></div>
                </div>
                <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            <label className="label-field flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Color
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={localPrimaryColor}
                onChange={(e) => setLocalPrimaryColor(e.target.value)}
                className="w-16 h-10 rounded border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={localPrimaryColor}
                onChange={(e) => setLocalPrimaryColor(e.target.value)}
                className="input-field flex-1"
                placeholder="#6366f1"
              />
            </div>
            <div className="mt-3 h-12 rounded-lg" style={{ backgroundColor: localPrimaryColor }}></div>
          </div>

          <div>
            <label className="label-field flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Secondary Color
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={localSecondaryColor}
                onChange={(e) => setLocalSecondaryColor(e.target.value)}
                className="w-16 h-10 rounded border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={localSecondaryColor}
                onChange={(e) => setLocalSecondaryColor(e.target.value)}
                className="input-field flex-1"
                placeholder="#8b5cf6"
              />
            </div>
            <div className="mt-3 h-12 rounded-lg" style={{ backgroundColor: localSecondaryColor }}></div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Preview</h3>
          <div className="p-6 rounded-lg border-2 border-gray-200" style={{ backgroundColor: '#f9fafb' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {localLogo && (
                  <img src={localLogo} alt="Logo" className="w-10 h-10 object-contain" />
                )}
                <span className="font-bold text-lg" style={{ color: localPrimaryColor }}>Your Organization</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: localPrimaryColor }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: localSecondaryColor }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95"
            style={{ backgroundColor: localPrimaryColor }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingPage;

