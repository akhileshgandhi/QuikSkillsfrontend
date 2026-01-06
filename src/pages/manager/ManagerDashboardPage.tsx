import { useState, useEffect } from 'react';
import { Users, Award, AlertTriangle, BookOpen, TrendingUp, BarChart3, Shield, Download, Mail, Clock, Timer, Target } from 'lucide-react';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import UserProfileModal from '../../components/manager/UserProfileModal';
import TeamEnrollmentModal from '../../components/manager/TeamEnrollmentModal';
import AssessmentAuditModal from '../../components/manager/AssessmentAuditModal';
import NudgeBulkModal from '../../components/manager/NudgeBulkModal';
import AttendanceModal from '../../components/manager/AttendanceModal';

interface TeamStats {
  totalTeamMembers: number;
  averageTeamScore: number;
  overdueCourses: number;
  certificatesEarnedThisMonth: number;
  complianceRate: number;
  completionFunnel: {
    enrolled: number;
    inProgress: number;
    completed: number;
  };
  skillGapHeatmap: Array<{
    topic: string;
    courseId: string;
    failureRate: number;
    affectedLearners: number;
  }>;
  struggleHeatmap: Array<{
    moduleTitle: string;
    courseTitle: string;
    moduleId: string;
    failureRate: number;
    totalAttempts: number;
    failedAttempts: number;
  }>;
  timeToComplete: {
    averageDays: number;
    expectedDays: number;
    variance: number; // percentage difference
  };
  idleLearners: Array<{
    userId: string;
    userName: string;
    email: string;
    daysSinceLastLogin: number;
  }>;
  teamMembers: Array<{
    userId: string;
    userName: string;
    email: string;
    completionPercentage: number;
    coursesCompleted: number;
    activeCoursesCount: number;
    lastLogin?: string;
  }>;
}

