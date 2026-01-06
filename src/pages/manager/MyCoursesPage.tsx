import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import api from '../../utils/api';

interface ManagerCourse {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  completionPercentage: number;
  status: string;
  startedAt?: string;
  dueDate?: string;
  isMandatory: boolean;
}

const MyCoursesPage = () => {
  const [courses, setCourses] = useState<ManagerCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      // In a real app, this would fetch manager's own courses
      // For now, using demo data
      const demoCourses: ManagerCourse[] = [
        {
          courseId: 'course1',
          courseTitle: 'Leadership Fundamentals',
          courseDescription: 'Learn essential leadership skills and management techniques',
          completionPercentage: 75,
          status: 'In Progress',
          startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          isMandatory: true,
        },
        {
          courseId: 'course2',
          courseTitle: 'Performance Management',
          courseDescription: 'Master the art of managing team performance',
          completionPercentage: 100,
          status: 'Completed',
          startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          isMandatory: true,
        },
        {
          courseId: 'course3',
          courseTitle: 'Advanced Analytics',
          courseDescription: 'Data-driven decision making for managers',
          completionPercentage: 0,
          status: 'Not Started',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isMandatory: false,
        },
      ];
      setCourses(demoCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600 mt-1">Your assigned learning courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.courseId} className="backdrop-blur-md bg-white/70 border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{course.courseTitle}</h3>
                  {course.isMandatory && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Mandatory
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{course.courseDescription}</p>
              </div>
              {course.status === 'Completed' ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : course.status === 'In Progress' ? (
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">{course.completionPercentage}%</span>
              </div>
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

            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium">{course.status}</p>
              </div>
              {course.dueDate && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className={`font-medium ${
                    new Date(course.dueDate) < new Date() && course.completionPercentage < 100
                      ? 'text-red-600'
                      : ''
                  }`}>
                    {new Date(course.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = `/learner/course/${course.courseId}`}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {course.status === 'Not Started' ? 'Start Course' : course.status === 'Completed' ? 'Review Course' : 'Continue Learning'}
            </button>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No courses assigned yet</p>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;

