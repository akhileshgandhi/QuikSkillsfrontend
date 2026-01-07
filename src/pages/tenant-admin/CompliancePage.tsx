import { useState, useEffect } from 'react';
import { FileCheck, Mail, AlertCircle, Trophy, BookOpen, Clock, User as UserIcon, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../utils/api';

interface CompletionRates {
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface TopPerformer {
  userId: string;
  userName: string;
  email: string;
  coursesCompleted: number;
  averageScore: number;
}

interface DifficultModule {
  courseId: string;
  courseTitle: string;
  averageScore: number;
  totalAttempts: number;
}

interface OverdueCourse {
  courseId: string;
  courseTitle: string;
  dueDate: string;
  daysOverdue: number;
}

interface NudgeUser {
  userId: string;
  userName: string;
  email: string;
  reason: 'no_login' | 'overdue_course';
  daysSinceLastLogin?: number;
  overdueCourses?: OverdueCourse[];
}

const CompliancePage = () => {
  const [loading, setLoading] = useState(true);
  const [completionRates, setCompletionRates] = useState<CompletionRates>({ completed: 0, inProgress: 0, notStarted: 0 });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [difficultModules, setDifficultModules] = useState<DifficultModule[]>([]);
  const [nudgeUsers, setNudgeUsers] = useState<NudgeUser[]>([]);
  const [sendingNudges, setSendingNudges] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, nudgeResponse] = await Promise.all([
        api.get('/compliance/analytics'),
        api.get('/compliance/nudge-users'),
      ]);

      if (analyticsResponse.data.success) {
        setCompletionRates(analyticsResponse.data.data.completionRates);
        setTopPerformers(analyticsResponse.data.data.topPerformers);
        setDifficultModules(analyticsResponse.data.data.difficultModules);
      }

      if (nudgeResponse.data.success) {
        setNudgeUsers(nudgeResponse.data.data.users);
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNudgeAll = async () => {
    if (nudgeUsers.length === 0) {
      alert('No users to nudge');
      return;
    }

    if (!confirm(`Send reminder emails to ${nudgeUsers.length} users?`)) {
      return;
    }

    try {
      setSendingNudges(true);
      const response = await api.post('/compliance/nudge-all', {
        userIds: nudgeUsers.map(u => u.userId),
      });

      if (response.data.success) {
        alert(`Successfully sent reminder emails to ${response.data.data.sentCount} users!`);
        // Optionally reload data
        await loadComplianceData();
      }
    } catch (error: any) {
      console.error('Failed to send nudge emails:', error);
      alert(error.response?.data?.message || 'Failed to send reminder emails');
    } finally {
      setSendingNudges(false);
    }
  };

  // Prepare data for pie chart
  const pieChartData = [
    { name: 'Completed', value: completionRates.completed, color: '#10b981' },
    { name: 'In Progress', value: completionRates.inProgress, color: '#f59e0b' },
    { name: 'Not Started', value: completionRates.notStarted, color: '#ef4444' },
  ];

  const total = completionRates.completed + completionRates.inProgress + completionRates.notStarted;
  const completionPercentage = total > 0 ? ((completionRates.completed / total) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Analytics</h1>
        <p className="text-gray-600 mt-1">Track course completion rates and identify learners who need support</p>
      </div>

      {/* Completion Rates Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Course Completion Rates
            </h2>
            <p className="text-sm text-gray-500 mt-1">Overall organization completion status</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">{completionPercentage}%</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center space-y-4">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">
                    {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers and Difficult Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h2>
          {topPerformers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No performance data available</div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{performer.userName}</div>
                      <div className="text-sm text-gray-500">{performer.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{performer.coursesCompleted} courses</div>
                    <div className="text-sm text-gray-500">{performer.averageScore.toFixed(1)}% avg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Difficult Modules */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-red-500" />
            Most Difficult Modules
          </h2>
          {difficultModules.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No module data available</div>
          ) : (
            <div className="space-y-3">
              {difficultModules.map((module) => (
                <div key={module.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{module.courseTitle}</div>
                    <div className="text-sm text-gray-500">{module.totalAttempts} attempts</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-red-600">{module.averageScore.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">avg score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nudge Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Nudge Learners
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Users who haven't logged in for 7+ days or have overdue courses
            </p>
          </div>
          <button
            onClick={handleNudgeAll}
            disabled={nudgeUsers.length === 0 || sendingNudges}
            className="btn-primary flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sendingNudges ? 'Sending...' : `Nudge All (${nudgeUsers.length})`}
          </button>
        </div>

        {nudgeUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p>No users need nudging at this time!</p>
            <p className="text-sm mt-1">All learners are up to date.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nudgeUsers.map((user) => (
              <div key={user.userId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{user.userName}</span>
                        <span className="text-sm text-gray-500">({user.email})</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.reason === 'no_login' && user.daysSinceLastLogin && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            No login for {user.daysSinceLastLogin} days
                          </span>
                        )}
                        {user.overdueCourses && user.overdueCourses.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {user.overdueCourses.length} overdue course{user.overdueCourses.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {user.overdueCourses && user.overdueCourses.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {user.overdueCourses.map((course, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              <span>{course.courseTitle}</span>
                              <span className="text-red-600 font-medium">({course.daysOverdue} days overdue)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompliancePage;
