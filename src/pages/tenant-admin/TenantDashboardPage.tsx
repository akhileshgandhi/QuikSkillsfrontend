import { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, FileCheck, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';

interface DashboardStats {
  totalLearners: number;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  notStartedCourses: number;
  overdueCourses: number;
  completionRate: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TenantDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLearners: 0,
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    overdueCourses: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [courseProgressData, setCourseProgressData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load users and calculate stats
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/courses').catch(() => ({ data: { data: [] } })),
      ]);

      const users = usersRes.data.data || [];
      const courses = coursesRes.data.data || [];
      const learners = users.filter((u: any) => u.role === 'LEARNER' || u.role === 'MANAGER');

      // Calculate statistics (placeholder - replace with actual API endpoint when available)
      const totalLearners = learners.length;
      const totalCourses = courses.length;
      
      // Placeholder calculations - in production, get from API
      const completedCourses = Math.floor(totalCourses * 0.4);
      const inProgressCourses = Math.floor(totalCourses * 0.3);
      const notStartedCourses = totalCourses - completedCourses - inProgressCourses;
      const overdueCourses = Math.floor(notStartedCourses * 0.2);
      const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

      setStats({
        totalLearners,
        totalCourses,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        overdueCourses,
        completionRate: Math.round(completionRate),
      });

      // Course progress data for chart
      setCourseProgressData([
        { name: 'Completed', value: completedCourses },
        { name: 'In Progress', value: inProgressCourses },
        { name: 'Not Started', value: notStartedCourses },
      ]);

      // Status distribution for pie chart
      setStatusDistribution([
        { name: 'Completed', value: completedCourses, color: '#10b981' },
        { name: 'In Progress', value: inProgressCourses, color: '#3b82f6' },
        { name: 'Not Started', value: notStartedCourses, color: '#6b7280' },
        { name: 'Overdue', value: overdueCourses, color: '#ef4444' },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your learning management system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Learners</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLearners}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedCourses}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgressCourses}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Not Started</p>
              <p className="text-2xl font-bold text-gray-900">{stats.notStartedCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/tenant-dashboard/learners"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Manage Learners</p>
          </a>
          <a
            href="/tenant-dashboard/courses"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Assign Courses</p>
          </a>
          <a
            href="/tenant-dashboard/compliance"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <FileCheck className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Compliance</p>
          </a>
          <a
            href="/tenant-dashboard/branding"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Branding</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboardPage;
