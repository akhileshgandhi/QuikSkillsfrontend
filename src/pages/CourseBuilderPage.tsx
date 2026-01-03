import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CourseBuilder from '../components/CourseBuilder';
import api from '../utils/api';

const CourseBuilderPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToAll = async () => {
    if (!courseId || !course?.isMaster) {
      alert('Only master courses can be pushed to all tenants');
      return;
    }

    if (
      !confirm(
        'This will share this course with all active tenants. Continue?',
      )
    ) {
      return;
    }

    setPushing(true);
    try {
      const response = await api.post(
        `/shared-content/push-to-all/${courseId}`,
      );
      alert(
        `Course successfully shared with ${response.data.data.sharedCount} tenants!`,
      );
    } catch (error: any) {
      alert(
        error.response?.data?.message || 'Failed to push course to tenants',
      );
    } finally {
      setPushing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!courseId) {
    return <div>Course ID is required</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/courses')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Courses
            </button>
            {course?.isMaster && (
              <button
                onClick={handlePushToAll}
                disabled={pushing}
                className="btn-primary"
              >
                {pushing ? 'Pushing to All Tenants...' : 'Push to All Tenants'}
              </button>
            )}
          </div>
        </div>
      </div>
      <CourseBuilder courseId={courseId} />
    </div>
  );
};

export default CourseBuilderPage;

