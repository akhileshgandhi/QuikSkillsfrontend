import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { 
  ArrowLeft, Play, Pause, CheckCircle, Lock, Video, FileText, 
  Award, Clock, AlertCircle, X, ChevronDown, ChevronRight, Save,
  WifiOff
} from 'lucide-react';
import api from '../../utils/api';
import InteractiveQuizComponent from './InteractiveQuizComponent';
import AudioPlayerResource from './AudioPlayerResource';
import PdfProgressViewer from './PdfProgressViewer';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';

interface Lesson {
  _id?: string;
  title: string;
  type: 'Video' | 'PDF' | 'SCORM' | 'Quiz' | 'Text' | 'Audio';
  contentUrl?: string;
  orderIndex: number;
  description?: string;
  duration?: number;
  scormPackageId?: string;
  scormVersion?: '1.2' | '2004';
  assessmentId?: string;
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

interface LessonProgress {
  lessonId: string;
  completionPercentage: number;
  isCompleted: boolean;
  currentPosition?: number;
  suspendData?: string; // SCORM suspend data
  lastAccessedAt?: string;
}

interface XAPIStatement {
  actor: {
    name: string;
    mbox: string;
  };
  verb: {
    id: string;
    display: { 'en-US': string };
  };
  object: {
    id: string;
    definition: {
      name: { 'en-US': string };
      type: string;
    };
  };
  timestamp: string;
  result?: {
    duration?: string;
    completion?: boolean;
    success?: boolean;
  };
}

const UniversalLMSPlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  
  // Video player state
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  
  // SCORM state
  const scormIframeRef = useRef<HTMLIFrameElement>(null);
  const scormVersionRef = useRef<'1.2' | '2004' | null>(null);
  const scormDataRef = useRef<Record<string, string>>({});
  const scormInitializedRef = useRef(false);
  
  // xAPI statements queue
  const xapiStatementsRef = useRef<XAPIStatement[]>([]);
  
  // Heartbeat intervals
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  
  // User info
  const [user, setUser] = useState<any>(null);
  const { isOnline } = useOfflineDetection();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    if (courseId) {
      loadCourse();
      loadProgress();
    }

    // Set up heartbeat (every 10 seconds for video)
    heartbeatInterval.current = setInterval(() => {
      if (course && currentModuleIndex >= 0 && currentLessonIndex >= 0) {
        const currentLesson = course.modules[currentModuleIndex]?.lessons[currentLessonIndex];
        if (currentLesson?.type === 'Video' && playing) {
          saveVideoProgress();
        }
      }
    }, 10000);

    // Set up sync interval (every 15 seconds)
    syncInterval.current = setInterval(() => {
      if (isOnline) {
        syncProgress();
      }
    }, 15000);

    // Set up SCORM API in window
    setupSCORMAPI();

