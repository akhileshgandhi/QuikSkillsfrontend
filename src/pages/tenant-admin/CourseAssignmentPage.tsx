import { useState, useEffect } from 'react';
import { BookOpen, UserCheck, Search, Grid3x3, List } from 'lucide-react';
import api from '../../utils/api';
import AssignCourseModal from '../../components/AssignCourseModal';

interface Course {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  createdAt: string;
  authorId?: {
    firstName: string;
    lastName: string;
  };
}

const CourseAssignmentPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCourses();
  }, [refreshKey]);

  const loadCourses = async () => {
    try {
      const response = await api.get('/course-assignments/courses');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignSuccess = () => {
    setRefreshKey(prev => prev + 1);
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
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-1">
            Manage courses assigned to your organization by the Super Admin
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Courses Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No courses found' : 'No courses available'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Courses assigned by the Super Admin will appear here'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 flex flex-col"
            >
              {/* Thumbnail */}
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-primary-600" />
                </div>
              )}

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  {course.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded mb-2">
                      {course.category}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {course.description}
                    </p>
                  )}
                  {course.authorId && (
                    <p className="text-xs text-gray-500">
                      by {course.authorId.firstName} {course.authorId.lastName}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setSelectedCourse({ id: course._id, title: course.title })}
                  className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Course
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      {course.category && (
                        <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded">
                          {course.category}
                        </span>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                    )}
                    {course.authorId && (
                      <p className="text-xs text-gray-500">
                        by {course.authorId.firstName} {course.authorId.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourse({ id: course._id, title: course.title })}
                  className="ml-4 btn-primary flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Course
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {selectedCourse && (
        <AssignCourseModal
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};

export default CourseAssignmentPage;
