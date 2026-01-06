import { useState } from 'react';
import { X, Mail, Send } from 'lucide-react';
import api from '../../utils/api';

interface IdleLearner {
  userId: string;
  userName: string;
  email: string;
  daysSinceLastLogin: number;
}

interface NudgeBulkModalProps {
  idleLearners: IdleLearner[];
  onClose: () => void;
  onSuccess: () => void;
}

const NudgeBulkModal: React.FC<NudgeBulkModalProps> = ({ idleLearners, onClose, onSuccess }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(idleLearners.map(l => l.userId));
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageTemplates = [
    'Hi team, just a reminder to finish your training by Friday!',
    'Friendly reminder: Please complete your assigned courses this week.',
    'Your training deadline is approaching. Let\'s finish strong!',
    'Quick check-in: How are you progressing with your courses?',
  ];

  const handleSelectAll = () => {
    if (selectedUserIds.length === idleLearners.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(idleLearners.map(l => l.userId));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNudge = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one team member');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await api.post('/manager/nudge-bulk', {
        userIds: selectedUserIds,
        message: customMessage || messageTemplates[0],
      });

      alert(`Nudge sent to ${selectedUserIds.length} team member(s) successfully!`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send nudge');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Send Nudge</h2>
            <p className="text-sm text-gray-500 mt-1">Send reminders to team members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Team Members Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Select Team Members</label>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedUserIds.length === idleLearners.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {idleLearners.map((learner) => (
              <label
                key={learner.userId}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(learner.userId)}
                  onChange={() => handleToggleUser(learner.userId)}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{learner.userName}</p>
                  <p className="text-xs text-gray-500">{learner.email}</p>
                </div>
                <span className="text-xs text-red-600 font-medium">
                  {learner.daysSinceLastLogin} days idle
                </span>
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
                    ? 'border-primary-600 bg-primary-50'
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
            placeholder="Or write your own message..."
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
            onClick={handleSendNudge}
            disabled={sending || selectedUserIds.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : `Send to ${selectedUserIds.length} Member(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NudgeBulkModal;