// Demo data for testing purposes
const getDemoTeamStats = (): TeamStats => ({
  totalTeamMembers: 12,
  averageTeamScore: 78,
  overdueCourses: 3,
  certificatesEarnedThisMonth: 8,
  complianceRate: 85,
  completionFunnel: {
    enrolled: 45,
    inProgress: 28,
    completed: 17,
  },
  skillGapHeatmap: [
    {
      topic: 'Data Security & Privacy',
      courseId: 'sec101',
      failureRate: 65,
      affectedLearners: 8,
    },
    {
      topic: 'Compliance Regulations',
      courseId: 'comp202',
      failureRate: 45,
      affectedLearners: 5,
    },
    {
      topic: 'Advanced Excel Functions',
      courseId: 'excel301',
      failureRate: 35,
      affectedLearners: 4,
    },
    {
      topic: 'Project Management Fundamentals',
      courseId: 'pm101',
      failureRate: 25,
      affectedLearners: 3,
    },
  ],
  struggleHeatmap: [
    {
      moduleTitle: 'GDPR Compliance Basics',
      courseTitle: 'Data Security & Privacy',
      moduleId: 'mod1',
      failureRate: 72,
      totalAttempts: 25,
      failedAttempts: 18,
    },
    {
      moduleTitle: 'Encryption Standards',
      courseTitle: 'Data Security & Privacy',
      moduleId: 'mod2',
      failureRate: 68,
      totalAttempts: 22,
      failedAttempts: 15,
    },
    {
      moduleTitle: 'HIPAA Regulations',
      courseTitle: 'Compliance Regulations',
      moduleId: 'mod3',
      failureRate: 55,
      totalAttempts: 20,
      failedAttempts: 11,
    },
    {
      moduleTitle: 'VLOOKUP & Pivot Tables',
      courseTitle: 'Advanced Excel Functions',
      moduleId: 'mod4',
      failureRate: 48,
      totalAttempts: 18,
      failedAttempts: 9,
    },
    {
      moduleTitle: 'Agile Methodology',
      courseTitle: 'Project Management Fundamentals',
      moduleId: 'mod5',
      failureRate: 42,
      totalAttempts: 16,
      failedAttempts: 7,
    },
    {
      moduleTitle: 'Risk Assessment Framework',
      courseTitle: 'Compliance Regulations',
      moduleId: 'mod6',
      failureRate: 38,
      totalAttempts: 15,
      failedAttempts: 6,
    },
  ],
  timeToComplete: {
    averageDays: 12.5,
    expectedDays: 10,
    variance: 25, // 25% slower than expected
  },
  idleLearners: [
    {
      userId: 'user1',
      userName: 'John Smith',
      email: 'john.smith@company.com',
      daysSinceLastLogin: 15,
    },
    {
      userId: 'user2',
      userName: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      daysSinceLastLogin: 12,
    },
    {
      userId: 'user3',
      userName: 'Michael Chen',
      email: 'michael.chen@company.com',
      daysSinceLastLogin: 18,
    },
  ],
  teamMembers: [
    {
      userId: 'user1',
      userName: 'John Smith',
      email: 'john.smith@company.com',
      completionPercentage: 95,
      coursesCompleted: 8,
      activeCoursesCount: 9,
      lastLogin: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user2',
      userName: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      completionPercentage: 88,
      coursesCompleted: 7,
      activeCoursesCount: 8,
      lastLogin: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user3',
      userName: 'Michael Chen',
      email: 'michael.chen@company.com',
      completionPercentage: 72,
      coursesCompleted: 5,
      activeCoursesCount: 7,
      lastLogin: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user4',
      userName: 'Emily Davis',
      email: 'emily.davis@company.com',
      completionPercentage: 100,
      coursesCompleted: 10,
      activeCoursesCount: 10,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user5',
      userName: 'David Wilson',
      email: 'david.wilson@company.com',
      completionPercentage: 65,
      coursesCompleted: 4,
      activeCoursesCount: 6,
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user6',
      userName: 'Lisa Anderson',
      email: 'lisa.a@company.com',
      completionPercentage: 82,
      coursesCompleted: 6,
      activeCoursesCount: 7,
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user7',
      userName: 'Robert Taylor',
      email: 'robert.t@company.com',
      completionPercentage: 45,
      coursesCompleted: 3,
      activeCoursesCount: 5,
      lastLogin: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user8',
      userName: 'Jennifer Martinez',
      email: 'jennifer.m@company.com',
      completionPercentage: 90,
      coursesCompleted: 8,
      activeCoursesCount: 9,
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user9',
      userName: 'James Brown',
      email: 'james.brown@company.com',
      completionPercentage: 55,
      coursesCompleted: 4,
      activeCoursesCount: 6,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user10',
      userName: 'Patricia White',
      email: 'patricia.w@company.com',
      completionPercentage: 78,
      coursesCompleted: 6,
      activeCoursesCount: 8,
      lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user11',
      userName: 'Christopher Lee',
      email: 'chris.lee@company.com',
      completionPercentage: 92,
      coursesCompleted: 9,
      activeCoursesCount: 10,
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user12',
      userName: 'Amanda Garcia',
      email: 'amanda.g@company.com',
      completionPercentage: 60,
      coursesCompleted: 4,
      activeCoursesCount: 5,
      lastLogin: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
});

const ManagerDashboardPage = () => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDemoData, setUseDemoData] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);


  const loadTeamStats = async () => {
    try {
      const response = await api.get('/manager/team-stats');
      const data = response.data.data || response.data;
      // Ensure all fields have default values if missing
      if (typeof data.totalTeamMembers === 'undefined') data.totalTeamMembers = 0;
      if (typeof data.averageTeamScore === 'undefined') data.averageTeamScore = 0;
      if (typeof data.overdueCourses === 'undefined') data.overdueCourses = 0;
      if (typeof data.certificatesEarnedThisMonth === 'undefined') data.certificatesEarnedThisMonth = 0;
      if (typeof data.complianceRate === 'undefined') data.complianceRate = 0;
      
      if (!data.struggleHeatmap) {
        data.struggleHeatmap = [];
      }
      if (!data.timeToComplete) {
        data.timeToComplete = {
          averageDays: 0,
          expectedDays: 0,
          variance: 0,
        };
      }
      if (!data.idleLearners) {
        data.idleLearners = [];
      }
      if (!data.skillGapHeatmap) {
        data.skillGapHeatmap = [];
      }
      if (!data.teamMembers) {
        data.teamMembers = [];
      }
      if (!data.completionFunnel) {
        data.completionFunnel = {
          enrolled: 0,
          inProgress: 0,
          completed: 0,
        };
      }
      setStats(data);
      setUseDemoData(false);
    } catch (error) {
      console.error('Failed to load team stats:', error);
      // Use demo data on error or if API is not available
      setStats(getDemoTeamStats());
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Load demo data by default on mount to show how it looks
  useEffect(() => {
    // Set demo data immediately so user can see the UI
    setStats(getDemoTeamStats());
    setUseDemoData(true);
    setLoading(false);
    // Then try to load real data in the background
    loadTeamStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load team statistics</p>
      </div>
    );
  }

  // Prepare data for bar chart
  const chartData = (stats.teamMembers || []).map(member => ({
    name: member.userName.split(' ')[0], // First name only for chart
    completion: member.completionPercentage,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your team's learning progress and performance</p>
        </div>
        {useDemoData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Demo data displayed</span>
            </p>
          </div>
        )}
      </div>

      {/* KPI Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Team Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTeamMembers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100/80 backdrop-blur-sm flex items-center justify-center border border-blue-200/30">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.complianceRate || 0}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100/80 backdrop-blur-sm flex items-center justify-center border border-purple-200/30">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Team Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageTeamScore || 0}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100/80 backdrop-blur-sm flex items-center justify-center border border-green-200/30">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.overdueCourses || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100/80 backdrop-blur-sm flex items-center justify-center border border-red-200/30">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certificates This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.certificatesEarnedThisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100/80 backdrop-blur-sm flex items-center justify-center border border-yellow-200/30">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Time-to-Complete Metric */}
      {stats.timeToComplete && (
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100/80 backdrop-blur-sm flex items-center justify-center border border-indigo-200/30">
                <Timer className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Time-to-Complete Analysis</h2>
                <p className="text-sm text-gray-500">Average vs Expected Duration</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-lg p-4 border border-blue-100/30">
              <p className="text-sm font-medium text-gray-600 mb-1">Average Completion</p>
              <p className="text-3xl font-bold text-gray-900">{stats.timeToComplete.averageDays || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-lg p-4 border border-green-100/30">
              <p className="text-sm font-medium text-gray-600 mb-1">Expected Duration</p>
              <p className="text-3xl font-bold text-gray-900">{stats.timeToComplete.expectedDays || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className={`bg-gradient-to-br rounded-lg p-4 border ${
              (stats.timeToComplete.variance || 0) > 0 
                ? 'from-red-50/50 to-rose-50/50 border-red-100/30' 
                : 'from-green-50/50 to-emerald-50/50 border-green-100/30'
            }`}>
              <p className="text-sm font-medium text-gray-600 mb-1">Variance</p>
              <p className={`text-3xl font-bold ${
                (stats.timeToComplete.variance || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(stats.timeToComplete.variance || 0) > 0 ? '+' : ''}{stats.timeToComplete.variance || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(stats.timeToComplete.variance || 0) > 0 ? 'Slower than expected' : 'Faster than expected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Struggle Heatmap - Module-Level Failure Rates */}
      <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100/80 backdrop-blur-sm flex items-center justify-center border border-red-200/30">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Struggle Heatmap</h2>
              <p className="text-sm text-gray-500">Modules with highest failure rates across the team</p>
            </div>
          </div>
        </div>
        {stats.struggleHeatmap && stats.struggleHeatmap.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={stats.struggleHeatmap
                .sort((a, b) => b.failureRate - a.failureRate)
                .map(item => ({
                  name: item.moduleTitle.length > 25 ? item.moduleTitle.substring(0, 25) + '...' : item.moduleTitle,
                  fullName: item.moduleTitle,
                  course: item.courseTitle,
                  failureRate: item.failureRate,
                  totalAttempts: item.totalAttempts,
                  failedAttempts: item.failedAttempts,
                }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} label={{ value: 'Failure Rate (%)', position: 'insideBottom', offset: -5 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${value}% (${props.payload.failedAttempts}/${props.payload.totalAttempts} attempts)`,
                  'Failure Rate'
                ]}
                labelFormatter={(label, payload: any) => {
                  const data = payload?.[0]?.payload;
                  return (
                    <div>
                      <div className="font-semibold">{data?.fullName || label}</div>
                      <div className="text-xs text-gray-500">{data?.course}</div>
                    </div>
                  );
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              />
              <Bar 
                dataKey="failureRate" 
                name="Failure Rate"
                radius={[0, 4, 4, 0]}
              >
                {stats.struggleHeatmap
                  .sort((a, b) => b.failureRate - a.failureRate)
                  .map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        entry.failureRate >= 60
                          ? '#ef4444'
                          : entry.failureRate >= 40
                          ? '#f59e0b'
                          : '#eab308'
                      }
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No module failure data available</p>
          </div>
        )}
      </div>

      {/* Completion Funnel and Skill Gap Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Funnel Chart */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completion Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Enrolled', value: stats.completionFunnel?.enrolled || 0, fill: '#3b82f6' },
              { name: 'In Progress', value: stats.completionFunnel?.inProgress || 0, fill: '#f59e0b' },
              { name: 'Completed', value: stats.completionFunnel?.completed || 0, fill: '#10b981' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {[(stats.completionFunnel?.enrolled || 0), (stats.completionFunnel?.inProgress || 0), (stats.completionFunnel?.completed || 0)].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Gap Heatmap */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Gap Heatmap</h2>
          {stats.skillGapHeatmap && stats.skillGapHeatmap.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.skillGapHeatmap.map((gap, index) => (
                <div key={index} className="backdrop-blur-sm bg-white/50 border border-gray-200/50 rounded-lg p-3 hover:bg-white/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{gap.topic}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      gap.failureRate >= 50 ? 'bg-red-100/80 text-red-800' :
                      gap.failureRate >= 25 ? 'bg-yellow-100/80 text-yellow-800' :
                      'bg-green-100/80 text-green-800'
                    }`}>
                      {gap.failureRate}% failure
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          gap.failureRate >= 50 ? 'bg-red-500' :
                          gap.failureRate >= 25 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${gap.failureRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{gap.affectedLearners} learners</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No skill gaps identified</p>
            </div>
          )}
        </div>
      </div>

      {/* Idle Learners Widget */}
      {stats.idleLearners && stats.idleLearners.length > 0 && (
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Idle Learners</h2>
              <p className="text-sm text-gray-500">Team members inactive for 10+ days</p>
            </div>
            <button
              onClick={() => setShowNudgeModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Nudge All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.idleLearners.slice(0, 6).map((learner) => (
              <div key={learner.userId} className="backdrop-blur-sm bg-white/50 border border-gray-200/50 rounded-lg p-3 hover:bg-white/70 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{learner.userName}</p>
                    <p className="text-xs text-gray-500">{learner.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    {learner.daysSinceLastLogin} days
                  </span>
                </div>
              </div>
            ))}
          </div>
          {stats.idleLearners.length > 6 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              +{stats.idleLearners.length - 6} more idle learners
            </p>
          )}
        </div>
      )}

      {/* Team Performance Chart - Horizontal Bar Chart */}
      <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Team Completion Progress</h2>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, stats.teamMembers.length * 50)}>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value: any) => `${value}%`}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              />
              <Bar 
                dataKey="completion" 
                name="Completion %"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={
                      entry.completion >= 80
                        ? '#10b981'
                        : entry.completion >= 50
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No team members data available</p>
          </div>
        )}
      </div>

      {/* Team Members Table */}
      <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 backdrop-blur-sm bg-white/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await api.get('/manager/export-report', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `team-report-${Date.now()}.json`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) {
                  console.error('Failed to export report:', error);
                  alert('Failed to export report');
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={() => setShowEnrollmentModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Assign Team to Course
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.teamMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.completionPercentage === 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : member.completionPercentage > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Started
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedUserId(member.userId)}
                      className="text-primary-600 hover:text-primary-900 font-medium transition-colors"
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

      {/* Modals */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onResetQuiz={(courseId) => {
            loadTeamStats();
          }}
          onNudge={() => {
            loadTeamStats();
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
            loadTeamStats();
          }}
        />
      )}

      {selectedUserId && selectedCourseId && (
        <AssessmentAuditModal
          userId={selectedUserId}
          courseId={selectedCourseId}
          onClose={() => {
            setSelectedCourseId(null);
            setSelectedUserId(null);
          }}
        />
      )}

      {showNudgeModal && stats && (
        <NudgeBulkModal
          idleLearners={stats.idleLearners}
          onClose={() => setShowNudgeModal(false)}
          onSuccess={() => {
            loadTeamStats();
            setShowNudgeModal(false);
          }}
        />
      )}

      {showAttendanceModal && (
        <AttendanceModal
          teamMembers={stats.teamMembers}
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={() => {
            loadTeamStats();
            setShowAttendanceModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ManagerDashboardPage;
