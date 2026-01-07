import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Download, Copy, CheckCircle, Calendar, 
  ExternalLink, ArrowLeft, Share2, Trophy, FileText, AlertCircle
} from 'lucide-react';
import api from '../../utils/api';

interface Certificate {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    description?: string;
  };
  certificateId: string;
  issuedAt: string;
  pdfUrl?: string;
  verificationUrl?: string;
  thumbnail?: string;
}

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await api.get('/certificates/my-certificates');
      setCertificates(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load certificates:', error);
      setError(error.response?.data?.message || 'Failed to load certificates');
      // Demo data for testing
      setCertificates([
        {
          _id: 'cert1',
          courseId: { _id: 'course1', title: 'Data Security & Privacy' },
          certificateId: 'CERT-2024-001',
          issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          verificationUrl: `${window.location.origin}/verify-certificate/CERT-2024-001`,
        },
        {
          _id: 'cert2',
          courseId: { _id: 'course2', title: 'Compliance Regulations' },
          certificateId: 'CERT-2024-002',
          issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          verificationUrl: `${window.location.origin}/verify-certificate/CERT-2024-002`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    if (!certificate.pdfUrl && !certificate._id) {
      alert('Certificate download not available');
      return;
    }

    setDownloading(prev => ({ ...prev, [certificate._id]: true }));

    try {
      let downloadUrl = certificate.pdfUrl;

      // If no direct URL, get pre-signed URL from backend
      if (!downloadUrl) {
        const response = await api.get(`/certificates/${certificate._id}/download-url`);
        downloadUrl = response.data.data.url;
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl || '';
      link.download = `${certificate.courseId.title}_Certificate.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [certificate._id]: false }));
    }
  };

  const handleCopyVerificationLink = async (certificate: Certificate) => {
    const verificationUrl = certificate.verificationUrl || 
      `${window.location.origin}/verify-certificate/${certificate.certificateId}`;

    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopiedId(certificate._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = verificationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(certificate._id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShareLinkedIn = (certificate: Certificate) => {
    const verificationUrl = certificate.verificationUrl || 
      `${window.location.origin}/verify-certificate/${certificate.certificateId}`;
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/learner/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-primary-600 p-2 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Certificates & Achievements</h1>
                <p className="text-xs text-gray-500">Your learning accomplishments</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {certificates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-500 mb-6">
              Complete courses and pass assessments to earn certificates.
            </p>
            <button
              onClick={() => navigate('/learner/dashboard')}
              className="btn-primary"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-100 text-sm mb-1">Total Certificates</p>
                    <p className="text-4xl font-bold">{certificates.length}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <Award className="w-12 h-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Gallery */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <div
                    key={certificate._id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
                  >
                    {/* Certificate Thumbnail/Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                      {certificate.thumbnail ? (
                        <img
                          src={certificate.thumbnail}
                          alt={certificate.courseId.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-600 font-medium">Certificate</p>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </div>
                    </div>

                    {/* Certificate Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {certificate.courseId.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Earned: {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span className="font-mono text-xs">ID: {certificate.certificateId}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleDownload(certificate)}
                          disabled={downloading[certificate._id]}
                          className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                          {downloading[certificate._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download PDF
                            </>
                          )}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCopyVerificationLink(certificate)}
                            className={`btn-secondary text-sm flex items-center justify-center gap-2 ${
                              copiedId === certificate._id ? 'bg-green-100 border-green-500 text-green-700' : ''
                            }`}
                          >
                            {copiedId === certificate._id ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleShareLinkedIn(certificate)}
                            className="btn-secondary text-sm flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>

                        {certificate.verificationUrl && (
                          <a
                            href={certificate.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Verify Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;

