import { useState, useEffect } from 'react';
import { Building2, Plus, Search, ExternalLink, Pause, Play, FileText, MapPin, Mail, Globe, HardDrive, Calendar } from 'lucide-react';
import TenantOnboardingWizard from '../../components/TenantOnboardingWizard';
import WelcomeKitEditor from '../../components/WelcomeKitEditor';
import api from '../../utils/api';

interface Tenant {
  _id: string;
  orgName: string;
  subdomain: string;
  status: string;
  country: string;
  officialEmail: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  storageLimit: number;
  createdAt: string;
  loginUrl?: string;
}

const OrganizationsPage = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [showWelcomeKitEditor, setShowWelcomeKitEditor] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants');
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      await api.patch(`/tenants/${tenantId}`, { status: newStatus });
      loadTenants(); // Reload list
    } catch (error) {
      console.error('Failed to update tenant status:', error);
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
    <div className="space-y-8 pb-12">
      {/* Premium Header with Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl p-10 text-white">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight">Organizations</h1>
            <p className="text-indigo-100 text-lg font-light">
              Manage tenant organizations and company portals
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowWelcomeKitEditor(true)}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-medium inline-flex items-center gap-2 transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 hover:shadow-xl"
            >
              <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
              Add Welcome Kit
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="group bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-2xl font-semibold inline-flex items-center gap-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              Onboard New Tenant
            </button>
          </div>
        </div>
      </div>

      {/* Premium Search Bar */}
      {tenants.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors" />
            <input
              type="text"
              placeholder="Search organizations by name, subdomain, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-gray-700 placeholder-gray-400 bg-gray-50/50 hover:bg-white hover:border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Premium Organizations Grid - Card Layout */}
      {filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant._id}
              className="group relative bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2"
            >
              {/* Premium Card Header with Gradient */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{tenant.orgName}</h3>
                      <p className="text-indigo-100 text-sm font-medium">{tenant.subdomain}</p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transition-all duration-300 ${
                      tenant.status === 'Active'
                        ? 'bg-green-500/90 text-white group-hover:bg-green-400'
                        : 'bg-orange-500/90 text-white group-hover:bg-orange-400'
                    }`}
                  >
                    {tenant.status}
                  </span>
                </div>
              </div>

              {/* Premium Card Body with Generous Spacing */}
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover/item:bg-indigo-100 transition-colors duration-300">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="truncate font-medium">{tenant.officialEmail}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover/item:bg-indigo-100 transition-colors duration-300">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-medium">{tenant.country}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover/item:bg-indigo-100 transition-colors duration-300">
                      <HardDrive className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-medium">{tenant.storageLimit} GB Storage</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover/item:bg-indigo-100 transition-colors duration-300">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-medium">Joined {new Date(tenant.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Primary Contact</div>
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    {tenant.contactFirstName} {tenant.contactLastName}
                  </div>
                  <div className="text-sm text-gray-500">{tenant.contactEmail}</div>
                </div>
              </div>

              {/* Premium Card Footer */}
              <div className="px-8 py-6 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 flex items-center justify-between">
                {tenant.loginUrl && (
                  <a
                    href={tenant.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-2 font-semibold transition-all duration-300 hover:gap-3"
                  >
                    <ExternalLink className="w-4 h-4 transition-transform hover:scale-125" />
                    View Portal
                  </a>
                )}
                <button
                  onClick={() => handleToggleStatus(tenant._id, tenant.status)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 ${
                    tenant.status === 'Active'
                      ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 border border-orange-200'
                      : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 border border-green-200'
                  }`}
                >
                  {tenant.status === 'Active' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        /* Premium Empty State */
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
              <Building2 className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Organizations Yet
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Get started by creating your first organization. Each organization
              will have its own isolated portal and tenant space.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold inline-flex items-center gap-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              Onboard New Tenant
            </button>
          </div>
        </div>
      ) : (
        /* Premium No Search Results */
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-16">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">
              No organizations found matching <span className="font-semibold text-gray-900">"{searchQuery}"</span>
            </p>
          </div>
        </div>
      )}

      {/* Tenant Onboarding Wizard */}
      {showWizard && (
        <TenantOnboardingWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false);
            loadTenants(); // Reload the list after successful onboarding
          }}
        />
      )}

      {/* Welcome Kit Editor */}
      {showWelcomeKitEditor && (
        <WelcomeKitEditor
          onClose={() => setShowWelcomeKitEditor(false)}
          onSuccess={() => {
            // Refresh or show success message
          }}
        />
      )}
    </div>
  );
};

export default OrganizationsPage;

