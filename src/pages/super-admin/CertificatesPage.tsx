import { useState, useEffect } from 'react';
import { Award, Plus, Edit, Trash2, Eye } from 'lucide-react';
import CertificateDesigner from '../../components/CertificateDesigner';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import api from '../../utils/api';

interface Certificate {
  _id: string;
  name: string;
  backgroundImageUrl: string;
  signatureImageUrl?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
}

const CertificatesPage = () => {
  const [showDesigner, setShowDesigner] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<string | undefined>(undefined);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certificates');
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCertificate(undefined);
    setShowDesigner(true);
  };

  const handleEdit = (id: string) => {
    setEditingCertificate(id);
    setShowDesigner(true);
  };

  const handleDeleteClick = (certificate: Certificate) => {
    setCertificateToDelete(certificate);
  };

  const handleDeleteConfirm = async () => {
    if (!certificateToDelete) return;
    
    try {
      setDeleting(certificateToDelete._id);
      await api.delete(`/certificates/${certificateToDelete._id}`);
      setCertificateToDelete(null);
      loadCertificates();
    } catch (error) {
      console.error('Failed to delete certificate:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setCertificateToDelete(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">
            Design and manage certificate templates for course completions
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Design New Template
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Certificate Templates Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create beautiful certificate templates that will be awarded to
              learners upon course completion. Design your first template now.
            </p>
            <button
              onClick={handleCreate}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Design New Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {cert.backgroundImageUrl && (
                <img
                  src={cert.backgroundImageUrl}
                  alt={cert.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cert.name}</h3>
                {cert.designation && (
                  <p className="text-sm text-gray-600 mb-4">Designation: {cert.designation}</p>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      cert.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(cert._id)}
                    className="btn-secondary flex-1 text-sm inline-flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cert)}
                    disabled={deleting === cert._id}
                    className="btn-secondary text-sm inline-flex items-center justify-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === cert._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Designer Modal */}
      {showDesigner && (
        <CertificateDesigner
          certificateId={editingCertificate}
          onClose={() => {
            setShowDesigner(false);
            setEditingCertificate(undefined);
          }}
          onSuccess={() => {
            setShowDesigner(false);
            setEditingCertificate(undefined);
            loadCertificates();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {certificateToDelete && (
        <DeleteConfirmationModal
          isOpen={!!certificateToDelete}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Certificate Template"
          message="Are you sure you want to delete this certificate template?"
          itemName={certificateToDelete.name}
          isLoading={deleting === certificateToDelete._id}
        />
      )}
    </div>
  );
};

export default CertificatesPage;

