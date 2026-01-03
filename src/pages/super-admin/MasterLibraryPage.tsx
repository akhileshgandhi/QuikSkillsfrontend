import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Eye, Edit, Trash2, Calendar, Users, X, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import CoursePreviewModal from '../../components/CoursePreviewModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

interface MasterCourse {
  _id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  selectedTenants?: string[];
  modules?: any[];
}

const MasterLibraryPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MasterCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCourse, setPreviewCourse] = useState<MasterCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<MasterCourse | null>(null);

  useEffect(() => {
    loadMasterCourses();
  }, []);

  const loadMasterCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/master/all');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Failed to load master courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMasterCourse = () => {
    navigate('/dashboard/master-library/builder');
  };

  const handleViewCourse = async (courseId: string) => {
    try {
      setError(null);
      const response = await api.get(`/courses/master/${courseId}`);
      setPreviewCourse(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course details');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/dashboard/master-library/builder?courseId=${courseId}`);
  };

  const handleDeleteClick = (course: MasterCourse) => {
    setCourseToDelete(course);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeleting(courseToDelete._id);
      setError(null);
      await api.delete(`/courses/master/${courseToDelete._id}`);
      setSuccess('Course deleted successfully');
      setCourseToDelete(null);
      loadMasterCourses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete course. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setCourseToDelete(null);
  };

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Library</h1>
          <p className="text-gray-600 mt-1">
            Create and manage master courses that can be shared across all
            tenants
          </p>
        </div>
        <button
          onClick={handleCreateMasterCourse}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Master Course
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Master Courses Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Master courses are templates that can be pushed to all tenant
              organizations. Create your first master course to get started.
            </p>
            <button
              onClick={handleCreateMasterCourse}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Master Course
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-primary-400" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.status === 'Published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Category: {course.category || 'Uncategorized'}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.modules?.length || 0} Modules</span>
                  </div>
                  {course.selectedTenants && course.selectedTenants.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.selectedTenants.length} Tenants</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Created: {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewCourse(course._id)}
                    className="btn-secondary flex-1 text-sm inline-flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditCourse(course._id)}
                    className="btn-secondary flex-1 text-sm inline-flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(course)}
                    disabled={deleting === course._id}
                    className="btn-secondary text-sm inline-flex items-center justify-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === course._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Preview Modal */}
      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <DeleteConfirmationModal
          isOpen={!!courseToDelete}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Master Course"
          message="Are you sure you want to delete this master course?"
          itemName={courseToDelete.title}
          isLoading={deleting === courseToDelete._id}
        />
      )}
    </div>
  );
};

export default MasterLibraryPage;

