import { useState, useEffect, useRef } from 'react';
import { Upload, Download, Users as UsersIcon, Plus, X, CheckCircle, AlertCircle, Table2, LayoutGrid, Search, MoreVertical, ArrowUpDown } from 'lucide-react';
import api from '../../utils/api';
import { useForm } from 'react-hook-form';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'LEARNER' | 'MANAGER';
}

type ViewMode = 'table' | 'card';

const LearnersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'LEARNER',
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (showCreateModal) {
      reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'LEARNER',
      });
      setError(null);
    }
  }, [showCreateModal, reset]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // For now, parse CSV and create users individually
      // In production, you'd have a backend endpoint for bulk upload
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const emailIndex = headers.indexOf('email');
      const firstNameIndex = headers.indexOf('firstname') !== -1 ? headers.indexOf('firstname') : headers.indexOf('first name');
      const lastNameIndex = headers.indexOf('lastname') !== -1 ? headers.indexOf('lastname') : headers.indexOf('last name');
      const roleIndex = headers.indexOf('role');

      if (emailIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
        throw new Error('CSV must contain: email, firstname (or first name), lastname (or last name)');
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        try {
          await api.post('/auth/register', {
            email: values[emailIndex],
            password: 'TempPassword123!', // Default password - users should change
            firstName: values[firstNameIndex],
            lastName: values[lastNameIndex],
            role: values[roleIndex]?.toUpperCase() === 'MANAGER' ? 'MANAGER' : 'LEARNER',
          });
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to create user ${values[emailIndex]}:`, err);
        }
      }

      alert(`Bulk upload completed: ${successCount} successful, ${errorCount} failed`);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setCreating(true);
    setError(null);

    try {
      await api.post('/auth/register', data);
      setShowCreateModal(false);
      reset();
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}/toggle-active`, {
        isActive: !currentStatus,
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'email,firstname,lastname,role\njohn.doe@example.com,John,Doe,LEARNER\njane.smith@example.com,Jane,Smith,MANAGER';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learners_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(u => {
    if (u.role !== 'LEARNER' && u.role !== 'MANAGER') return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u._id));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learner Management</h1>
          <p className="text-gray-600 mt-1">Manage and bulk upload learners</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadTemplate}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>
          <label className="btn-primary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Bulk Upload CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Learner
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search learners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded transition-all ${
              viewMode === 'table'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Table View"
          >
            <Table2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded transition-all ${
              viewMode === 'card'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-lg shadow p-5 border border-gray-200 hover:shadow-md transition-all"
            >
              {/* Avatar and Name Section */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-base mb-1">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                </div>
              </div>

              {/* Role and Status */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.role === 'MANAGER' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleToggleActive(user._id, user.isActive)}
                className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors pt-2 border-t border-gray-100"
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No learners found
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    Email
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No learners found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <UsersIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(user._id, user.isActive)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selectedUsers.length > 0 && (
          <div className="bg-primary-50 border-t border-primary-200 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedUsers.length} learner(s) selected
            </span>
            <div className="flex gap-2">
              <button className="text-sm font-medium text-primary-600 hover:text-primary-800">
                Bulk Actions
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Learner</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-field">Email *</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input-field"
                  autoComplete="new-password"
                  placeholder="Enter email address"
                />
                {errors.email && <p className="error-message">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label-field">Password *</label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required', minLength: 6 })}
                  className="input-field"
                  autoComplete="new-password"
                  placeholder="Enter password"
                />
                {errors.password && <p className="error-message">{errors.password.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">First Name *</label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    className="input-field"
                  />
                  {errors.firstName && <p className="error-message">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="label-field">Last Name *</label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    className="input-field"
                  />
                  {errors.lastName && <p className="error-message">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="label-field">Role *</label>
                <select {...register('role')} className="input-field">
                  <option value="LEARNER">Learner</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                    setError(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating...' : 'Create Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnersPage;

