import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, BookOpen, Users, AlertCircle, Clock } from 'lucide-react';
import api from '../../utils/api';

interface Course {
  _id: string;
  title: string;
  description?: string;
}

interface TeamEnrollmentModalProps {
  onClose: () => void;
  onEnrollSuccess: () => void;
}

const TeamEnrollmentModal: React.FC<TeamEnrollmentModalProps> = ({ onClose, onEnrollSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isHighPriority, setIsHighPriority] = useState(false);

  useEffect(() => {
    loadAvailableCourses();
  }, []);

  const loadAvailableCourses = async () => {
    try {
      const [coursesResponse, teamResponse] = await Promise.all([
        api.get('/manager/available-courses'),
        api.get('/manager/team-list'),
      ]);
      setCourses(coursesResponse.data.data);
      const members = teamResponse.data.data || [];
      setTeamMembers(members);
      setTeamSize(members.length);
      setSelectedUserIds(members.map((m: any) => m.userId)); // Select all by default
    } catch (error) {
      console.error('Failed to load courses:', error);
      setError('Failed to load available courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (selectedUserIds.length === 0) {
      setError('Please select at least one team member');
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      await api.post('/manager/bulk-assign', {
        courseId: selectedCourse,
        userIds: selectedUserIds,
        dueDate: dueDate || undefined,
        isMandatory: isHighPriority || isMandatory,
      });

      alert(`Course assigned to ${selectedUserIds.length} team member(s) successfully!`);
      onEnrollSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to enroll team:', err);
      setError(err.response?.data?.message || 'Failed to assign course to team');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === teamMembers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(teamMembers.map((m: any) => m.userId));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assign Team to Course</h2>
            <p className="text-sm text-gray-500 mt-1">Select a course and assign it to all team members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: Course Selection */}
              <div className="space-y-6">
                <div>
                  <label className="label-field mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Select Course *
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="input-field"
                    disabled={enrolling}
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && !loading && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          No courses available. Contact your Tenant Admin to enable courses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="label-field flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Target Completion Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-field"
                    disabled={enrolling}
                  />
                </div>

                {/* Priority Toggle */}
                <div>
                  <label className="label-field mb-2">Priority</label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHighPriority}
                      onChange={(e) => setIsHighPriority(e.target.checked)}
                      className="sr-only peer"
                      disabled={enrolling}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {isHighPriority ? 'High Priority' : 'Normal Priority'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {isHighPriority 
                      ? 'Course will appear at the top of learners\' dashboards' 
                      : 'Course will appear in normal order'}
                  </p>
                </div>

                {/* Mandatory Toggle */}
                <div>
                  <label className="label-field mb-2">Course Type</label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMandatory}
                      onChange={(e) => setIsMandatory(e.target.checked)}
                      className="sr-only peer"
                      disabled={enrolling}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {isMandatory ? 'Mandatory Course' : 'Optional Course'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Side: Team Members Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label-field">Team Members</label>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                    disabled={enrolling}
                  >
                    {selectedUserIds.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                  {teamMembers.map((member: any) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(member.userId)}
                        onChange={() => handleToggleUser(member.userId)}
                        className="w-4 h-4 text-primary-600"
                        disabled={enrolling}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      {member.activeCoursesCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {member.activeCoursesCount} active
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedUserIds.length} of {teamMembers.length} team members selected
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={enrolling}
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                className="btn-primary flex items-center gap-2"
                disabled={enrolling || !selectedCourse || selectedUserIds.length === 0}
              >
                <CheckCircle className="w-4 h-4" />
                {enrolling ? 'Assigning...' : `Assign to ${selectedUserIds.length} Member(s)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamEnrollmentModal;

