import { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, Calendar } from 'lucide-react';
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

  const handleDownload = (certificate: Certificate) => {
    // In a real app, this would download the certificate PDF
    alert(`Downloading certificate for ${certificate.courseTitle}`);
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
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Certificate
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