    // Cleanup
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
      cleanupSCORMAPI();
      if (isOnline) {
        syncProgress(); // Final save
      }
    };
  }, [courseId, isOnline]);

  // Setup SCORM Runtime API
  const setupSCORMAPI = useCallback(() => {
    // SCORM 1.2 API
    (window as any).API = {
      LMSInitialize: (param: string = '') => {
        scormInitializedRef.current = true;
        scormVersionRef.current = '1.2';
        return 'true';
      },
      LMSFinish: (param: string = '') => {
        if (scormInitializedRef.current) {
          LMSCommit();
          scormInitializedRef.current = false;
        }
        return 'true';
      },
      LMSGetValue: (element: string) => {
        const value = scormDataRef.current[element] || '';
        return value;
      },
      LMSSetValue: (element: string, value: string) => {
        scormDataRef.current[element] = value;
        
        // Handle completion
        if (element === 'cmi.core.lesson_status' && (value === 'completed' || value === 'passed')) {
          handleSCORMCompletion();
        }
        
        return 'true';
      },
      LMSCommit: (param: string = '') => {
        commitSCORMData();
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: (errorCode: string) => '',
      LMSGetDiagnostic: (errorCode: string) => '',
    };

    // SCORM 2004 API
    (window as any).API_1484_11 = {
      Initialize: (param: string = '') => {
        scormInitializedRef.current = true;
        scormVersionRef.current = '2004';
        return 'true';
      },
      Terminate: (param: string = '') => {
        if (scormInitializedRef.current) {
          Commit('');
          scormInitializedRef.current = false;
        }
        return 'true';
      },
      GetValue: (element: string) => {
        const value = scormDataRef.current[element] || '';
        return value;
      },
      SetValue: (element: string, value: string) => {
        scormDataRef.current[element] = value;
        
        // Handle completion
        if (element === 'cmi.completion_status' && (value === 'completed' || value === 'passed')) {
          handleSCORMCompletion();
        }
        
        return 'true';
      },
      Commit: (param: string = '') => {
        commitSCORMData();
        return 'true';
      },
      GetLastError: () => 0,
      GetErrorString: (errorCode: number) => '',
      GetDiagnostic: (errorCode: number) => '',
    };

    // Make API available to iframe
    (window as any).GetSCORM = () => {
      return scormVersionRef.current === '2004' 
        ? (window as any).API_1484_11 
        : (window as any).API;
    };
  }, []);

  const cleanupSCORMAPI = () => {
    delete (window as any).API;
    delete (window as any).API_1484_11;
    delete (window as any).GetSCORM;
  };

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
      
      if (response.data.data?.modules?.[0]) {
        setExpandedModules(new Set([response.data.data.modules[0]._id]));
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

      if (progressData?.lessonProgress) {
        setLessonProgress(progressData.lessonProgress);
        
        // Restore SCORM suspend data
        Object.entries(progressData.lessonProgress).forEach(([lessonId, prog]: [string, any]) => {
          if (prog.suspendData) {
            scormDataRef.current[`cmi.suspend_data`] = prog.suspendData;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const saveVideoProgress = useCallback(() => {
    const currentModule = course?.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    
    if (!currentLesson || currentLesson.type !== 'Video' || !playerRef.current) return;

    const video = playerRef.current.getInternalPlayer();
    if (!video) return;

    const currentTime = video.currentTime || 0;
    const totalDuration = video.duration || duration || 1;
    const percentWatched = (currentTime / totalDuration) * 100;

    updateLessonProgress(currentLesson._id || currentLesson.title, {
      completionPercentage: percentWatched,
      isCompleted: percentWatched >= 95,
      currentPosition: currentTime,
    });

    // Send xAPI statement for progress
    sendXAPIStatement('http://adlnet.gov/expapi/verbs/progressed', {
      id: currentLesson.contentUrl || '',
      name: currentLesson.title,
      type: 'http://adlnet.gov/expapi/activities/video',
    }, {
      duration: `PT${Math.floor(currentTime)}S`,
    });
  }, [course, currentModuleIndex, currentLessonIndex, duration]);

  const commitSCORMData = useCallback(async () => {
    const currentModule = course?.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    
    if (!currentLesson || currentLesson.type !== 'SCORM') return;

    const suspendData = scormDataRef.current['cmi.suspend_data'] || '';
    const lessonStatus = scormDataRef.current['cmi.core.lesson_status'] || 
                        scormDataRef.current['cmi.completion_status'] || '';

    updateLessonProgress(currentLesson._id || currentLesson.title, {
      completionPercentage: lessonStatus === 'completed' || lessonStatus === 'passed' ? 100 : 50,
      isCompleted: lessonStatus === 'completed' || lessonStatus === 'passed',
      suspendData,
    });
  }, [course, currentModuleIndex, currentLessonIndex]);

  const handleSCORMCompletion = () => {
    commitSCORMData();
    const currentModule = course?.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    
    if (currentLesson) {
      // Send xAPI completion statement
      sendXAPIStatement('http://adlnet.gov/expapi/verbs/completed', {
        id: currentLesson.scormPackageId || currentLesson.contentUrl || '',
        name: currentLesson.title,
        type: 'http://adlnet.gov/expapi/activities/module',
      }, {
        completion: true,
        success: true,
      });
      
      showToast('SCORM content completed!', 'info');
    }
  };

  const sendXAPIStatement = (
    verbId: string,
    object: { id: string; name: string; type: string },
    result?: { duration?: string; completion?: boolean; success?: boolean }
  ) => {
    if (!user) return;

    const statement: XAPIStatement = {
      actor: {
        name: `${user.firstName} ${user.lastName}`,
        mbox: `mailto:${user.email}`,
      },
      verb: {
        id: verbId,
        display: { 'en-US': getVerbDisplay(verbId) },
      },
      object: {
        id: object.id,
        definition: {
          name: { 'en-US': object.name },
          type: object.type,
        },
      },
      timestamp: new Date().toISOString(),
      result,
    };

    xapiStatementsRef.current.push(statement);
    
    // Send immediately if online
    if (isOnline) {
      syncXAPIStatements();
    }
  };

  const getVerbDisplay = (verbId: string): string => {
    const verbMap: Record<string, string> = {
      'http://adlnet.gov/expapi/verbs/launched': 'launched',
      'http://adlnet.gov/expapi/verbs/completed': 'completed',
      'http://adlnet.gov/expapi/verbs/progressed': 'progressed',
      'http://adlnet.gov/expapi/verbs/passed': 'passed',
      'http://adlnet.gov/expapi/verbs/failed': 'failed',
    };
    return verbMap[verbId] || 'experienced';
  };

  const syncXAPIStatements = async () => {
    if (xapiStatementsRef.current.length === 0) return;

    try {
      await api.post('/player/xapi-statements', {
        statements: xapiStatementsRef.current,
      });
      xapiStatementsRef.current = [];
    } catch (error) {
      console.error('Failed to sync xAPI statements:', error);
    }
  };

  const syncProgress = useCallback(async () => {
    if (!courseId || !course) return;

    const currentModule = course.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    
    if (!currentLesson) return;

    try {
      const lessonProg = lessonProgress[currentLesson._id || currentLesson.title] || {
        lessonId: currentLesson._id || currentLesson.title,
        completionPercentage: 0,
        isCompleted: false,
      };

      await api.patch('/player/sync', {
        courseId,
        moduleId: currentModule._id,
        lessonId: currentLesson._id || currentLesson.title,
        completionPercentage: lessonProg.completionPercentage,
        currentPosition: currentLesson.type === 'Video' ? played * duration : undefined,
        suspendData: scormDataRef.current['cmi.suspend_data'],
        scormData: scormDataRef.current,
        status: lessonProg.isCompleted ? 'completed' : 'in_progress',
      });

      // Sync xAPI statements
      await syncXAPIStatements();
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  }, [courseId, course, currentModuleIndex, currentLessonIndex, lessonProgress, played, duration, isOnline]);

  const updateLessonProgress = (lessonId: string, progress: Partial<LessonProgress>) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        lessonId,
        ...progress,
      },
    }));
  };

  const handleLessonClick = async (moduleIndex: number, lessonIndex: number) => {
    if (isLessonLocked(moduleIndex, lessonIndex)) {
      showToast('Please complete the previous lesson to unlock this content.', 'error');
      return;
    }

    if (course?.modules[moduleIndex].lessons[lessonIndex].type === 'Quiz') {
      if (isQuizLocked(moduleIndex, lessonIndex)) {
        showToast('Please complete at least 95% of the previous content to unlock this quiz.', 'error');
        return;
      }
      setShowQuiz(true);
      return;
    }

    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    
    const module = course?.modules[moduleIndex];
    if (module) {
      setExpandedModules(prev => new Set(prev).add(module._id));
    }

    // Load resume data for Audio/PDF
    const lesson = module?.lessons[lessonIndex];
    if (lesson && (lesson.type === 'Audio' || lesson.type === 'PDF')) {
      try {
        const response = await api.get(`/learner/resume/${lesson._id || lesson.title}?courseId=${courseId}`);
        if (response.data.success) {
          setResumeData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load resume data:', error);
        setResumeData(null);
      }
    } else {
      setResumeData(null);
    }

    // Send xAPI launched statement
    if (lesson) {
      sendXAPIStatement('http://adlnet.gov/expapi/verbs/launched', {
        id: lesson.contentUrl || lesson.scormPackageId || lesson._id || '',
        name: lesson.title,
        type: lesson.type === 'Video' 
          ? 'http://adlnet.gov/expapi/activities/video'
          : lesson.type === 'Audio'
          ? 'http://adlnet.gov/expapi/activities/audio'
          : 'http://adlnet.gov/expapi/activities/module',
      });
    }

    // Load SCORM suspend data if available
    if (lesson?.type === 'SCORM') {
      const lessonProg = lessonProgress[lesson._id || lesson.title];
      if (lessonProg?.suspendData) {
        scormDataRef.current['cmi.suspend_data'] = lessonProg.suspendData;
      }
    }
  };

  const isLessonLocked = (moduleIndex: number, lessonIndex: number): boolean => {
    if (moduleIndex === 0 && lessonIndex === 0) return false;

    const module = course?.modules[moduleIndex];
    if (!module) return true;

    if (lessonIndex > 0) {
      const previousLesson = module.lessons[lessonIndex - 1];
      const prevProg = lessonProgress[previousLesson._id || previousLesson.title];
      if (!prevProg?.isCompleted) return true;
    }

    if (lessonIndex === 0 && moduleIndex > 0) {
      const previousModule = course.modules[moduleIndex - 1];
      const lastLesson = previousModule.lessons[previousModule.lessons.length - 1];
      const lastProg = lessonProgress[lastLesson._id || lastLesson.title];
      if (!lastProg?.isCompleted) return true;
    }

    return false;
  };

  const isQuizLocked = (moduleIndex: number, lessonIndex: number): boolean => {
    const module = course?.modules[moduleIndex];
    if (!module) return true;

    const lesson = module.lessons[lessonIndex];
    if (lesson.type !== 'Quiz') return false;

    if (lessonIndex > 0) {
      const previousLesson = module.lessons[lessonIndex - 1];
      const prevProg = lessonProgress[previousLesson._id || previousLesson.title];
      return !prevProg || prevProg.completionPercentage < 95;
    }

    return true;
  };

  const showToast = (message: string, type: 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVideoProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      
      const currentModule = course?.modules[currentModuleIndex];
      const currentLesson = currentModule?.lessons[currentLessonIndex];
      if (currentLesson && currentLesson.type === 'Video') {
        const completionPercentage = state.played * 100;
        updateLessonProgress(currentLesson._id || currentLesson.title, {
          completionPercentage,
          isCompleted: completionPercentage >= 95,
          currentPosition: state.playedSeconds,
        });
      }
    }
  };

  const handleVideoEnd = () => {
    const currentModule = course?.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    
    if (currentLesson && currentLesson.type === 'Video') {
      updateLessonProgress(currentLesson._id || currentLesson.title, {
        completionPercentage: 100,
        isCompleted: true,
      });
      
      // Send xAPI completion statement
      sendXAPIStatement('http://adlnet.gov/expapi/verbs/completed', {
        id: currentLesson.contentUrl || '',
        name: currentLesson.title,
        type: 'http://adlnet.gov/expapi/activities/video',
      }, {
        completion: true,
        success: true,
      });
      
      showToast('Video completed! You can now proceed to the next lesson.', 'info');
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current) {
      const seekTo = parseFloat(e.currentTarget.value);
      playerRef.current.seekTo(seekTo);
      showToast('Please watch the full content to proceed.', 'error');
    }
  };

  const handleSaveAndExit = async () => {
    // Call LMSFinish for SCORM
    if (scormInitializedRef.current) {
      if (scormVersionRef.current === '2004') {
        (window as any).API_1484_11?.Terminate('');
      } else {
        (window as any).API?.LMSFinish('');
      }
    }
    
    // Final sync
    await syncProgress();
    navigate('/learner/dashboard');
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const loadSCORMPackage = async (contentUrl: string, version?: '1.2' | '2004') => {
    try {
      if (contentUrl && scormIframeRef.current) {
        scormVersionRef.current = version || '1.2';
        scormIframeRef.current.src = contentUrl;
      }
    } catch (error) {
      console.error('Failed to load SCORM package:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Course not found</p>
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

  if (showQuiz && currentLesson?.type === 'Quiz' && currentLesson.assessmentId) {
    return (
      <div className="min-h-screen bg-slate-900">
        <InteractiveQuizComponent
          assessmentId={currentLesson.assessmentId}
          courseId={courseId!}
          onComplete={(result) => {
            setShowQuiz(false);
            updateLessonProgress(currentLesson._id || currentLesson.title, {
              completionPercentage: 100,
              isCompleted: true,
            });
            loadProgress();
          }}
          onCancel={() => setShowQuiz(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-900 text-white overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white animate-slide-in`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar - Course Map */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-lg font-bold text-white line-clamp-2">{course.title}</h1>
          {progress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Overall Progress</span>
                <span>{progress.completionPercentage || 0}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress.completionPercentage || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Course Map */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {course.modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module._id);
              const moduleProgress = module.lessons.reduce((acc, lesson) => {
                const prog = lessonProgress[lesson._id || lesson.title];
                return acc + (prog?.completionPercentage || 0);
              }, 0) / module.lessons.length;

              return (
                <div key={module._id} className="border border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full p-3 bg-slate-750 hover:bg-slate-700 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-white">{module.title}</span>
                    </div>
                    <div className="text-xs text-gray-400">{Math.round(moduleProgress)}%</div>
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-800">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isLocked = isLessonLocked(moduleIndex, lessonIndex);
                        const isQuiz = lesson.type === 'Quiz';
                        const isQuizLockedState = isQuiz && isQuizLocked(moduleIndex, lessonIndex);
                        const lessonProg = lessonProgress[lesson._id || lesson.title];
                        const isActive = currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex;

                        return (
                          <button
                            key={lessonIndex}
                            onClick={() => handleLessonClick(moduleIndex, lessonIndex)}
                            disabled={isLocked || isQuizLockedState}
                            className={`w-full p-3 text-left border-t border-slate-700 flex items-center gap-3 transition-colors ${
                              isActive
                                ? 'bg-primary-600/20 border-l-4 border-l-primary-500'
                                : isLocked || isQuizLockedState
                                ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                                : 'hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {isLocked || isQuizLockedState ? (
                                <Lock className="w-4 h-4 text-gray-500" />
                              ) : lessonProg?.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : lesson.type === 'Video' ? (
                                <Video className="w-4 h-4 text-blue-400" />
                              ) : lesson.type === 'Audio' ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : lesson.type === 'Quiz' ? (
                                <Award className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${
                                isLocked || isQuizLockedState ? 'text-gray-500' : 'text-gray-300'
                              }`}>
                                {lesson.title}
                              </p>
                              {lessonProg && !isLocked && (
                                <div className="mt-1 w-full bg-slate-700 rounded-full h-1">
                                  <div
                                    className="bg-primary-500 h-1 rounded-full transition-all"
                                    style={{ width: `${lessonProg.completionPercentage}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save & Exit Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSaveAndExit}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Exit
          </button>
        </div>
      </div>

      {/* Main Content Area - Cinema Mode */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {currentLesson ? (
          <>
            {/* Lesson Header */}
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-400">{currentLesson.description}</p>
              )}
            </div>

            {/* Player Area */}
            <div className="flex-1 flex items-center justify-center p-6 bg-black">
              {currentLesson.type === 'Video' && currentLesson.contentUrl ? (
                <div className="w-full max-w-6xl">
                  <div className="relative">
                    {!isOnline && (
                      <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                        <div className="text-center text-white p-6">
                          <WifiOff className="w-16 h-16 mx-auto mb-4" />
                          <p className="text-xl font-semibold mb-2">Connection Lost</p>
                          <p className="text-gray-300">
                            Progress will sync once you are back online.
                          </p>
                        </div>
                      </div>
                    )}
                    <ReactPlayer
                      ref={playerRef}
                      url={currentLesson.contentUrl}
                      playing={playing && isOnline}
                      controls={false}
                      width="100%"
                      height="100%"
                      onProgress={handleVideoProgress}
                      onEnded={handleVideoEnd}
                      onDuration={setDuration}
                      onPlay={() => {
                        if (isOnline) {
                          setPlaying(true);
                        } else {
                          showToast('Please check your internet connection.', 'error');
                        }
                      }}
                      onPause={() => setPlaying(false)}
                      onSeek={(seconds) => {
                        showToast('Please watch the full content to proceed.', 'error');
                        if (playerRef.current) {
                          playerRef.current.seekTo(played);
                        }
                      }}
                      config={{
                        youtube: {
                          playerVars: {
                            controls: 0,
                            disablekb: 1,
                            modestbranding: 1,
                            rel: 0,
                          },
                        },
                        file: {
                          attributes: {
                            controlsList: 'nodownload',
                            onContextMenu: (e: any) => e.preventDefault(),
                          },
                        },
                      }}
                    />
                    {/* Custom Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            if (playerRef.current) {
                              if (playing) {
                                playerRef.current.getInternalPlayer()?.pause();
                              } else {
                                playerRef.current.getInternalPlayer()?.play();
                              }
                            }
                          }}
                          className="text-white hover:text-gray-300 transition-colors"
                        >
                          {playing ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6" />
                          )}
                        </button>
                        <div className="flex-1 text-white text-sm">
                          {Math.floor((played * duration) / 60)}:{(Math.floor(played * duration) % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${played * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentLesson.type === 'SCORM' && currentLesson.contentUrl ? (
                <div className="w-full h-full">
                  <iframe
                    ref={scormIframeRef}
                    className="w-full h-full border-0"
                    title="SCORM Content"
                    allow="fullscreen"
                    src={currentLesson.contentUrl}
                    onLoad={() => {
                      if (currentLesson.contentUrl) {
                        scormVersionRef.current = currentLesson.scormVersion || '1.2';
                        // SCORM API is already set up in window, the iframe will access it
                      }
                    }}
                  />
                </div>
              ) : currentLesson.type === 'PDF' && currentLesson.contentUrl ? (
                <PdfProgressViewer
                  fileUrl={currentLesson.contentUrl}
                  courseId={courseId!}
                  lessonId={currentLesson._id || currentLesson.title}
                  title={currentLesson.title}
                  initialPage={resumeData?.lastPage || 1}
                  onComplete={() => {
                    updateLessonProgress(currentLesson._id || currentLesson.title, {
                      completionPercentage: 100,
                      isCompleted: true,
                    });
                    loadProgress();
                  }}
                />
              ) : currentLesson.type === 'Audio' && currentLesson.contentUrl ? (
                <AudioPlayerResource
                  audioUrl={currentLesson.contentUrl}
                  courseId={courseId!}
                  lessonId={currentLesson._id || currentLesson.title}
                  title={currentLesson.title}
                  initialTime={resumeData?.lastTime || 0}
                  onComplete={() => {
                    updateLessonProgress(currentLesson._id || currentLesson.title, {
                      completionPercentage: 100,
                      isCompleted: true,
                    });
                    loadProgress();
                  }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Content not available</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Play className="w-16 h-16 mx-auto mb-4" />
              <p>Select a lesson to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalLMSPlayer;

