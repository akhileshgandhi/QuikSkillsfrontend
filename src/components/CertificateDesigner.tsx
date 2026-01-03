import { useState, useRef, useEffect } from 'react';
import { X, Upload, Save, Eye, Move, Type, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';

interface CertificateDesignerProps {
  certificateId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TextPlacement {
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

const CertificateDesigner: React.FC<CertificateDesignerProps> = ({
  certificateId,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const [designation, setDesignation] = useState('');
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [textPlacements, setTextPlacements] = useState<{
    userName?: TextPlacement;
    courseName?: TextPlacement;
    date?: TextPlacement;
    designation?: TextPlacement;
  }>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Fetch available designations from tenants
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const response = await api.get('/tenants');
        const tenants = response.data.data || [];
        const roles = new Set<string>();
        tenants.forEach((tenant: any) => {
          if (tenant.contactRoleInOrganization) {
            roles.add(tenant.contactRoleInOrganization);
          }
        });
        setAvailableDesignations(Array.from(roles));
      } catch (error) {
        console.error('Failed to fetch designations:', error);
      }
    };
    fetchDesignations();
  }, []);

  // Load certificate if editing
  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const loadCertificate = async () => {
    try {
      const response = await api.get(`/certificates/${certificateId}`);
      const cert = response.data.data;
      setName(cert.name);
      setBackgroundImageUrl(cert.backgroundImageUrl);
      setSignatureImageUrl(cert.signatureImageUrl);
      setDesignation(cert.designation || '');
      setTextPlacements(cert.textPlacements || {});
    } catch (error) {
      console.error('Failed to load certificate:', error);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/certificates/upload-background', formData);
      setBackgroundImageUrl(response.data.data.url);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload background image');
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/certificates/upload-signature', formData);
      setSignatureImageUrl(response.data.data.url);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload signature image');
    }
  };

  const handleTextPlacementChange = (field: string, property: string, value: number | string) => {
    setTextPlacements((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] || { x: 50, y: 50, fontSize: 20, color: '#000000' }),
        [property]: value,
      },
    }));
  };

  const handleDragStart = (field: string) => {
    setDragging(field);
  };

  const handleDrag = (e: React.MouseEvent, field: string) => {
    if (!dragging || dragging !== field || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTextPlacements((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] || { x: 50, y: 50, fontSize: 20, color: '#000000' }),
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      },
    }));
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !backgroundImageUrl) {
      alert('Please provide a name and upload a background image');
      return;
    }

    try {
      setSaving(true);
      const data = {
        name,
        backgroundImageUrl,
        signatureImageUrl,
        designation,
        textPlacements,
      };

      if (certificateId) {
        await api.put(`/certificates/${certificateId}`, data);
      } else {
        await api.post('/certificates', data);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save certificate template');
    } finally {
      setSaving(false);
    }
  };

  const renderTextOverlay = (field: string, label: string, defaultPlacement: TextPlacement) => {
    const placement = textPlacements[field as keyof typeof textPlacements] || defaultPlacement;
    const isDragging = dragging === field;

    return (
      <div
        className={`absolute cursor-move ${isDragging ? 'z-50' : 'z-10'}`}
        style={{
          left: `${placement.x}%`,
          top: `${placement.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${placement.fontSize}px`,
          color: placement.color,
          fontWeight: field === 'userName' ? 'bold' : 'normal',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          handleDragStart(field);
        }}
        onMouseMove={(e) => handleDrag(e, field)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="flex items-center gap-2 bg-white/90 px-2 py-1 rounded border border-gray-300">
          <Move className="w-4 h-4 text-gray-500" />
          <span>{label === 'User Name' ? '{{User_Name}}' : label === 'Course Name' ? '{{Course_Name}}' : label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {certificateId ? 'Edit Certificate Template' : 'Create Certificate Template'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Design your certificate template</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Template Name */}
              <div>
                <label className="label-field">Template Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Course Completion Certificate"
                />
              </div>

              {/* Background Image */}
              <div>
                <label className="label-field">Background Image (JPG/PNG) *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  {backgroundImageUrl ? (
                    <div className="space-y-2">
                      <img src={backgroundImageUrl} alt="Background" className="w-full h-32 object-cover rounded" />
                      <button
                        onClick={() => backgroundInputRef.current?.click()}
                        className="btn-secondary text-sm"
                      >
                        Change Background
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => backgroundInputRef.current?.click()}
                      className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Background
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Image */}
              <div>
                <label className="label-field">Signature Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  {signatureImageUrl ? (
                    <div className="space-y-2">
                      <img src={signatureImageUrl} alt="Signature" className="w-full h-32 object-contain rounded" />
                      <button
                        onClick={() => signatureInputRef.current?.click()}
                        className="btn-secondary text-sm"
                      >
                        Change Signature
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => signatureInputRef.current?.click()}
                      className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Signature
                    </button>
                  )}
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="label-field">Designation</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Designation</option>
                  {availableDesignations.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Fetched from Tenant "Role in Organization"
                </p>
              </div>

              {/* Text Placement Controls */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Text Placement</h3>
                
                {['userName', 'courseName', 'date'].map((field) => {
                  const placement = textPlacements[field as keyof typeof textPlacements] || {
                    x: 50,
                    y: field === 'userName' ? 40 : field === 'courseName' ? 50 : 60,
                    fontSize: field === 'userName' ? 24 : 20,
                    color: '#000000',
                  };
                  const labels: { [key: string]: string } = {
                    userName: 'User Name',
                    courseName: 'Course Name',
                    date: 'Date',
                  };

                  return (
                    <div key={field} className="border border-gray-200 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-700">{labels[field]}</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-xs text-gray-500">X (%)</label>
                          <input
                            type="number"
                            value={placement.x}
                            onChange={(e) => handleTextPlacementChange(field, 'x', Number(e.target.value))}
                            className="input-field text-sm"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Y (%)</label>
                          <input
                            type="number"
                            value={placement.y}
                            onChange={(e) => handleTextPlacementChange(field, 'y', Number(e.target.value))}
                            className="input-field text-sm"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Font Size</label>
                          <input
                            type="number"
                            value={placement.fontSize}
                            onChange={(e) => handleTextPlacementChange(field, 'fontSize', Number(e.target.value))}
                            className="input-field text-sm"
                            min="10"
                            max="72"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Color</label>
                          <input
                            type="color"
                            value={placement.color}
                            onChange={(e) => handleTextPlacementChange(field, 'color', e.target.value)}
                            className="input-field text-sm h-8"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim() || !backgroundImageUrl}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Template
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Canvas Preview */}
            <div className="lg:col-span-2">
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Certificate Preview</h3>
                <div
                  ref={canvasRef}
                  className="relative bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{
                    aspectRatio: '11.69 / 8.27', // A4 Landscape
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                  }}
                  onMouseMove={(e) => {
                    if (dragging) {
                      handleDrag(e, dragging);
                    }
                  }}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {backgroundImageUrl && (
                    <img
                      src={backgroundImageUrl}
                      alt="Certificate Background"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {!previewMode && (
                    <>
                      {renderTextOverlay('userName', 'User Name', { x: 50, y: 40, fontSize: 24, color: '#000000' })}
                      {renderTextOverlay('courseName', 'Course Name', { x: 50, y: 50, fontSize: 20, color: '#000000' })}
                      {renderTextOverlay('date', 'Date', { x: 50, y: 60, fontSize: 16, color: '#666666' })}
                    </>
                  )}

                  {previewMode && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <div
                        style={{
                          fontSize: `${textPlacements.userName?.fontSize || 24}px`,
                          color: textPlacements.userName?.color || '#000000',
                          fontWeight: 'bold',
                          position: 'absolute',
                          left: `${textPlacements.userName?.x || 50}%`,
                          top: `${textPlacements.userName?.y || 40}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        John Doe
                      </div>
                      <div
                        style={{
                          fontSize: `${textPlacements.courseName?.fontSize || 20}px`,
                          color: textPlacements.courseName?.color || '#000000',
                          position: 'absolute',
                          left: `${textPlacements.courseName?.x || 50}%`,
                          top: `${textPlacements.courseName?.y || 50}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        Advanced React Development
                      </div>
                      <div
                        style={{
                          fontSize: `${textPlacements.date?.fontSize || 16}px`,
                          color: textPlacements.date?.color || '#666666',
                          position: 'absolute',
                          left: `${textPlacements.date?.x || 50}%`,
                          top: `${textPlacements.date?.y || 60}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  )}

                  {signatureImageUrl && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center">
                      <img src={signatureImageUrl} alt="Signature" className="h-16 mx-auto mb-2" />
                      {designation && <div className="text-sm font-medium">{designation}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigner;

