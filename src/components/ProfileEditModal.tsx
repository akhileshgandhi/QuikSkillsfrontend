import { useState, useEffect, useRef } from 'react';
import { X, User, Upload, Camera } from 'lucide-react';
import api from '../utils/api';

interface ProfileEditModalProps {
  user: {
    id?: string;
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(user.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setProfilePicture(user.profilePicture || '');
    setPreview(user.profilePicture || null);
  }, [user]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get presigned URL for profile picture upload
      const presignedResponse = await api.post('/auth/profile/presigned-url', null, {
        headers: {
          'x-file-name': file.name,
          'x-file-type': file.type,
          'x-file-size': file.size.toString(),
        },
      });

      const { uploadUrl, publicUrl } = presignedResponse.data.data;

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      setProfilePicture(publicUrl);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
      setPreview(user.profilePicture || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log('Updating profile with:', { firstName, lastName, profilePicture });
      // Use PATCH for partial updates (more RESTful)
      const response = await api.patch('/auth/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePicture: profilePicture || undefined,
      });
      console.log('Profile update response:', response.data);

      if (response.data.success) {
        // Update local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          firstName: response.data.data.firstName,
          lastName: response.data.data.lastName,
          profilePicture: response.data.data.profilePicture,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          (err.response?.status === 404 ? 'Profile update endpoint not found. Please restart the backend server.' : 'Failed to update profile. Please try again.');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update your profile information</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Picture */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                  <User className="w-12 h-12 text-primary-600" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 5MB)</p>
            </div>
          </div>
        </div>

        {/* First Name */}
        <div className="mb-4">
          <label htmlFor="firstName" className="label-field">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-field"
            placeholder="Enter your first name"
            disabled={saving}
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <label htmlFor="lastName" className="label-field">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input-field"
            placeholder="Enter your last name"
            disabled={saving}
          />
        </div>

        {/* Email (read-only) */}
        <div className="mb-6">
          <label htmlFor="email" className="label-field">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            className="input-field bg-gray-100 cursor-not-allowed"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !firstName.trim() || !lastName.trim()}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;

