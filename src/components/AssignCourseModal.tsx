import { useState, useEffect } from 'react';
import { X, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AssignCourseModalProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignCourseModal = ({ courseId, courseTitle, isOpen, onClose, onSuccess }: AssignCourseModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<'USER' | 'GROUP'>('USER');
  const [dueDate, setDueDate] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset form
      setSelectedUsers([]);
      setDueDate('');
      setIsMandatory(false);
      setError(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const allUsers = response.data.data || [];
      setUsers(allUsers.filter((u: User) => u.role === 'LEARNER' || u.role === 'MANAGER'));
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await api.post('/course-assignments/assign', {
        courseId,
        targetType,
        targetIds: selectedUsers,
        dueDate: dueDate || undefined,
        isMandatory,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to assign course:', error);
      setError(error.response?.data?.message || 'Failed to assign course');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Course</h2>
            <p className="text-sm text-gray-600 mt-1">{courseTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setTargetType('USER');
                  setSelectedUsers([]);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  targetType === 'USER'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Specific Users</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('GROUP');
                  setSelectedUsers([]);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  targetType === 'GROUP'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Groups</span>
                <span className="text-xs text-gray-500 block mt-1">(Coming Soon)</span>
              </button>
            </div>
          </div>

          {/* User Selection */}
          {targetType === 'USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users ({selectedUsers.length} selected)
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No users available</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleUserSelection(user._id)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            selectedUsers.includes(user._id) ? 'bg-primary-50' : ''
                          }`}
                        >
                          {selectedUsers.includes(user._id) ? (
                            <CheckCircle className="w-5 h-5 text-primary-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              The date by which the certificate must be earned
            </p>
          </div>

          {/* Mandatory Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">Mark as Mandatory</div>
                <div className="text-xs text-gray-500">
                  If enabled, this course will appear in the learner's 'Required' section
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={assigning || selectedUsers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assigning...
              </>
            ) : (
              <>
                Assign to {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCourseModal;

