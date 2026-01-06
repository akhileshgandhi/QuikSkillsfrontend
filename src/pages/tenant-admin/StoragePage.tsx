import { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const StoragePage = () => {
  const [storageUsage, setStorageUsage] = useState({ currentUsage: 0, storageLimit: 2 * 1024 * 1024 * 1024 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const loadStorageUsage = async () => {
    try {
      const response = await api.get('/tenants/usage');
      setStorageUsage(response.data.data);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const usagePercentage = (storageUsage.currentUsage / storageUsage.storageLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage >= 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Storage Monitor</h1>
        <p className="text-gray-600 mt-1">Monitor your organization's storage usage</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold">Storage Overview</h2>
              <p className="text-sm text-gray-500">Your 2GB storage allocation</p>
            </div>
          </div>
          {isNearLimit && !isAtLimit && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Approaching Limit</span>
            </div>
          )}
          {isAtLimit && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Storage Full</span>
            </div>
          )}
        </div>

        {/* Storage Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Used Storage</span>
            <span className="text-sm font-medium text-gray-700">
              {formatBytes(storageUsage.currentUsage)} / {formatBytes(storageUsage.storageLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isAtLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{usagePercentage.toFixed(1)}% Used</span>
            <span className="text-xs text-gray-500">
              {formatBytes(storageUsage.storageLimit - storageUsage.currentUsage)} Remaining
            </span>
          </div>
        </div>

        {/* Storage Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(storageUsage.currentUsage)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Currently Used</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(storageUsage.storageLimit)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Storage Limit</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(storageUsage.storageLimit - storageUsage.currentUsage)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Available</div>
          </div>
        </div>

        {/* Status Message */}
        {!isNearLimit && (
          <div className="mt-6 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Your storage usage is within normal limits</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoragePage;

