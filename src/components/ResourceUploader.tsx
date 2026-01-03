import { useState, useRef } from 'react';
import * as tus from 'tus-js-client';
import api from '../utils/api';

interface ResourceUploaderProps {
  moduleId: string;
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ResourceUploader: React.FC<ResourceUploaderProps> = ({
  moduleId,
  courseId,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Video' | 'PDF' | 'PPT' | 'SCORM' | 'Text'>('Video');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (5GB max)
      if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
        setError('File size exceeds 5GB limit');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please provide a title and select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // For TUS upload, we'll use a simplified approach
      // In production, you'd set up a TUS server endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('type', type);
      formData.append('moduleId', moduleId);
      formData.append('courseId', courseId);

      // Use tus-js-client for resumable uploads
      const upload = new tus.Upload(file, {
        endpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
          title,
          type,
          moduleId,
          courseId,
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setError(`Upload failed: ${error.message}`);
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          setProgress(percentage);
        },
        onSuccess: async () => {
          // Get the file URL from the upload
          const fileUrl = upload.url;
          
          // Create lesson record
          try {
            await api.post('/courses/lessons', {
              moduleId,
              title,
              type,
              contentUrl: fileUrl,
              orderIndex: 0, // Will be updated by backend
            });

            setUploading(false);
            setProgress(100);
            onSuccess();
          } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create lesson');
            setUploading(false);
          }
        },
      });

      uploadRef.current = upload;

      // Check if there's a previous upload to resume
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
    }
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-field">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Enter lesson title"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="label-field">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="input-field"
                disabled={uploading}
              >
                <option value="Video">Video (MP4)</option>
                <option value="PDF">PDF</option>
                <option value="PPT">PowerPoint</option>
                <option value="SCORM">SCORM Package</option>
                <option value="Text">Text Content</option>
              </select>
            </div>

            <div>
              <label className="label-field">
                File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="input-field"
                accept={
                  type === 'Video'
                    ? 'video/*'
                    : type === 'PDF'
                    ? 'application/pdf'
                    : type === 'PPT'
                    ? 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    : type === 'SCORM'
                    ? 'application/zip'
                    : '*'
                }
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  Upload is resumable. You can close this window and resume later.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={uploading ? handleCancel : handleUpload}
                disabled={!file || !title.trim()}
                className="btn-primary flex-1"
              >
                {uploading ? 'Cancel Upload' : 'Upload & Create Lesson'}
              </button>
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceUploader;

