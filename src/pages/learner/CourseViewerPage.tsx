import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Clock, FileText, Video, Award, Lock, AlertCircle, X } from 'lucide-react';
import api from '../../utils/api';
import QuizTakingComponent from '../../components/learner/QuizTakingComponent';
import QuizResultsComponent from '../../components/learner/QuizResultsComponent';
import VideoPlayerWithProgress from '../../components/learner/VideoPlayerWithProgress';

interface Lesson {
  _id?: string;
  title: string;
  type: string;
  contentUrl?: string;
  orderIndex: number;
  description?: string;
  duration?: number;
  scormPackageId?: string;
}

interface Module {
  _id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
  assessmentId?: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  modules: Module[];
}

interface ModuleProgress {
  moduleId: string;
  completionPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
}

const CourseViewerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>({});
  const [lessonSavedPositions, setLessonSavedPositions] = useState<Record<string, number>>({});
  
  // Progress tracking
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgress = useRef<number>(0);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadProgress();
    }

    // Set up auto-save progress every 30 seconds
    progressSaveInterval.current = setInterval(() => {
      if (progress && lastSavedProgress.current !== progress.completionPercentage) {
        saveProgress();
      }
    }, 30000);

    // Save progress on page unload
    const handleBeforeUnload = () => {
      if (progress) {
        saveProgress();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
      
      // Initialize module progress
      if (response.data.data?.modules) {
        const initialModuleProgress: Record<string, ModuleProgress> = {};
        response.data.data.modules.forEach((module: Module) => {
          initialModuleProgress[module._id] = {
            moduleId: module._id,
            completionPercentage: 0,
            lessonsCompleted: 0,
            totalLessons: module.lessons.length,
          };
        });
        setModuleProgress(initialModuleProgress);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await api.get(`/progress/${courseId}`);
      const progressData = response.data.data;
      setProgress(progressData);
      lastSavedProgress.current = progressData?.completionPercentage || 0;

      // Calculate module-level progress
      if (course && progressData) {
        updateModuleProgress(progressData);
      }

      // Load lesson-level progress if available
      if (progressData?.lessonProgress) {
        const lessonProg: Record<string, number> = {};
        const lessonPositions: Record<string, number> = {};
        
        // Parse lesson progress from progress data
        // This would come from a lessonProgress field in the progress document
        Object.entries(progressData.lessonProgress || {}).forEach(([lessonId, prog]: [string, any]) => {
          lessonProg[lessonId] = prog.percentage || 0;
          lessonPositions[lessonId] = prog.currentPosition || 0;
        });
        
        setLessonProgress(lessonProg);
        setLessonSavedPositions(lessonPositions);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const updateModuleProgress = (progressData: any) => {
    if (!course) return;

    const updatedModuleProgress: Record<string, ModuleProgress> = {};
    
    course.modules.forEach((module) => {
      // For now, estimate module progress based on overall course progress
      // In a real implementation, you'd track progress per module
      const estimatedModuleProgress = progressData.completionPercentage || 0;
      
      updatedModuleProgress[module._id] = {
        moduleId: module._id,
        completionPercentage: estimatedModuleProgress,
        lessonsCompleted: Math.floor((estimatedModuleProgress / 100) * module.lessons.length),
        totalLessons: module.lessons.length,
      };
    });

    setModuleProgress(updatedModuleProgress);
  };

  const saveProgress = useCallback(async () => {
    if (!courseId || !progress) return;

    try {
      const currentProgress = progress.completionPercentage || 0;
      
      await api.post('/progress', {
        courseId,
        completionPercentage: currentProgress,
        status: currentProgress >= 100 ? 'completed' : 'in_progress',
      });

      lastSavedProgress.current = currentProgress;
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [courseId, progress]);

  const handleLessonProgress = async (lessonId: string, watchedPercentage: number) => {
    if (!course) return;

    const currentModule = course.modules[currentModuleIndex];
    if (!currentModule) return;

    // Calculate module completion based on lesson progress
    const lessonIndex = currentModule.lessons.findIndex(l => l._id === lessonId || l.title === lessonId);
    if (lessonIndex === -1) return;

    // Update module progress
    const updatedModuleProgress = { ...moduleProgress };
    const moduleProg = updatedModuleProgress[currentModule._id] || {
      moduleId: currentModule._id,
      completionPercentage: 0,
      lessonsCompleted: 0,
      totalLessons: currentModule.lessons.length,
    };

    // If lesson is 95%+ complete, mark it as completed
    if (watchedPercentage >= 95) {
      if (lessonIndex >= moduleProg.lessonsCompleted) {
        moduleProg.lessonsCompleted = lessonIndex + 1;
      }
    }

    // Calculate module completion percentage
    moduleProg.completionPercentage = Math.min(
      100,
      (moduleProg.lessonsCompleted / moduleProg.totalLessons) * 100
    );

    updatedModuleProgress[currentModule._id] = moduleProg;
    setModuleProgress(updatedModuleProgress);

    // Update overall course progress
    const totalModules = course.modules.length;
    const totalModuleProgress = Object.values(updatedModuleProgress).reduce(
      (sum, mp) => sum + mp.completionPercentage,
      0
    );
    const overallProgress = totalModuleProgress / totalModules;

    // Update progress state
    const updatedProgress = {
      ...progress,
      completionPercentage: Math.min(100, overallProgress),
      status: overallProgress >= 100 ? 'completed' : 'in_progress',
    };
    setProgress(updatedProgress);

    // Save progress
    try {
      await api.post('/progress', {
        courseId,
        lessonId,
        completionPercentage: overallProgress,
        status: overallProgress >= 100 ? 'completed' : 'in_progress',
      });
      lastSavedProgress.current = overallProgress;
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleLessonComplete = async () => {
    await loadProgress();
  };

  const handleQuizComplete = (result: { passed: boolean; percentage: number }) => {
    setQuizResult(result);
    setShowQuiz(false);
    setShowQuizResults(true);
    loadProgress();
  };

  const getModuleProgress = (module: Module) => {
    const moduleProg = moduleProgress[module._id];
    return moduleProg?.completionPercentage || 0;
  };

  const isModuleCompleted = (module: Module) => {
    const moduleProg = moduleProgress[module._id];
    return moduleProg?.completionPercentage >= 100;
  };

  // Check if quiz is locked (requires 95% completion of module content)
  const isQuizLocked = (module: Module) => {
    const moduleProg = moduleProgress[module._id];
    if (!moduleProg) return true;
    
    // Quiz is locked if module completion is less than 95%
    return moduleProg.completionPercentage < 95;
  };

  const getQuizLockReason = (module: Module) => {
    const moduleProg = moduleProgress[module._id];
    if (!moduleProg) return 'Complete the module content to unlock the quiz.';
    
    const remaining = 95 - moduleProg.completionPercentage;
    return `Complete ${remaining.toFixed(0)}% more of the module content to unlock the quiz.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Course not found</p>
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="mt-4 btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];
  const quizLocked = currentModule?.assessmentId ? isQuizLocked(currentModule) : false;

  if (showQuiz && currentModule?.assessmentId && !quizLocked) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setShowQuiz(false)}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </button>
          <QuizTakingComponent
            assessmentId={currentModule.assessmentId}
            courseId={courseId!}
            onComplete={handleQuizComplete}
            onCancel={() => setShowQuiz(false)}
          />
        </div>
      </div>
    );
  }

  if (showQuizResults && quizResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => {
              setShowQuizResults(false);
              setQuizResult(null);
            }}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </button>
          <QuizResultsComponent
            result={quizResult}
            onContinue={() => {
              setShowQuizResults(false);
              setQuizResult(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/learner/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                {progress && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {progress.completionPercentage || 0}% Complete
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {progress?.isPassed && (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                <Award className="w-5 h-5" />
                <span className="font-semibold">Certificate Earned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Modules */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Modules</h2>
              <div className="space-y-2">
                {course.modules.map((module, index) => {
                  const moduleProg = getModuleProgress(module);
                  const completed = isModuleCompleted(module);
                  
                  return (
                    <button
                      key={module._id}
                      onClick={() => {
                        setCurrentModuleIndex(index);
                        setCurrentLessonIndex(0);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        index === currentModuleIndex
                          ? 'bg-primary-50 border-2 border-primary-600'
                          : 'border-2 border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{module.title}</span>
                        {completed && (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${moduleProg}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(moduleProg)}%</span>
                      </div>
                      {module.assessmentId && (
                        <span className="text-xs text-gray-500 mt-1 block flex items-center gap-1">
                          {isQuizLocked(module) ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Quiz Locked
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              Quiz Available
                            </>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentModule && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentModule.title}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Module {currentModuleIndex + 1} of {course.modules.length}
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-3 mb-6">
                  {currentModule.lessons.map((lesson, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        index === currentLessonIndex
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {lesson.type === 'Video' ? (
                            <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          ) : lesson.type === 'SCORM' ? (
                            <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                            )}
                          </div>
                        </div>
                        {lesson.duration && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 ml-4">
                            <Clock className="w-4 h-4" />
                            {lesson.duration} min
                          </div>
                        )}
                      </div>
                      {lesson.contentUrl && (
                        <div className="mt-3">
                          {lesson.type === 'Video' ? (
                            <button
                              onClick={() => {
                                setSelectedLesson(lesson);
                                handleLessonProgress(lesson._id || lesson.title, 0);
                              }}
                              className="btn-primary text-sm inline-flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Watch Video
                              {lessonProgress[lesson._id || lesson.title] >= 95 && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  ✓ Ready
                                </span>
                              )}
                            </button>
                          ) : (
                            <a
                              href={lesson.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-sm inline-flex items-center gap-2"
                              onClick={() => {
                                handleLessonProgress(lesson._id || lesson.title, 0);
                              }}
                            >
                              <Play className="w-4 h-4" />
                              {lesson.type === 'SCORM' ? 'Launch SCORM' : 'View Content'}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quiz Button */}
                {currentModule.assessmentId && (
                  <div className="border-t border-gray-200 pt-4">
                    {quizLocked ? (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900 mb-1">Quiz Locked</h3>
                            <p className="text-sm text-yellow-800">
                              {getQuizLockReason(currentModule)}
                            </p>
                            <div className="mt-3">
                              <div className="flex items-center gap-2 text-sm text-yellow-700">
                                <div className="w-32 bg-yellow-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-600 h-2 rounded-full transition-all"
                                    style={{ width: `${getModuleProgress(currentModule)}%` }}
                                  ></div>
                                </div>
                                <span className="font-medium">
                                  {Math.round(getModuleProgress(currentModule))}% / 95% required
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowQuiz(true)}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Take Quiz
                        </button>
                        {progress?.quizScore !== undefined && progress.quizScore !== null && (
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            Last Score: {progress.quizScore}%{' '}
                            {progress.isPassed ? (
                              <span className="text-green-600 font-medium">✓ Passed</span>
                            ) : (
                              <span className="text-red-600 font-medium">✗ Failed</span>
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedLesson && selectedLesson.type === 'Video' && selectedLesson.contentUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl relative">
            <button
              onClick={() => {
                setSelectedLesson(null);
                loadProgress(); // Reload progress after closing
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <VideoPlayerWithProgress
              videoUrl={selectedLesson.contentUrl}
              courseId={courseId!}
              lessonId={selectedLesson._id || selectedLesson.title}
              lessonTitle={selectedLesson.title}
              initialPosition={lessonSavedPositions[selectedLesson._id || selectedLesson.title] || 0}
              onProgressUpdate={(watchedPercentage) => {
                const lessonKey = selectedLesson._id || selectedLesson.title;
                setLessonProgress(prev => ({
                  ...prev,
                  [lessonKey]: watchedPercentage,
                }));
                handleLessonProgress(lessonKey, watchedPercentage);
              }}
              onComplete={() => {
                handleLessonProgress(selectedLesson._id || selectedLesson.title, 100);
                loadProgress();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseViewerPage;
