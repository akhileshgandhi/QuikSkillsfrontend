import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, RotateCcw, Mail, BookOpen, MessageCircle, FileText, Award, Lock, Calendar, Play, Pause, Video, FileCheck, Zap } from 'lucide-react';
import api from '../../utils/api';

interface Course {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  completionPercentage: number;
  status: string;
  quizScore?: number;
  isPassed: boolean;
  dueDate?: string;
  isMandatory: boolean;
  startedAt?: string;
  completedAt?: string;
}

interface TimelineEvent {
  type: string;
  timestamp: string;
  title: string;
  description: string;
  courseId?: string;
  courseTitle?: string;
  completionPercentage?: number;
  moduleTitle?: string;
  assessmentId?: string;
  assessmentTitle?: string;
  score?: number;
  isPassed?: boolean;
}

interface ResourceBreakdown {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  orderIndex: number;
  timeSpent: number;
  videoWatchPercentage?: number;
  completionPercentage: number;
  status: string;
  hasAssessment: boolean;
}

interface QuizAnalytics {
  courseId: string;
  courseTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  lastAttemptDate: string;
  lastScore: number;
  isPassed: boolean;
  incorrectQuestions: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

interface UserDetails {
  userId: string;
  userName: string;
  email: string;
  lastLogin?: string;
  courses: Course[];
  timeline?: TimelineEvent[];
  resourceBreakdown?: ResourceBreakdown[];
  quizAnalytics?: QuizAnalytics[];
}

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  onResetQuiz: (courseId: string) => void;
  onNudge: () => void;
  onViewResults?: (courseId: string) => void;
}

