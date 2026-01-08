import { useState } from 'react';
import { X, Award, Send } from 'lucide-react';
import api from '../../utils/api';

interface TeamMember {
  userId: string;
  userName: string;
  email: string;
  completionPercentage: number;
  coursesCompleted: number;
}

interface CongratulateModalProps {
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

const CongratulateModal: React.FC<CongratulateModalProps> = ({ teamMembers, onClose, onSuccess }) => {
  // Filter to only show members who have completed courses
  const eligibleMembers = teamMembers.filter(m => m.coursesCompleted > 0);
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageTemplates = [
    'Congratulations on completing your courses! Your dedication to learning is inspiring.',
    'Well done! Your commitment to professional development is truly commendable.',
    'Fantastic work! Your course completion shows great initiative and dedication.',
    'Congratulations! Your learning achievements are impressive. Keep up the excellent work!',
  ];

  const handleSelectAll = () => {
    if (selectedUserIds.length === eligibleMembers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(eligibleMembers.map(m => m.userId));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendCongratulation = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one team member to congratulate');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // await api.post('/manager/congratulate', {
      //   userIds: selectedUserIds,
      //   message: customMessage || messageTemplates[0],
      // });

      // For now, just show success message
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send congratulations');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Congratulate Team Members</h2>
              <p className="text-sm text-gray-500 mt-1">Send congratulations to team members who completed courses</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {eligibleMembers.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No team members have completed courses yet.</p>
            <p className="text-sm text-gray-500">Select team members to congratulate once they complete their courses.</p>
            <button
              onClick={onClose}
              className="mt-6 btn-secondary"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Team Members Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Select Team Members</label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {selectedUserIds.length === eligibleMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {eligibleMembers.map((member) => (
                  <label
                    key={member.userId}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(member.userId)}
                      onChange={() => handleToggleUser(member.userId)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-green-600">
                        {member.coursesCompleted} course{member.coursesCompleted !== 1 ? 's' : ''} completed
                      </span>
                      <p className="text-xs text-gray-500">{member.completionPercentage}% overall</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Message Templates */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Message Template</label>
              <div className="space-y-2">
                {messageTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setCustomMessage(template)}
                    className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                      customMessage === template
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm text-gray-700">{template}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Message (Optional)</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Or write your own congratulation message..."
              />
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
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendCongratulation}
                disabled={sending || selectedUserIds.length === 0}
                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : `Send to ${selectedUserIds.length} Member(s)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CongratulateModal;

