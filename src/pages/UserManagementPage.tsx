import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User as UserIcon, Plus } from 'lucide-react';
import api from '../utils/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  isActive: boolean;
}

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TENANT_ADMIN' | 'MANAGER' | 'LEARNER';
  tenantId?: string;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    defaultValues: {
      role: 'LEARNER',
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || []);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      if (error.response?.status === 401) {
        // 401 will be handled by API interceptor (redirect to login)
        setError('Your session has expired. Please log in again.');
      } else {
        setError(error.response?.data?.message || 'Failed to load users. Please try again.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setCreating(true);
    setError(null);

    try {
      await api.post('/auth/register', {
        ...data,
        tenantId: data.tenantId || undefined,
      });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            View and manage all users across the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <UserIcon className="w-4 h-4" />
          Create New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() =>
                      handleToggleActive(user._id, user.isActive)
                    }
                    className={`${
                      user.isActive
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New User
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-field">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className="input-field"
                  placeholder="John"
                  disabled={creating}
                />
                {errors.firstName && (
                  <p className="error-message">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="label-field">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  className="input-field"
                  placeholder="Doe"
                  disabled={creating}
                />
                {errors.lastName && (
                  <p className="error-message">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="label-field">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="input-field"
                  placeholder="user@example.com"
                  disabled={creating}
                />
                {errors.email && (
                  <p className="error-message">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label-field">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="input-field"
                  placeholder="Enter password"
                  disabled={creating}
                />
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="label-field">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="input-field"
                  disabled={creating}
                >
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="LEARNER">Learner</option>
                </select>
                {errors.role && (
                  <p className="error-message">{errors.role.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                    setError(null);
                  }}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;