// Demo data generator
const getDemoLearnerDetail = (userId: string): UserDetails => {
  const now = new Date();
  const timeline: TimelineEvent[] = [
    {
      type: 'course_assigned',
      timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Assigned to: Data Security & Privacy',
      description: 'Course assigned by Manager',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
    },
    {
      type: 'course_started',
      timestamp: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Started: Data Security & Privacy',
      description: 'Started course',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      completionPercentage: 0,
    },
    {
      type: 'progress_updated',
      timestamp: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Progress: Data Security & Privacy',
      description: '25% complete',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      completionPercentage: 25,
      moduleTitle: 'GDPR Compliance Basics',
    },
    {
      type: 'quiz_failed',
      timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Failed Quiz: GDPR Compliance Assessment',
      description: 'Score: 45%',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      assessmentId: 'quiz1',
      assessmentTitle: 'GDPR Compliance Assessment',
      score: 45,
      isPassed: false,
    },
    {
      type: 'progress_updated',
      timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Progress: Data Security & Privacy',
      description: '60% complete',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      completionPercentage: 60,
      moduleTitle: 'Encryption Standards',
    },
    {
      type: 'quiz_failed',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Failed Quiz: GDPR Compliance Assessment',
      description: 'Score: 52%',
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      assessmentId: 'quiz1',
      assessmentTitle: 'GDPR Compliance Assessment',
      score: 52,
      isPassed: false,
    },
    {
      type: 'course_assigned',
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Assigned to: Compliance Regulations',
      description: 'Course assigned by Manager',
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
    },
    {
      type: 'course_started',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Started: Compliance Regulations',
      description: 'Started course',
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      completionPercentage: 0,
    },
    {
      type: 'progress_updated',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Progress: Compliance Regulations',
      description: '40% complete',
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      completionPercentage: 40,
      moduleTitle: 'HIPAA Regulations',
    },
    {
      type: 'quiz_passed',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Passed Quiz: HIPAA Compliance Test',
      description: 'Score: 78%',
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      assessmentId: 'quiz2',
      assessmentTitle: 'HIPAA Compliance Test',
      score: 78,
      isPassed: true,
    },
    {
      type: 'course_completed',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Completed: Compliance Regulations',
      description: 'Course completed',
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
    },
  ];

  const resourceBreakdown: ResourceBreakdown[] = [
    {
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      moduleId: 'mod1',
      moduleTitle: 'GDPR Compliance Basics',
      orderIndex: 1,
      timeSpent: 45,
      videoWatchPercentage: 65,
      completionPercentage: 65,
      status: 'In Progress',
      hasAssessment: true,
    },
    {
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      moduleId: 'mod2',
      moduleTitle: 'Encryption Standards',
      orderIndex: 2,
      timeSpent: 38,
      videoWatchPercentage: 55,
      completionPercentage: 55,
      status: 'In Progress',
      hasAssessment: false,
    },
    {
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      moduleId: 'mod3',
      moduleTitle: 'Data Breach Response',
      orderIndex: 3,
      timeSpent: 0,
      videoWatchPercentage: 0,
      completionPercentage: 0,
      status: 'Not Started',
      hasAssessment: true,
    },
    {
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      moduleId: 'mod4',
      moduleTitle: 'HIPAA Regulations',
      orderIndex: 1,
      timeSpent: 52,
      videoWatchPercentage: 85,
      completionPercentage: 100,
      status: 'Completed',
      hasAssessment: true,
    },
    {
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      moduleId: 'mod5',
      moduleTitle: 'Risk Assessment Framework',
      orderIndex: 2,
      timeSpent: 35,
      videoWatchPercentage: 70,
      completionPercentage: 100,
      status: 'Completed',
      hasAssessment: false,
    },
    {
      courseId: 'course3',
      courseTitle: 'Advanced Excel Functions',
      moduleId: 'mod6',
      moduleTitle: 'VLOOKUP & Pivot Tables',
      orderIndex: 1,
      timeSpent: 28,
      videoWatchPercentage: 48,
      completionPercentage: 48,
      status: 'In Progress',
      hasAssessment: true,
    },
  ];

  const quizAnalytics: QuizAnalytics[] = [
    {
      courseId: 'course1',
      courseTitle: 'Data Security & Privacy',
      assessmentId: 'quiz1',
      assessmentTitle: 'GDPR Compliance Assessment',
      lastAttemptDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastScore: 52,
      isPassed: false,
      incorrectQuestions: [
        {
          questionId: 'q1',
          questionText: 'What is the maximum fine for GDPR violations?',
          userAnswer: '€1 million',
          correctAnswer: '€20 million or 4% of annual revenue, whichever is higher',
        },
        {
          questionId: 'q2',
          questionText: 'How long must personal data be retained under GDPR?',
          userAnswer: 'Indefinitely',
          correctAnswer: 'Only as long as necessary for the purpose it was collected',
        },
        {
          questionId: 'q3',
          questionText: 'What is a Data Protection Officer (DPO) responsible for?',
          userAnswer: 'Only monitoring data breaches',
          correctAnswer: 'Overseeing data protection strategy and compliance',
        },
        {
          questionId: 'q4',
          questionText: 'When must a data breach be reported to authorities?',
          userAnswer: 'Within 30 days',
          correctAnswer: 'Within 72 hours',
        },
      ],
    },
    {
      courseId: 'course2',
      courseTitle: 'Compliance Regulations',
      assessmentId: 'quiz2',
      assessmentTitle: 'HIPAA Compliance Test',
      lastAttemptDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastScore: 78,
      isPassed: true,
      incorrectQuestions: [
        {
          questionId: 'q5',
          questionText: 'What is the minimum necessary standard in HIPAA?',
          userAnswer: 'All information should be shared',
          correctAnswer: 'Only the minimum necessary information should be accessed',
        },
      ],
    },
  ];

  return {
    userId,
    userName: 'John Smith',
    email: 'john.smith@company.com',
    lastLogin: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    courses: [
      {
        courseId: 'course1',
        courseTitle: 'Data Security & Privacy',
        courseDescription: 'Learn about GDPR, encryption, and data breach response',
        completionPercentage: 60,
        status: 'In Progress',
        quizScore: 52,
        isPassed: false,
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: true,
        startedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        courseId: 'course2',
        courseTitle: 'Compliance Regulations',
        courseDescription: 'HIPAA and risk assessment frameworks',
        completionPercentage: 100,
        status: 'Completed',
        quizScore: 78,
        isPassed: true,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: true,
        startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        courseId: 'course3',
        courseTitle: 'Advanced Excel Functions',
        courseDescription: 'Master VLOOKUP, Pivot Tables, and advanced formulas',
        completionPercentage: 48,
        status: 'In Progress',
        quizScore: undefined,
        isPassed: false,
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        isMandatory: false,
        startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    timeline,
    resourceBreakdown,
    quizAnalytics,
  };
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose, onResetQuiz, onNudge, onViewResults }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingQuiz, setResettingQuiz] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'timeline' | 'resources' | 'quizzes' | 'certificates'>('timeline');
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [extendingDeadline, setExtendingDeadline] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [manualCompleting, setManualCompleting] = useState<string | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      // Load detailed learner information
      const detailResponse = await api.get(`/manager/learner-detail/${userId}`);
      const detailData = detailResponse.data.data;

      // Also load basic user details for courses tab
      const response = await api.get(`/manager/team/${userId}`);
      const basicData = response.data.data;

      setUserDetails({
        ...basicData,
        timeline: detailData.timeline || [],
        resourceBreakdown: detailData.resourceBreakdown || [],
        quizAnalytics: detailData.quizAnalytics || [],
      });
      
      // Load quiz attempts for courses with quizzes
      const coursesWithQuizzes = basicData.courses.filter((c: Course) => c.quizScore !== undefined && c.quizScore !== null);
      const attempts = await Promise.all(
        coursesWithQuizzes.map(async (course: Course) => {
          try {
            const quizResponse = await api.get(`/manager/quiz-results/${userId}/${course.courseId}`);
            return {
              courseId: course.courseId,
              courseTitle: course.courseTitle,
              ...quizResponse.data.data,
            };
          } catch {
            return null;
          }
        })
      );
      setQuizAttempts(attempts.filter(a => a !== null));
      
      // Load certificates (completed courses)
      const completedCourses = basicData.courses.filter((c: Course) => c.completionPercentage >= 100);
      setCertificates(completedCourses);
      setUseDemoData(false);
    } catch (error) {
      console.error('Failed to load user details:', error);
      // Use demo data on error
      const demoData = getDemoLearnerDetail(userId);
      setUserDetails(demoData);
      setQuizAttempts([]);
      setCertificates(demoData.courses.filter(c => c.completionPercentage >= 100));
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuiz = async (courseId: string, resetType: 'quiz' | 'progress' = 'quiz') => {
    const confirmMessage = resetType === 'quiz'
      ? 'Are you sure you want to reset quiz attempts for this course?'
      : 'Are you sure you want to reset the entire course progress? This will reset both quiz and progress.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setResettingQuiz(courseId);
    try {
      await api.patch('/manager/learner-reset', {
        userId: userId,
        courseId: courseId,
        resetType: resetType,
      });
      alert(`${resetType === 'quiz' ? 'Quiz attempts' : 'Course progress'} reset successfully`);
      onResetQuiz(courseId);
      loadUserDetails();
    } catch (error) {
      console.error('Failed to reset:', error);
      alert(`Failed to reset ${resetType}`);
    } finally {
      setResettingQuiz(null);
    }
  };

  const handleNudge = async () => {
    try {
      await api.post(`/manager/nudge/${userId}`);
      alert('Nudge sent successfully');
      onNudge();
    } catch (error) {
      console.error('Failed to send nudge:', error);
      alert('Failed to send nudge');
    }
  };

  const handleExtendDeadline = async (courseId: string) => {
    if (!newDueDate) {
      alert('Please select a new due date');
      return;
    }

    setExtendingDeadline(courseId);
    try {
      await api.patch('/manager/manual-override', {
        userId: userId,
        courseId: courseId,
        action: 'extend_deadline',
        newDueDate: newDueDate,
      });
      alert('Deadline extended successfully');
      loadUserDetails();
      setNewDueDate('');
    } catch (error) {
      console.error('Failed to extend deadline:', error);
      alert('Failed to extend deadline');
    } finally {
      setExtendingDeadline(null);
    }
  };

  const handleManualCompletion = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to manually mark this course as complete? This is a super-override action.')) {
      return;
    }

    setManualCompleting(courseId);
    try {
      await api.patch('/manager/manual-override', {
        userId: userId,
        courseId: courseId,
        action: 'manual_completion',
      });
      alert('Course marked as complete successfully');
      loadUserDetails();
    } catch (error) {
      console.error('Failed to mark as complete:', error);
      alert('Failed to mark course as complete');
    } finally {
      setManualCompleting(null);
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'course_assigned':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'course_started':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'progress_updated':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'course_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'quiz_passed':
        return <Award className="w-4 h-4 text-green-600" />;
      case 'quiz_failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-500">Failed to load user details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Learner Command Center</h2>
              {useDemoData && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">{userDetails.userName} ({userDetails.email})</p>
            <p className="text-sm text-gray-400 mt-1">
              Last Login: {userDetails.lastLogin ? new Date(userDetails.lastLogin).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = `mailto:${userDetails.email}?subject=Quick Check-in`}
              className="btn-secondary flex items-center gap-2"
              title="Send email to team member"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={handleNudge}
              className="btn-secondary flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Nudge
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Resource Breakdown
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'quizzes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quiz Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Courses ({userDetails.courses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'certificates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certificates ({certificates.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            {userDetails.timeline && userDetails.timeline.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {userDetails.timeline.map((event, index) => (
                    <div key={index} className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            {event.courseTitle && (
                              <p className="text-xs text-gray-500 mt-1">Course: {event.courseTitle}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.completionPercentage !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${event.completionPercentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{event.completionPercentage}% complete</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No timeline events recorded</p>
              </div>
            )}
          </div>
        )}

        {/* Resource Breakdown Tab */}
        {activeTab === 'resources' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Breakdown</h3>
            {userDetails.resourceBreakdown && userDetails.resourceBreakdown.length > 0 ? (
              <div className="space-y-4">
                {userDetails.resourceBreakdown.map((resource, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{resource.moduleTitle}</h4>
                          {resource.hasAssessment && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <FileText className="w-3 h-3 mr-1" />
                              Quiz
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{resource.courseTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{resource.timeSpent} min</p>
                        <p className="text-xs text-gray-500">Time Spent</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Completion</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              resource.completionPercentage >= 100
                                ? 'bg-green-500'
                                : resource.completionPercentage >= 50
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${resource.completionPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{resource.completionPercentage}%</p>
                      </div>
                      {resource.videoWatchPercentage !== null && resource.videoWatchPercentage !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video Watch %
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${resource.videoWatchPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{resource.videoWatchPercentage}%</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleManualCompletion(resource.courseId)}
                        disabled={manualCompleting === resource.courseId}
                        className="btn-secondary flex items-center gap-2 text-sm"
                        title="Manually mark this course as complete (Super-Override)"
                      >
                        <Zap className="w-4 h-4" />
                        {manualCompleting === resource.courseId ? 'Completing...' : 'Manual Completion'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No resource data available</p>
              </div>
            )}
          </div>
        )}

        {/* Quiz Analytics Tab */}
        {activeTab === 'quizzes' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Analytics</h3>
            {userDetails.quizAnalytics && userDetails.quizAnalytics.length > 0 ? (
              <div className="space-y-6">
                {userDetails.quizAnalytics.map((quiz, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{quiz.assessmentTitle}</h4>
                        <p className="text-sm text-gray-600 mt-1">{quiz.courseTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last Attempt: {new Date(quiz.lastAttemptDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          quiz.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {quiz.isPassed ? 'Passed' : 'Failed'}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{quiz.lastScore}%</p>
                      </div>
                    </div>
                    {quiz.incorrectQuestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3">Incorrect Questions ({quiz.incorrectQuestions.length})</h5>
                        <div className="space-y-4">
                          {quiz.incorrectQuestions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="font-medium text-gray-900 mb-2">{q.questionText}</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-red-700 mb-1">User's Answer:</p>
                                  <p className="text-sm text-gray-700">{q.userAnswer}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-700 mb-1">Correct Answer:</p>
                                  <p className="text-sm text-gray-700">{q.correctAnswer}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {quiz.incorrectQuestions.length === 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-green-600">All questions answered correctly!</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No quiz analytics available</p>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Courses</h3>
            <div className="space-y-4">
              {userDetails.courses.map((course) => (
                <div key={course.courseId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-medium text-gray-900">{course.courseTitle}</h4>
                        {course.isMandatory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Mandatory
                          </span>
                        )}
                      </div>
                      {course.courseDescription && (
                        <p className="text-sm text-gray-600 mb-2">{course.courseDescription}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {course.status === 'Completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : course.status === 'In Progress' ? (
                        <Clock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Completion</p>
                      <p className="text-sm font-medium text-gray-900">{course.completionPercentage}%</p>
                    </div>
                    {course.quizScore !== undefined && course.quizScore !== null && (
                      <div>
                        <p className="text-xs text-gray-500">Quiz Score</p>
                        <p className={`text-sm font-medium ${course.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                          {course.quizScore}% {course.isPassed ? '✓' : '✗'}
                        </p>
                      </div>
                    )}
                    {course.dueDate && (
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className={`text-sm font-medium ${
                          new Date(course.dueDate) < new Date() && course.completionPercentage < 100
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {new Date(course.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-medium text-gray-900">{course.status}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          course.completionPercentage >= 100
                            ? 'bg-green-500'
                            : course.completionPercentage >= 50
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${course.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 flex-wrap">
                    {course.dueDate && (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="input-field text-sm"
                          placeholder="New due date"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <button
                          onClick={() => handleExtendDeadline(course.courseId)}
                          disabled={extendingDeadline === course.courseId || !newDueDate}
                          className="btn-secondary flex items-center gap-2 text-sm"
                          title="Extend deadline for this course"
                        >
                          <Calendar className="w-4 h-4" />
                          {extendingDeadline === course.courseId ? 'Extending...' : 'Extend Deadline'}
                        </button>
                      </div>
                    )}
                    {course.quizScore !== undefined && course.quizScore !== null && !course.isPassed && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetQuiz(course.courseId, 'quiz')}
                          disabled={resettingQuiz === course.courseId}
                          className="btn-secondary flex items-center gap-2 text-sm"
                          title="Reset quiz attempts only"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {resettingQuiz === course.courseId ? 'Resetting...' : 'Reset Quiz'}
                        </button>
                        <button
                          onClick={() => handleResetQuiz(course.courseId, 'progress')}
                          disabled={resettingQuiz === course.courseId}
                          className="btn-secondary flex items-center gap-2 text-sm border-red-300 text-red-700 hover:bg-red-50"
                          title="Reset entire course progress"
                        >
                          <Lock className="w-4 h-4" />
                          Reset Progress
                        </button>
                      </div>
                    )}
                    {course.quizScore !== undefined && course.quizScore !== null && (
                      <button
                        onClick={() => onViewResults && onViewResults(course.courseId)}
                        className="btn-secondary text-sm"
                      >
                        View Results
                      </button>
                    )}
                    <button
                      onClick={() => handleManualCompletion(course.courseId)}
                      disabled={manualCompleting === course.courseId}
                      className="btn-secondary flex items-center gap-2 text-sm border-purple-300 text-purple-700 hover:bg-purple-50"
                      title="Manually mark this course as complete (Super-Override)"
                    >
                      <Zap className="w-4 h-4" />
                      {manualCompleting === course.courseId ? 'Completing...' : 'Manual Completion'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {userDetails.courses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No courses enrolled</p>
              </div>
            )}
          </div>
        )}

        {/* Quiz Attempts Tab (Legacy) */}
        {activeTab === 'quizzes' && userDetails.quizAnalytics && userDetails.quizAnalytics.length === 0 && quizAttempts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Attempts</h3>
            <div className="space-y-4">
              {quizAttempts.map((attempt) => (
                <div key={attempt.courseId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{attempt.courseTitle}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Attempted: {attempt.attemptDate ? new Date(attempt.attemptDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        attempt.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {attempt.isPassed ? 'Passed' : 'Failed'}
                      </span>
                      {attempt.quizScore !== undefined && (
                        <span className="text-sm font-semibold text-gray-900">
                          {attempt.quizScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewResults && onViewResults(attempt.courseId)}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </button>
                    {!attempt.isPassed && (
                      <button
                        onClick={() => handleResetQuiz(attempt.courseId, 'quiz')}
                        disabled={resettingQuiz === attempt.courseId}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Attempts
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificates Earned</h3>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.courseId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Award className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{cert.courseTitle}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Completed: {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : 'N/A'}
                          </p>
                          {cert.quizScore !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">
                              Final Score: {cert.quizScore}%
                            </p>
                          )}
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No certificates earned yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
