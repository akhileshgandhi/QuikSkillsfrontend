import { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, Calendar, X } from 'lucide-react';
import api from '../../utils/api';

interface Certificate {
  certificateId: string;
  courseTitle: string;
  courseDescription: string;
  issuedDate: string;
  certificateUrl?: string;
  score?: number;
}

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      // In a real app, this would fetch manager's certificates
      // For now, using demo data
      const demoCertificates: Certificate[] = [
        {
          certificateId: 'cert1',
          courseTitle: 'Performance Management',
          courseDescription: 'Master the art of managing team performance',
          issuedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          score: 92,
        },
        {
          certificateId: 'cert2',
          courseTitle: 'Leadership Fundamentals',
          courseDescription: 'Learn essential leadership skills and management techniques',
          issuedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          score: 88,
        },
      ];
      setCertificates(demoCertificates);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    setDownloading(prev => ({ ...prev, [certificate.certificateId]: true }));

    try {
      let downloadUrl = certificate.certificateUrl;

      // If no direct URL, try to get from backend
      if (!downloadUrl) {
        try {
          // Try to get download URL from backend
          const response = await api.get(`/certificates/${certificate.certificateId}/download-url`);
          downloadUrl = response.data.data.url;
        } catch (error) {
          // If backend endpoint doesn't exist, show notification
          setNotification({
            type: 'error',
            message: 'Certificate download is not available at this time.',
          });
          setTimeout(() => setNotification(null), 5000);
          return;
        }
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl || '#';
      link.download = `${certificate.courseTitle}_Certificate.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success notification
      setNotification({
        type: 'success',
        message: `Downloading certificate for ${certificate.courseTitle}...`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Failed to download certificate:', error);
      setNotification({
        type: 'error',
        message: 'Failed to download certificate. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDownloading(prev => ({ ...prev, [certificate.certificateId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        } min-w-[300px] max-w-md animate-slide-in`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600 mt-1">Your earned certificates and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => (
          <div key={certificate.certificateId} className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">{certificate.courseTitle}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{certificate.courseDescription}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Issued: {new Date(certificate.issuedDate).toLocaleDateString()}</span>
              </div>
              {certificate.score && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Final Score: {certificate.score}%</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDownload(certificate)}
              disabled={downloading[certificate.certificateId]}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading[certificate.certificateId] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Certificate
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No certificates earned yet</p>
          <p className="text-sm mt-2">Complete courses to earn certificates</p>
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;

