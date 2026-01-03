import { X, BookOpen, FileText, HelpCircle, Calendar, Users } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface CoursePreviewModalProps {
  course: any;
  onClose: () => void;
}

const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Course Preview</h3>
              <p className="text-sm text-gray-600">How this course appears to learners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white mb-6">
            <div className="flex items-start gap-6">
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt="Course thumbnail"
                  className="w-32 h-24 object-cover rounded-lg border-2 border-white shadow-lg"
                />
              )}
              <div className="flex-1">
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium mb-3">
                  {course.category || 'Uncategorized'}
                </div>
                <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                <div className="flex items-center gap-6 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.modules?.length || 0} Module{(course.modules?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {course.selectedTenants && course.selectedTenants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.selectedTenants.length} Tenant{(course.selectedTenants.length !== 1 ? 's' : '')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          {course.modules && course.modules.length > 0 ? (
            <div className="space-y-6">
              {course.modules.map((module: any, moduleIndex: number) => (
                <div key={module._id || moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">{moduleIndex + 1}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="divide-y divide-gray-200">
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson: any, lessonIndex: number) => (
                        <div key={lessonIndex} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-sm text-gray-600 font-medium">
                                {moduleIndex + 1}.{lessonIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{lesson.title}</h4>
                              
                              {/* Resource Preview */}
                              {lesson.type === 'Video' && lesson.contentUrl && (
                                <div className="mt-3">
                                  <div className="rounded-lg overflow-hidden border border-gray-200">
                                    <VideoPlayer
                                      videoUrl={lesson.contentUrl}
                                      title={lesson.title}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {lesson.type === 'PDF' && lesson.contentUrl && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                                  <FileText className="w-4 h-4" />
                                  <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    View PDF Document
                                  </a>
                                </div>
                              )}

                              {lesson.type === 'PPT' && lesson.contentUrl && (
                                <div className="flex items-center gap-2 text-sm text-purple-600 mt-2">
                                  <FileText className="w-4 h-4" />
                                  <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    View PowerPoint Presentation
                                  </a>
                                </div>
                              )}

                              {lesson.type === 'SCORM' && lesson.contentUrl && (
                                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span>SCORM Package Available</span>
                                </div>
                              )}

                              {lesson.type === 'Text' && lesson.contentUrl && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                  <FileText className="w-4 h-4" />
                                  <span>Text Content</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <p>No lessons in this module</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No modules in this course yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewModal;

