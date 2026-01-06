import { useState } from 'react';
import { X, CheckCircle, Calendar } from 'lucide-react';
import api from '../../utils/api';

interface TeamMember {
  userId: string;
  userName: string;
  email: string;
}

interface AttendanceModalProps {
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ teamMembers, onClose, onSuccess }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(teamMembers.map(m => m.userId));
  const [sessionId, setSessionId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedUserIds.length === teamMembers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(teamMembers.map(m => m.userId));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleMarkAttendance = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one team member');
      return;
    }
    if (!sessionId.trim()) {
      setError('Please enter a session ID or name');
      return;
    }

    setMarking(true);
    setError(null);

    try {
      await api.post('/manager/attendance', {
        userIds: selectedUserIds,
        sessionId: sessionId.trim(),
        sessionDate: sessionDate,
        notes: notes.trim() || undefined,
      });

      alert(`Attendance marked for ${selectedUserIds.length} team member(s) successfully!`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-500 mt-1">Record attendance for offline/virtual sessions</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Session Details */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="label-field mb-2">Session ID / Name *</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="input-field"
              placeholder="e.g., Security Training Session 2026"
              disabled={marking}
            />
          </div>
          <div>
            <label className="label-field flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Session Date *
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input-field"
              disabled={marking}
            />
          </div>
          <div>
            <label className="label-field mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Additional notes about the session..."
              disabled={marking}
            />
          </div>
        </div>

        {/* Team Members Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Select Present Team Members</label>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
              disabled={marking}
            >
              {selectedUserIds.length === teamMembers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
            {teamMembers.map((member) => (
              <label
                key={member.userId}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(member.userId)}
                  onChange={() => handleToggleUser(member.userId)}
                  className="w-4 h-4 text-primary-600"
                  disabled={marking}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                {selectedUserIds.includes(member.userId) && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedUserIds.length} of {teamMembers.length} team members selected
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={marking}
          >
            Cancel
          </button>
          <button
            onClick={handleMarkAttendance}
            disabled={marking || selectedUserIds.length === 0 || !sessionId.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {marking ? 'Marking...' : `Mark ${selectedUserIds.length} as Present`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;

