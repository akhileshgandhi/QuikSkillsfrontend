import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Mail, CheckCircle, AlertTriangle, Clock, TrendingUp, Award, Plus } from 'lucide-react';
import api from '../../utils/api';
import UserProfileModal from '../../components/manager/UserProfileModal';
import TeamEnrollmentModal from '../../components/manager/TeamEnrollmentModal';
import AssessmentAuditModal from '../../components/manager/AssessmentAuditModal';
import NudgeBulkModal from '../../components/manager/NudgeBulkModal';
import CongratulateModal from '../../components/manager/CongratulateModal';

interface TeamMember {
  userId: string;
  userName: string;
  email: string;
  completionPercentage: number;
  coursesCompleted: number;
  activeCoursesCount: number;
  lastLogin?: string;
  status: 'on-track' | 'at-risk' | 'stuck' | 'completed';
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  stuckCount: number;
}

const MyTeamPage = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [showCongratulateModal, setShowCongratulateModal] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'courses' | 'assessments' | 'communication'>('overview');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const response = await api.get('/manager/team-stats');
      const data = response.data.data;

      // Process team members with status
      const members: TeamMember[] = (data.teamMembers || []).map((member: any) => {
        let status: 'on-track' | 'at-risk' | 'stuck' | 'completed' = 'on-track';
        if (member.completionPercentage >= 100) {
          status = 'completed';
        } else if (member.completionPercentage === 0) {
          status = 'stuck'; // Treat not started as stuck for now
        } else if (member.completionPercentage < 30) {
          status = 'stuck';
        } else if (member.completionPercentage < 70) {
          status = 'at-risk';
        }

        return {
          ...member,
          status,
        };
      });

      setTeamMembers(members);

      // Generate course progress data (demo data for now)
      const courses: CourseProgress[] = [
        {
          courseId: 'course1',
          courseTitle: 'Data Security & Privacy',
          totalAssigned: 12,
          completed: 3,
          inProgress: 6,
          notStarted: 2,
          stuckCount: 1,
        },
        {
          courseId: 'course2',
          courseTitle: 'Compliance Regulations',
          totalAssigned: 12,
          completed: 5,
          inProgress: 4,
          notStarted: 2,
          stuckCount: 1,
        },
        {
          courseId: 'course3',
          courseTitle: 'Advanced Excel Functions',
          totalAssigned: 8,
          completed: 2,
          inProgress: 4,
          notStarted: 1,
          stuckCount: 1,
        },
      ];
      setCourseProgress(courses);
    } catch (error) {
      console.error('Failed to load team data:', error);
      // Use demo data
      setTeamMembers([
        {
          userId: 'user1',
          userName: 'John Smith',
          email: 'john.smith@company.com',
          completionPercentage: 95,
          coursesCompleted: 8,
          activeCoursesCount: 9,
          lastLogin: new Date().toISOString(),
          status: 'completed',
        },
        {
          userId: 'user2',
          userName: 'Sarah Johnson',
          email: 'sarah.j@company.com',
          completionPercentage: 45,
          coursesCompleted: 3,
          activeCoursesCount: 6,
          lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'stuck',
        },
        {
          userId: 'user3',
          userName: 'Michael Chen',
          email: 'michael.chen@company.com',
          completionPercentage: 72,
          coursesCompleted: 5,
          activeCoursesCount: 7,
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'at-risk',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-track':
        return 'bg-blue-100 text-blue-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'stuck':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'on-track':
        return <TrendingUp className="w-4 h-4" />;
      case 'at-risk':
        return <AlertTriangle className="w-4 h-4" />;
      case 'stuck':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your team's learning progress</p>
        </div>
        <button
          onClick={() => setShowEnrollmentModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Course to Team
        </button>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Team Overview', icon: Users },
            { id: 'courses', label: 'Course Monitoring', icon: BookOpen },
            { id: 'assessments', label: 'Assessment Review', icon: FileText },
            { id: 'communication', label: 'Team Communication', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeView === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Team Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Team Members</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{teamMembers.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100/80 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Track</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {teamMembers.filter(m => m.status === 'on-track' || m.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100/80 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {teamMembers.filter(m => m.status === 'at-risk').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100/80 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stuck</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {teamMembers.filter(m => m.status === 'stuck').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100/80 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Table */}
          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {getStatusIcon(member.status)}
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                member.completionPercentage >= 80
                                  ? 'bg-green-500'
                                  : member.completionPercentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${member.completionPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{member.completionPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.coursesCompleted} / {member.activeCoursesCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUserId(member.userId)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Course Monitoring */}
      {activeView === 'courses' && (
        <div className="space-y-6">
          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Progress Tracking</h2>
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <div key={course.courseId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.courseTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">Total Assigned: {course.totalAssigned} members</p>
                    </div>
                    {course.stuckCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {course.stuckCount} Stuck
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-lg font-semibold text-green-600">{course.completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">In Progress</p>
                      <p className="text-lg font-semibold text-blue-600">{course.inProgress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Not Started</p>
                      <p className="text-lg font-semibold text-gray-600">{course.notStarted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stuck</p>
                      <p className="text-lg font-semibold text-red-600">{course.stuckCount}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(course.completed / course.totalAssigned) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Review */}
      {activeView === 'assessments' && (
        <div className="space-y-6">
          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Attempts & Results</h2>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.userId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.userName}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUserId(member.userId);
                        setSelectedCourseId('course1');
                      }}
                      className="btn-secondary text-sm"
                    >
                      View Quiz Details
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Click "View Quiz Details" to see individual quiz attempts and question-level breakdowns
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Communication */}
      {activeView === 'communication' && (
        <div className="space-y-6">
          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowNudgeModal(true)}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Send Nudge</h3>
                  <p className="text-sm text-gray-500">Remind team members to complete their courses</p>
                </div>
              </button>
              <button
                onClick={() => setShowCongratulateModal(true)}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Award className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Congratulate</h3>
                  <p className="text-sm text-gray-500">Send congratulations to team members who completed courses</p>
                </div>
              </button>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{member.userName}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.href = `mailto:${member.email}`}
                      className="btn-secondary text-sm"
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setSelectedUserId(member.userId)}
                      className="btn-secondary text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setSelectedUserId(null);
            setSelectedCourseId(null);
          }}
          onResetQuiz={(courseId) => {
            loadTeamData();
          }}
          onNudge={() => {
            loadTeamData();
          }}
          onViewResults={(courseId) => {
            setSelectedCourseId(courseId);
          }}
        />
      )}

      {showEnrollmentModal && (
        <TeamEnrollmentModal
          onClose={() => setShowEnrollmentModal(false)}
          onEnrollSuccess={() => {
            loadTeamData();
          }}
        />
      )}

      {selectedUserId && selectedCourseId && (
        <AssessmentAuditModal
          userId={selectedUserId}
          courseId={selectedCourseId}
          onClose={() => {
            setSelectedCourseId(null);
          }}
        />
      )}

      {showNudgeModal && (
        <NudgeBulkModal
          idleLearners={teamMembers.map(m => ({
            userId: m.userId,
            userName: m.userName,
            email: m.email,
            daysSinceLastLogin: m.lastLogin ? Math.floor((Date.now() - new Date(m.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          }))}
          onClose={() => setShowNudgeModal(false)}
          onSuccess={() => {
            loadTeamData();
            setShowNudgeModal(false);
          }}
        />
      )}

      {showCongratulateModal && (
        <CongratulateModal
          teamMembers={teamMembers.map(m => ({
            userId: m.userId,
            userName: m.userName,
            email: m.email,
            completionPercentage: m.completionPercentage,
            coursesCompleted: m.coursesCompleted,
          }))}
          onClose={() => setShowCongratulateModal(false)}
          onSuccess={() => {
            loadTeamData();
            setShowCongratulateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MyTeamPage;

