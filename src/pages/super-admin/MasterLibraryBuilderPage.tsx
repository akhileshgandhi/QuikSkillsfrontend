import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import CourseCreator from '../../components/CourseCreator';

const MasterLibraryBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [showCourseCreator, setShowCourseCreator] = useState(true); // Auto-open on this page

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Course Builder</h1>
          <p className="text-gray-600 mt-1">
            Create a master course that can be shared with all tenants
          </p>
        </div>
        <button
          onClick={() => setShowCourseCreator(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {/* Course Creator Modal */}
      {showCourseCreator && (
        <CourseCreator
          courseId={courseId || undefined}
          onClose={() => {
            setShowCourseCreator(false);
            navigate('/dashboard/master-library'); // Navigate back to Master Library
          }}
          onSuccess={() => {
            setShowCourseCreator(false);
            navigate('/dashboard/master-library'); // Navigate back to Master Library after success
          }}
        />
      )}

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Master Course Builder
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Click "Create New Course" to start building your master course with modules, sub-modules, and quizzes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasterLibraryBuilderPage;

