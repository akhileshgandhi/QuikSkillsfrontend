import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Course {
  _id: string;
  title: string;
  description?: string;
  status: string;
  isMaster: boolean;
  createdAt: string;
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) {
      alert('Please enter a course title');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/courses', {
        title: newCourseTitle,
        description: newCourseDescription,
        isMaster,
      });
      setShowCreateModal(false);
      setNewCourseTitle('');
      setNewCourseDescription('');
      setIsMaster(false);
      navigate(`/courses/${response.data.data._id}/builder`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + Create New Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/courses/${course._id}/builder`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {course.title}
                </h3>
                {course.isMaster && (
                  <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded">
                    Master
                  </span>
                )}
              </div>
              {course.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="capitalize">{course.status}</span>
                <span>
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No courses yet.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Course
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Course
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label-field">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter course title"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Enter course description (optional)"
                  disabled={creating}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMaster"
                  checked={isMaster}
                  onChange={(e) => setIsMaster(e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                  disabled={creating}
                />
                <label htmlFor="isMaster" className="text-sm text-gray-700">
                  Mark as Master Course (can be shared with all tenants)
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateCourse}
                  disabled={creating || !newCourseTitle.trim()}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCourseTitle('');
                    setNewCourseDescription('');
                    setIsMaster(false);
                  }}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;

