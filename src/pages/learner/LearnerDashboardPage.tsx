import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Clock, CheckCircle, AlertCircle, Award, Play, 
  Download, Filter, Search, TrendingUp, Star, Lock, Unlock,
  ChevronRight, Calendar, Target, Trophy, Bookmark
} from 'lucide-react';
import api from '../../utils/api';

interface CourseAssignment {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    description?: string;
    thumbnail?: string;
  };
  dueDate?: string;
  isMandatory: boolean;
  assignedAt: string;
}

interface Progress {
  courseId: string;
  completionPercentage: number;
  status: string;
  quizScore?: number;
  isPassed: boolean;
  completedAt?: string;
  lastAccessedAt?: string;
  currentModuleId?: string;
}

interface Certificate {
  _id: string;
  courseId: {
    _id: string;
    title: string;
  };
  certificateId: string;
  issuedAt: string;
  pdfUrl?: string;
  verificationUrl?: string;
}

const LearnerDashboardPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'required' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadMyCourses(),
        loadCertificates(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCourses = async () => {
    try {
      const assignmentsResponse = await api.get('/course-assignments/my-assignments');
      const assignmentsData = assignmentsResponse.data.data || [];
      
      const validAssignments = assignmentsData.filter(
        (assignment: any) => assignment.courseId && assignment.courseId._id
      );
      setAssignments(validAssignments);

      // Load progress for each course
      const progressPromises = validAssignments.map(async (assignment: CourseAssignment) => {
        try {
          const progressResponse = await api.get(`/progress/${assignment.courseId._id}`);
          return {
            courseId: assignment.courseId._id,
            progress: progressResponse.data.data,
          };
        } catch (error) {
          return {
            courseId: assignment.courseId._id,
            progress: null,
          };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMapData: Record<string, Progress> = {};
      progressResults.forEach(({ courseId, progress }) => {
        if (progress) {
          progressMapData[courseId] = {
            courseId: progress.courseId,
            completionPercentage: progress.completionPercentage || 0,
            status: progress.status || 'Not Started',
            quizScore: progress.quizScore,
            isPassed: progress.isPassed || false,
            completedAt: progress.completedAt,
            lastAccessedAt: progress.updatedAt || progress.createdAt,
            currentModuleId: progress.currentModuleId,
          };
        } else {
          progressMapData[courseId] = {
            courseId,
            completionPercentage: 0,
            status: 'Not Started',
            isPassed: false,
          };
        }
      });
      setProgressMap(progressMapData);
    } catch (error) {
      console.error('Failed to load courses:', error);
      // Use demo data on error
      loadDemoData();
    }
  };

  const loadCertificates = async () => {
    try {
      const response = await api.get('/certificates/my-certificates');
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      // Demo certificates
      setCertificates([
        {
          _id: 'cert1',
          courseId: { _id: 'course2', title: 'Compliance Regulations' },
          certificateId: 'CERT-2024-001',
          issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    }
  };

  const loadDemoData = () => {
    const demoAssignments: CourseAssignment[] = [
      {
        _id: 'assign1',
        courseId: {
          _id: 'course1',
          title: 'Data Security & Privacy',
          description: 'Learn about GDPR, encryption, and data breach response protocols',
          thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        },
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: true,
        assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'assign2',
        courseId: {
          _id: 'course2',
          title: 'Compliance Regulations',
          description: 'HIPAA and risk assessment frameworks for healthcare compliance',
          thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
        },
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: true,
        assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'assign3',
        courseId: {
          _id: 'course3',
          title: 'Advanced Excel Functions',
          description: 'Master VLOOKUP, Pivot Tables, and advanced formulas',
          thumbnail: 'https://images.unsplash.com/photo-1587825147138-44c9c4e0d0e0?w=400',
        },
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: false,
        assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setAssignments(demoAssignments);

    const demoProgress: Record<string, Progress> = {
      course1: {
        courseId: 'course1',
        completionPercentage: 60,
        status: 'In Progress',
        quizScore: 52,
        isPassed: false,
        lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      course2: {
        courseId: 'course2',
        completionPercentage: 100,
        status: 'Completed',
        quizScore: 78,
        isPassed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      course3: {
        courseId: 'course3',
        completionPercentage: 48,
        status: 'In Progress',
        isPassed: false,
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    setProgressMap(demoProgress);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get the last accessed course for "Continue Learning"
  const getContinueLearningCourse = () => {
    const coursesWithProgress = assignments
      .map(assignment => ({
        assignment,
        progress: progressMap[assignment.courseId._id],
      }))
      .filter(({ progress }) => progress && progress.completionPercentage < 100 && progress.lastAccessedAt)
      .sort((a, b) => {
        const timeA = new Date(a.progress?.lastAccessedAt || 0).getTime();
        const timeB = new Date(b.progress?.lastAccessedAt || 0).getTime();
        return timeB - timeA;
      });

    return coursesWithProgress[0];
  };

  // Filter courses
  const getFilteredCourses = () => {
    let filtered = assignments;

    // Apply filter
    if (activeFilter === 'required') {
      filtered = filtered.filter(a => a.isMandatory);
    } else if (activeFilter === 'in-progress') {
      filtered = filtered.filter(a => {
        const progress = progressMap[a.courseId._id];
        return progress && progress.completionPercentage > 0 && progress.completionPercentage < 100;
      });
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(a => {
        const progress = progressMap[a.courseId._id];
        return progress && progress.completionPercentage >= 100;
      });
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.courseId.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: string, completionPercentage: number) => {
    if (status === 'Completed' || completionPercentage >= 100) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    } else if (status === 'In Progress' || completionPercentage > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Started
        </span>
      );
    }
  };

  const isOverdue = (dueDate?: string, completionPercentage: number) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && completionPercentage < 100;
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const continueLearning = getContinueLearningCourse();
  const filteredCourses = getFilteredCourses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Learning</h1>
                <p className="text-xs text-gray-500">Continue your journey</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <button
                onClick={() => navigate('/learner/certificates')}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                Certificates
              </button>
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Continue Learning Hero */}
        {continueLearning && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-white/90" />
                      <span className="text-sm font-medium text-white/90 uppercase tracking-wide">
                        Continue Learning
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                      {continueLearning.assignment.courseId.title}
                    </h2>
                    <p className="text-white/90 mb-4 max-w-2xl">
                      {continueLearning.assignment.courseId.description || 'Pick up where you left off'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="flex items-center gap-2 text-white/90">
                        <div className="w-32 bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all"
                            style={{ width: `${continueLearning.progress?.completionPercentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {continueLearning.progress?.completionPercentage || 0}%
                        </span>
                      </div>
                      {continueLearning.assignment.dueDate && (
                        <div className="flex items-center gap-2 text-white/90">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Due in {getDaysUntilDue(continueLearning.assignment.dueDate)} days
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/learner/course/${continueLearning.assignment.courseId._id}`)}
                      className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Play className="w-5 h-5" />
                      Resume Learning
                    </button>
                  </div>
                  {continueLearning.assignment.courseId.thumbnail && (
                    <div className="hidden md:block">
                      <img
                        src={continueLearning.assignment.courseId.thumbnail}
                        alt={continueLearning.assignment.courseId.title}
                        className="w-48 h-32 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => {
                    const p = progressMap[a.courseId._id];
                    return p && p.completionPercentage > 0 && p.completionPercentage < 100;
                  }).length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => {
                    const p = progressMap[a.courseId._id];
                    return p && p.completionPercentage >= 100;
                  }).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Course Library Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Course Library</h2>
              <p className="text-gray-600">Browse and continue your courses</p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {/* Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    activeFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('required')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    activeFilter === 'required'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Required
                </button>
                <button
                  onClick={() => setActiveFilter('in-progress')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    activeFilter === 'in-progress'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    activeFilter === 'completed'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Your manager will assign courses to you soon.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((assignment) => {
                const progress = progressMap[assignment.courseId._id] || {
                  courseId: assignment.courseId._id,
                  completionPercentage: 0,
                  status: 'Not Started',
                  isPassed: false,
                };
                const overdue = isOverdue(assignment.dueDate, progress.completionPercentage);
                const daysUntilDue = getDaysUntilDue(assignment.dueDate);

                return (
                  <div
                    key={assignment._id}
                    className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border ${
                      overdue ? 'border-red-300' : 'border-gray-100'
                    } group cursor-pointer`}
                    onClick={() => navigate(`/learner/course/${assignment.courseId._id}`)}
                  >
                    {/* Thumbnail */}
                    {assignment.courseId.thumbnail ? (
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                        <img
                          src={assignment.courseId.thumbnail}
                          alt={assignment.courseId.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between text-white">
                            {getStatusBadge(progress.status, progress.completionPercentage)}
                            {progress.completionPercentage >= 100 && (
                              <Award className="w-5 h-5 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary-600" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                          {assignment.courseId.title}
                        </h3>
                      </div>

                      {assignment.isMandatory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mb-2">
                          <Target className="w-3 h-3 mr-1" />
                          Mandatory
                        </span>
                      )}

                      {assignment.courseId.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {assignment.courseId.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Progress</span>
                          <span className="text-xs font-medium text-gray-700">
                            {progress.completionPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress.completionPercentage >= 100
                                ? 'bg-green-500'
                                : progress.completionPercentage >= 50
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${progress.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                        {progress.quizScore !== undefined && progress.quizScore !== null && (
                          <span className={`font-medium ${
                            progress.isPassed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Quiz: {progress.quizScore}%
                          </span>
                        )}
                        {assignment.dueDate && (
                          <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                            {overdue ? 'Overdue' : `Due in ${daysUntilDue} days`}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/learner/course/${assignment.courseId._id}`);
                        }}
                        className="btn-primary w-full flex items-center justify-center gap-2 group-hover:bg-primary-700"
                      >
                        <Play className="w-4 h-4" />
                        {progress.completionPercentage >= 100 ? 'Review Course' : 'Continue Learning'}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievement Gallery */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Achievement Gallery</h2>
              <p className="text-gray-600">Your earned certificates and achievements</p>
            </div>
            {certificates.length > 0 && (
              <button
                onClick={() => navigate('/learner/certificates')}
                className="btn-secondary flex items-center gap-2"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.slice(0, 3).map((certificate) => (
                <div
                  key={certificate._id}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 border border-yellow-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate('/learner/certificates')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Trophy className="w-8 h-8 text-yellow-600" />
                    </div>
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {certificate.courseId.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Certificate ID: {certificate.certificateId}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {certificate.pdfUrl && (
                      <a
                        href={certificate.pdfUrl}
                        download
                        className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    {certificate.verificationUrl && (
                      <a
                        href={certificate.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Verify
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No certificates earned yet. Complete courses to earn certificates!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboardPage;
