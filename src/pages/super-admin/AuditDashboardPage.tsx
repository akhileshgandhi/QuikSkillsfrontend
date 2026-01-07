import { useState, useEffect } from 'react';
import {
  BarChart3,
  HardDrive,
  TrendingUp,
  Clock,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Edit,
  RefreshCw,
} from 'lucide-react';
import UpgradeEmailTemplateEditor from '../../components/UpgradeEmailTemplateEditor';
import {
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../utils/api';

interface GlobalStorage {
  totalUsed: number;
  totalUsedMB: number;
  totalUsedGB: number;
  totalTenants: number;
}

interface EmailPreview {
  to: string;
  subject: string;
  html: string;
  tenantName: string;
  tenantId?: string;
  storagePercentage: number;
  storageUsedMB: number;
}

interface TenantStorage {
  tenantId: string;
  orgName: string;
  storageUsed: number;
  storageUsedMB: number;
  percentage: number;
  lastActivity?: string;
}

interface ActivityLog {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: {
    email?: string;
    emailStatus?: 'sent' | 'failed';
    messageId?: string;
    error?: string;
    sentAt?: string;
    failedAt?: string;
  };
  tenantId?: {
    orgName: string;
  };
  userId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AuditDashboardPage = () => {
  const [globalStorage, setGlobalStorage] = useState<GlobalStorage | null>(null);
  const [tenantStorage, setTenantStorage] = useState<TenantStorage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, any>>({});
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [globalRes, tenantsRes, logsRes] = await Promise.all([
        api.get('/audit/storage/global'),
        api.get('/audit/storage/tenants'),
        api.get('/audit/activity-logs?limit=50'),
      ]);

      setGlobalStorage(globalRes.data.data);
      setTenantStorage(tenantsRes.data.data);
      setActivityLogs(logsRes.data.data.logs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit data');
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEmail = async (tenantId: string) => {
    try {
      const response = await api.get(`/audit/upgrade-invoice/preview/${tenantId}`);
      setEmailPreview({ ...response.data.data, tenantId });
      setShowPreview(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to preview email');
    }
  };

  const handleSendUpgradeInvoice = async (tenantId: string) => {
    try {
      setSendingInvoice(tenantId);
      const response = await api.post(`/audit/upgrade-invoice/${tenantId}`);
      
      if (response.data.success) {
        alert('Upgrade email sent successfully!');
        // Reload data to get updated activity logs
        loadData();
      } else {
        alert(`Failed to send email: ${response.data.data?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send upgrade invoice');
    } finally {
      setSendingInvoice(null);
    }
  };

  const handleCheckEmailStatus = async (tenantId: string) => {
    try {
      setCheckingStatus(tenantId);
      const response = await api.get(`/audit/email-status/${tenantId}`);
      if (response.data.success) {
        setEmailStatuses((prev) => ({
          ...prev,
          [tenantId]: response.data.data,
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check email status');
    } finally {
      setCheckingStatus(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 90) return '#ef4444'; // red
    if (percentage >= 70) return '#f59e0b'; // orange
    if (percentage >= 50) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  // Prepare data for charts - show total storage across all tenants
  const gaugeData = globalStorage
    ? [
        { name: 'Total Storage Used', value: 100 }, // Show full circle for total usage
      ]
    : [];

  const topTenantsData = tenantStorage
    .slice(0, 10)
    .map((tenant) => ({
      name: tenant.orgName.length > 15 ? tenant.orgName.substring(0, 15) + '...' : tenant.orgName,
      storage: tenant.storageUsedMB,
      percentage: tenant.percentage,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Loading audit data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit & Storage Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor storage usage and activity across all tenants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Upgrade Mail Template
          </button>
          <button
            onClick={loadData}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <UpgradeEmailTemplateEditor
          onClose={() => setShowTemplateEditor(false)}
        />
      )}

      {/* Global Storage Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Global Storage Usage</h2>
            <HardDrive className="w-6 h-6 text-primary-600" />
          </div>
          {globalStorage && (
            <>
              <div className="flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {gaugeData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill="#3b82f6"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value?: number) => `${(value || 0).toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {globalStorage.totalUsedGB.toFixed(2)} GB
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Total Storage Used
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatBytes(globalStorage.totalUsed)} across {globalStorage.totalTenants} tenant{globalStorage.totalTenants !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Top Tenants Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Top 10 Tenants by Storage</h2>
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTenantsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis label={{ value: 'Storage (MB)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value?: number) => `${(value || 0).toFixed(2)} MB`}
              />
              <Bar dataKey="storage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {topTenantsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPercentageColor(entry.percentage)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tenant Storage Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tenant Storage Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Storage Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of 2GB Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenantStorage.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tenant.orgName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatBytes(tenant.storageUsed)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, tenant.percentage)}%`,
                            backgroundColor: getPercentageColor(tenant.percentage),
                          }}
                        ></div>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: getPercentageColor(tenant.percentage) }}
                      >
                        {tenant.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(tenant.lastActivity)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendUpgradeInvoice(tenant.tenantId)}
                        disabled={sendingInvoice === tenant.tenantId}
                        className="btn-primary text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingInvoice === tenant.tenantId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Upgrade
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCheckEmailStatus(tenant.tenantId)}
                        disabled={checkingStatus === tenant.tenantId}
                        className="btn-secondary text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Check Email Delivery Status"
                      >
                        {checkingStatus === tenant.tenantId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Check Status
                          </>
                        )}
                      </button>
                      {emailStatuses[tenant.tenantId] && (
                        <div className="flex items-center gap-1 text-xs">
                          {emailStatuses[tenant.tenantId].deliveryStatus === 'pending' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                              Pending
                            </span>
                          )}
                          {emailStatuses[tenant.tenantId].deliveryStatus === 'delivered' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Delivered
                            </span>
                          )}
                          {emailStatuses[tenant.tenantId].deliveryStatus === 'failed' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.message}</div>
                      {log.metadata?.emailStatus && (
                        <div className="mt-1 flex items-center gap-2">
                          {log.metadata.emailStatus === 'sent' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">Email Sent</span>
                              {log.metadata.messageId && (
                                <span className="text-xs text-gray-500">({log.metadata.messageId.substring(0, 8)}...)</span>
                              )}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span className="text-xs text-red-600">Email Failed</span>
                              {log.metadata.error && (
                                <span className="text-xs text-gray-500" title={log.metadata.error}>
                                  ({log.metadata.error.substring(0, 30)}...)
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {log.tenantId?.orgName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {log.userId
                          ? `${log.userId.firstName} ${log.userId.lastName}`
                          : 'System'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreview && emailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Preview of upgrade invoice email for {emailPreview.tenantName}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <p className="text-sm text-gray-900">{emailPreview.to}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject:</label>
                  <p className="text-sm text-gray-900">{emailPreview.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Storage Info:</label>
                  <p className="text-sm text-gray-900">
                    {emailPreview.storageUsedMB.toFixed(2)} MB ({emailPreview.storagePercentage.toFixed(1)}% of 2GB limit)
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setShowPreview(false);
                    if (emailPreview.tenantId) {
                      await handleSendUpgradeInvoice(emailPreview.tenantId);
                    }
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboardPage;

