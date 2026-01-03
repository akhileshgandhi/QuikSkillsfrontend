import { useState, useEffect } from 'react';
import { Activity, Pause, Play, Users, BookOpen, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';

interface Tenant {
  _id: string;
  orgName: string;
  subdomain: string;
  status: string;
  createdAt: string;
}

const SystemHealthPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    pausedTenants: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants');
      const tenantsData = response.data.data || [];
      setTenants(tenantsData);
      
      // Calculate stats
      setStats({
        totalTenants: tenantsData.length,
        activeTenants: tenantsData.filter((t: Tenant) => t.status === 'Active').length,
        pausedTenants: tenantsData.filter((t: Tenant) => t.status === 'Paused').length,
        totalUsers: 0, // Would need to fetch from users collection
      });
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (tenantId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      await api.patch(`/tenants/${tenantId}`, { status: newStatus });
      loadTenants();
    } catch (error) {
      console.error('Failed to update tenant status:', error);
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
      {/* Premium Header with Health Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-10 text-white">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="relative flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight">System Health</h1>
            <p className="text-emerald-100 text-lg font-light">
              Real-time monitoring and management dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Premium Health Metrics Cards - Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl shadow-xl p-8 text-white overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative flex items-center justify-between mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-8 h-8" />
            </div>
            <TrendingUp className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-blue-100 text-sm font-semibold mb-2 uppercase tracking-wide">Total Tenants</p>
          <p className="text-4xl font-extrabold mb-1">{stats.totalTenants}</p>
        </div>

        <div className="group relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 text-white overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative flex items-center justify-between mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <Play className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-green-100 text-sm font-semibold mb-2 uppercase tracking-wide">Active</p>
          <p className="text-4xl font-extrabold mb-2">{stats.activeTenants}</p>
          <p className="text-green-100 text-sm font-medium">
            {stats.totalTenants > 0 ? Math.round((stats.activeTenants / stats.totalTenants) * 100) : 0}% of total
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-3xl shadow-xl p-8 text-white overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative flex items-center justify-between mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <AlertCircle className="w-8 h-8" />
            </div>
            <Pause className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-orange-100 text-sm font-semibold mb-2 uppercase tracking-wide">Paused</p>
          <p className="text-4xl font-extrabold mb-2">{stats.pausedTenants}</p>
          <p className="text-orange-100 text-sm font-medium">
            {stats.totalTenants > 0 ? Math.round((stats.pausedTenants / stats.totalTenants) * 100) : 0}% of total
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-purple-500 via-indigo-600 to-violet-600 rounded-3xl shadow-xl p-8 text-white overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative flex items-center justify-between mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8" />
            </div>
            <TrendingUp className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-purple-100 text-sm font-semibold mb-2 uppercase tracking-wide">Total Users</p>
          <p className="text-4xl font-extrabold">{stats.totalUsers || 'N/A'}</p>
        </div>
      </div>

      {/* Premium Health Status Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-8 py-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            Tenant Health Status
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Health Status
                </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No tenants found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-emerald-50/30 transition-all duration-300 group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={`relative w-4 h-4 rounded-full ${
                          tenant.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {tenant.status === 'Active' && (
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                          )}
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {tenant.orgName}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {tenant.subdomain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm text-gray-700 font-mono bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 group-hover:bg-gray-100 transition-colors">
                        {tenant.subdomain}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {tenant.status === 'Active' ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold shadow-sm">
                              Healthy
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-6 h-6 text-orange-500" />
                            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-bold shadow-sm">
                              Paused
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <Clock className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{formatLastActive(tenant.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePause(tenant._id, tenant.status)}
                        className={`group/btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 ${
                          tenant.status === 'Active'
                            ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 border border-orange-200'
                            : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 border border-green-200'
                        }`}
                      >
                        {tenant.status === 'Active' ? (
                          <>
                            <Pause className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                            Pause Access
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                            Resume Access
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;

