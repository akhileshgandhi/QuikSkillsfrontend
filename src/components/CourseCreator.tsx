import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Plus, Trash2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Eye, BookOpen, HelpCircle, Link, Building2, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import VideoPlayer from './VideoPlayer';
import api from '../utils/api';

interface CourseCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
  courseId?: string; // Optional course ID for editing
}

interface Module {
  id: string;
  title: string;
  subModules: SubModule[];
}

interface SubModule {
  id: string;
  title: string;
  resourceType: 'upload' | 'youtube' | null;
  resourceData: {
    file?: File | null;
    youtubeUrl?: string;
    videoUrl?: string;
    fileUrl?: string;
    scormManifest?: any;
  };
  quiz?: Quiz | null;
}

interface Quiz {
  questions: Question[];
  passingScore: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-3)
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ onClose, onSuccess, courseId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCourse, setLoadingCourse] = useState(!!courseId);
  const [isEditing, setIsEditing] = useState(!!courseId);
  
  // Step 1: Identity
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Hierarchy
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState<string | null>(null);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ current: 0, limit: 2 * 1024 * 1024 * 1024 }); // 2GB in bytes
  const [showStorageModal, setShowStorageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Quiz
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(80);

  // Tenant Selection (Step 3)
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load course data if editing
  useEffect(() => {
    if (courseId) {
      loadCourseForEdit(courseId);
    }
  }, [courseId]);

  // Load tenants when step 3 is reached
  useEffect(() => {
    if (currentStep === 3 && availableTenants.length === 0) {
      loadTenants();
    }
  }, [currentStep]);

  const loadCourseForEdit = async (id: string) => {
    try {
      setLoadingCourse(true);
      setError(null);
      const response = await api.get(`/courses/master/${id}`);
      const course = response.data.data;
      
      console.log('Loaded course data:', course); // Debug log
      
      // Populate form with course data
      setCourseTitle(course.title || '');
      setCourseCategory(course.category || '');
      if (course.thumbnailUrl) {
        setThumbnailPreview(course.thumbnailUrl);
      }
      
      // Convert course modules to the format expected by the form
      if (course.modules && course.modules.length > 0) {
        console.log('Course modules (raw):', JSON.stringify(course.modules, null, 2)); // Debug log
        
        const formattedModules: Module[] = course.modules.map((module: any, moduleIndex: number) => {
          console.log(`Module ${moduleIndex} (raw):`, JSON.stringify(module, null, 2)); // Debug log
          
          // Lessons are embedded in the module, so they should be directly accessible
          const lessons = module.lessons || [];
          console.log(`Module ${moduleIndex} lessons:`, lessons, `(count: ${lessons.length})`); // Debug log
          
          const subModules = lessons.map((lesson: any, lessonIndex: number) => {
            console.log(`Lesson ${lessonIndex}:`, JSON.stringify(lesson, null, 2)); // Debug log
            
            // Determine resource type based on lesson type
            let resourceType: 'upload' | 'youtube' | null = null;
            const resourceData: SubModule['resourceData'] = {};
            
            if (lesson.type === 'Video' && lesson.contentUrl) {
              resourceType = 'youtube'; // Video links are treated as YouTube/Vimeo links
              resourceData.videoUrl = lesson.contentUrl;
              resourceData.youtubeUrl = lesson.contentUrl;
            } else if (lesson.type === 'SCORM' && lesson.contentUrl) {
              resourceType = 'upload'; // SCORM is treated as upload
              resourceData.fileUrl = lesson.contentUrl;
            } else if (lesson.type && lesson.contentUrl) {
              // PDF, PPT, Text, etc.
              resourceType = 'upload';
              resourceData.fileUrl = lesson.contentUrl;
            }
            
            console.log(`Mapped lesson ${lessonIndex} - type: ${lesson.type}, contentUrl: ${lesson.contentUrl}, resourceType: ${resourceType}`); // Debug log
            
            return {
              id: lesson._id?.toString() || `submodule-${Date.now()}-${moduleIndex}-${lessonIndex}`,
              title: lesson.title || '',
              resourceType,
              resourceData,
              quiz: lesson.quiz || null, // Load quiz if it exists
            };
          });
          
          console.log(`Module ${moduleIndex} formatted subModules:`, subModules); // Debug log
          
          return {
            id: module._id?.toString() || `module-${Date.now()}-${moduleIndex}`,
            title: module.title || '',
            subModules,
          };
        });
        
        console.log('Final formatted modules:', JSON.stringify(formattedModules, null, 2)); // Debug log
        setModules(formattedModules);
      } else {
        console.warn('No modules found in course data'); // Debug log
        setModules([]);
      }
      
      // Load selected tenants
      if (course.selectedTenants && course.selectedTenants.length > 0) {
        setSelectedTenants(course.selectedTenants.map((id: any) => id.toString()));
      }
      
      setIsEditing(true);
    } catch (err: any) {
      console.error('Failed to load course:', err);
      setError(err.response?.data?.message || 'Failed to load course for editing');
    } finally {
      setLoadingCourse(false);
    }
  };

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const response = await api.get('/tenants');
      setAvailableTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setAvailableTenants([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const selectAllTenants = () => {
    if (selectedTenants.length === availableTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(availableTenants.map(t => t._id));
    }
  };

  // Check storage before upload (skip for master courses - no tenant ID needed)
  const checkStorage = async (fileSize: number): Promise<boolean> => {
    try {
      // For master courses, skip storage check or use a generous default
      // Master courses are stored separately and don't count against tenant storage
      const response = await api.get('/tenants/usage');
      const usage = response.data.data;
      const currentUsage = usage.currentUsage || 0;
      const limit = usage.storageLimit || 10 * 1024 * 1024 * 1024; // 10GB default for master courses
      
      setStorageUsage({ current: currentUsage, limit });
      
      if (currentUsage + fileSize > limit) {
        setShowStorageModal(true);
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Failed to check storage:', error);
      // For master courses, if tenant check fails, allow upload anyway
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Tenant ID')) {
        // This is a master course - allow upload without tenant ID
        setStorageUsage({ current: 0, limit: 10 * 1024 * 1024 * 1024 }); // 10GB default
        return true;
      }
      // Allow upload if check fails (graceful degradation)
      return true;
    }
  };

  // Step 1 Handlers
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Thumbnail size must be less than 5MB');
        return;
      }
      setThumbnail(file);
      setError(null);
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    }
  };

  const handleStep1Next = () => {
    if (!courseTitle.trim()) {
      setError('Course title is required');
      return;
    }
    if (!courseCategory.trim()) {
      setError('Course category is required');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  // Step 2 Handlers
  const handleAddModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      subModules: [],
    };
    setModules([...modules, newModule]);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const handleAddSubModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const newSubModule: SubModule = {
      id: `submodule-${Date.now()}`,
      title: `Sub-module ${module.subModules.length + 1}`,
      resourceType: null,
      resourceData: {},
      quiz: null,
    };

    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, subModules: [...m.subModules, newSubModule] }
        : m
    ));
  };

  const handleDeleteSubModule = (moduleId: string, subModuleId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, subModules: m.subModules.filter(sm => sm.id !== subModuleId) }
        : m
    ));
  };

  const handleOpenResourcePicker = (moduleId: string, subModuleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedSubModuleId(subModuleId);
    setShowResourcePicker(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedModuleId || !selectedSubModuleId) return;

    // Check storage
    const canUpload = await checkStorage(file.size);
    if (!canUpload) {
      return;
    }

    const module = modules.find(m => m.id === selectedModuleId);
    if (!module) return;

    setModules(modules.map(m => 
      m.id === selectedModuleId 
        ? {
            ...m,
            subModules: m.subModules.map(sm => 
              sm.id === selectedSubModuleId
                ? { ...sm, resourceType: 'upload', resourceData: { file } }
                : sm
            ),
          }
        : m
    ));

    setShowResourcePicker(false);
    setSelectedModuleId(null);
    setSelectedSubModuleId(null);
  };

  const handleVideoLink = () => {
    const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):');
    if (!url || !selectedModuleId || !selectedSubModuleId) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Invalid URL format');
      return;
    }

    const module = modules.find(m => m.id === selectedModuleId);
    if (!module) return;

    setModules(modules.map(m => 
      m.id === selectedModuleId 
        ? {
            ...m,
            subModules: m.subModules.map(sm => 
              sm.id === selectedSubModuleId
                ? { ...sm, resourceType: 'youtube', resourceData: { youtubeUrl: url, videoUrl: url } }
                : sm
            ),
          }
        : m
    ));

    setShowResourcePicker(false);
    setSelectedModuleId(null);
    setSelectedSubModuleId(null);
    setError(null);
  };

  const handleRemoveResource = (moduleId: string, subModuleId: string) => {
    setModules(modules.map(m =>
      m.id === moduleId
        ? {
            ...m,
            subModules: m.subModules.map(sm =>
              sm.id === subModuleId
                ? { ...sm, resourceType: null, resourceData: {} }
                : sm
            ),
          }
        : m
    ));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedModuleId) return;

    const module = modules.find(m => m.id === selectedModuleId);
    if (!module) return;

    const items = Array.from(module.subModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setModules(modules.map(m => 
      m.id === selectedModuleId 
        ? { ...m, subModules: items }
        : m
    ));
  };

  const handleStep2Next = () => {
    if (modules.length === 0) {
      setError('Please add at least one module');
      return;
    }
    setError(null);
    setCurrentStep(3);
  };

  // Step 3 Handlers
  const handleOpenQuizEditor = (moduleId: string, subModuleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedSubModuleId(subModuleId);
    const module = modules.find(m => m.id === moduleId);
    const subModule = module?.subModules.find(sm => sm.id === subModuleId);
    
    if (subModule?.quiz) {
      setQuizQuestions(subModule.quiz.questions);
      setPassingScore(subModule.quiz.passingScore);
    } else {
      setQuizQuestions([]);
      setPassingScore(80);
    }
    setShowQuizEditor(true);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };

  const handleSaveQuiz = () => {
    if (!selectedModuleId || !selectedSubModuleId) return;
    if (quizQuestions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    const quiz: Quiz = {
      questions: quizQuestions,
      passingScore,
    };

    setModules(modules.map(m => 
      m.id === selectedModuleId 
        ? {
            ...m,
            subModules: m.subModules.map(sm => 
              sm.id === selectedSubModuleId
                ? { ...sm, quiz }
                : sm
            ),
          }
        : m
    ));

    setShowQuizEditor(false);
    setSelectedModuleId(null);
    setSelectedSubModuleId(null);
    setError(null);
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      // Upload thumbnail first
      let thumbnailUrl = '';
      if (thumbnail) {
        try {
          const formData = new FormData();
          formData.append('file', thumbnail);
          formData.append('type', 'course-thumbnail');
          // Don't manually set Content-Type - let axios set it automatically for FormData
          const thumbResponse = await api.post('/upload/course-thumbnail', formData);
          thumbnailUrl = thumbResponse.data.data.url;
        } catch (thumbError: any) {
          console.error('Thumbnail upload error:', thumbError);
          setError(thumbError.response?.data?.message || 'Failed to upload thumbnail. You can continue without it.');
          // Allow course creation to continue without thumbnail
          thumbnailUrl = '';
        }
      }

      // Upload all files for sub-modules
      const processedModules = await Promise.all(
        modules.map(async (module) => {
          const processedSubModules = await Promise.all(
            module.subModules.map(async (subModule) => {
              let resourceData = { ...subModule.resourceData };

              // Upload file if it's a file upload
              if (subModule.resourceType === 'upload' && subModule.resourceData.file) {
                const file = subModule.resourceData.file;
                
                // Check if it's SCORM (ZIP file)
                if (file.name.endsWith('.zip')) {
                  const formData = new FormData();
                  formData.append('file', file);
                  // Don't manually set Content-Type - let axios set it automatically for FormData
                  const scormResponse = await api.post('/upload/scorm', formData);
                  resourceData = {
                    fileUrl: scormResponse.data.data.indexHtmlUrl,
                    scormManifest: scormResponse.data.data.manifest,
                  };
                } else {
                  // Regular file upload (PDF, PPT, etc.)
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('type', 'course-resource');
                  // Don't manually set Content-Type - let axios set it automatically for FormData
                  const fileResponse = await api.post('/upload/course-resource', formData);
                  resourceData = {
                    fileUrl: fileResponse.data.data.url,
                  };
                }
              }

              return {
                title: subModule.title,
                resourceType: subModule.resourceType,
                resourceData,
                quiz: subModule.quiz,
              };
            })
          );

          return {
            title: module.title,
            subModules: processedSubModules,
          };
        })
      );

      // Prepare course data
      const courseData = {
        title: courseTitle,
        category: courseCategory,
        thumbnail: thumbnailUrl,
        modules: processedModules,
        selectedTenants: selectedTenants, // Include selected tenants
      };

      // Create or update course
      let response;
      if (isEditing && courseId) {
        // Update existing course
        response = await api.put(`/courses/master/${courseId}`, courseData);
      } else {
        // Create new course
        response = await api.post('/courses/master', courseData);
      }
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || `Failed to ${isEditing ? 'update' : 'create'} course`);
      }
    } catch (err: any) {
      console.error('Course creation error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to create course';
      setError(errorMessage);
      
      // If unauthorized, suggest logging in again
      if (err.response?.status === 401) {
        setError(`${errorMessage}. Please try logging out and logging back in.`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Master Course' : 'Create Master Course'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep} of 3: {currentStep === 1 ? 'Identity' : currentStep === 2 ? 'Hierarchy' : 'Review & Distribution'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= step ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Identity' : step === 2 ? 'Hierarchy' : 'Distribution'}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="label-field">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label className="label-field">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label-field">Course Thumbnail</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Click to upload thumbnail
                    </p>
                    <p className="text-xs text-gray-500">Image file (max 5MB)</p>
                  </label>
                </div>
                {thumbnailPreview && (
                  <div className="mt-4">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-48 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleStep1Next}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Hierarchy */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Course Structure</h3>
                <button
                  onClick={handleAddModule}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">No modules yet. Click "Add Module" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => {
                            setModules(modules.map(m => 
                              m.id === module.id ? { ...m, title: e.target.value } : m
                            ));
                          }}
                          className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
                          placeholder="Module title"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              handleAddSubModule(module.id);
                            }}
                            className="btn-secondary text-sm inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Sub-module
                          </button>
                          <button
                            onClick={() => handleDeleteModule(module.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId={module.id}>
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                              {module.subModules.map((subModule, index) => (
                                <Draggable key={subModule.id} draggableId={subModule.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`bg-gray-50 rounded-lg p-3 flex items-center justify-between ${
                                        snapshot.isDragging ? 'shadow-lg' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                          <FileText className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                          type="text"
                                          value={subModule.title}
                                          onChange={(e) => {
                                            setModules(modules.map(m => 
                                              m.id === module.id 
                                                ? {
                                                    ...m,
                                                    subModules: m.subModules.map(sm => 
                                                      sm.id === subModule.id 
                                                        ? { ...sm, title: e.target.value }
                                                        : sm
                                                    ),
                                                  }
                                                : m
                                            ));
                                          }}
                                          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
                                          placeholder="Sub-module title"
                                        />
                                        {subModule.resourceType === 'upload' && (
                                          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {subModule.resourceData.file?.name || 
                                             (subModule.resourceData.fileUrl ? 
                                               subModule.resourceData.fileUrl.split('/').pop() || 'File uploaded' : 
                                               'File uploaded')}
                                          </span>
                                        )}
                                        {subModule.resourceType === 'youtube' && (
                                          <span className="text-xs text-blue-600 inline-flex items-center gap-1">
                                            <Link className="w-4 h-4" />
                                            {subModule.resourceData.videoUrl || subModule.resourceData.youtubeUrl || 'Video Link'}
                                          </span>
                                        )}
                                        {subModule.quiz && (
                                          <span className="text-xs text-green-600">Quiz added</span>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        {!subModule.resourceType && (
                                          <button
                                            onClick={() => handleOpenResourcePicker(module.id, subModule.id)}
                                            className="btn-secondary text-xs"
                                          >
                                            Add Resource
                                          </button>
                                        )}
                                        {subModule.resourceType && (
                                          <button
                                            onClick={() => handleOpenResourcePicker(module.id, subModule.id)}
                                            className="btn-secondary text-xs"
                                          >
                                            Change Resource
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleOpenQuizEditor(module.id, subModule.id)}
                                          className="btn-secondary text-xs"
                                        >
                                          {subModule.quiz ? 'Edit Quiz' : 'Add Quiz'}
                                        </button>
                                        <button
                                          onClick={() => handleRemoveResource(module.id, subModule.id)}
                                          className="text-red-600 hover:text-red-700"
                                          title="Remove resource"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSubModule(module.id, subModule.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleStep2Next}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Tenant Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Review & Tenant Selection</h3>
                <button
                  onClick={() => setShowPreview(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Course
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{courseTitle}</h4>
                <p className="text-sm text-gray-600">Category: {courseCategory}</p>
                <p className="text-sm text-gray-600">Modules: {modules.length}</p>
                <p className="text-sm text-gray-600">
                  Total Sub-modules: {modules.reduce((sum, m) => sum + m.subModules.length, 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Quizzes: {modules.reduce((sum, m) => 
                    sum + m.subModules.filter(sm => sm.quiz).length, 0
                  )}
                </p>
              </div>

              {/* Tenant Selection */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Select Tenants for Course Distribution
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose which tenant organizations should have access to this master course
                    </p>
                  </div>
                  <button
                    onClick={selectAllTenants}
                    className="btn-secondary text-sm"
                  >
                    {selectedTenants.length === availableTenants.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {loadingTenants ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : availableTenants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tenants available. Create tenants first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {availableTenants.map((tenant) => (
                      <div
                        key={tenant._id}
                        onClick={() => toggleTenantSelection(tenant._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedTenants.includes(tenant._id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedTenants.includes(tenant._id)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTenants.includes(tenant._id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tenant.orgName}</p>
                          <p className="text-xs text-gray-500">{tenant.subdomain}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTenants.length > 0 && (
                  <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                    <p className="text-sm text-primary-800">
                      <strong>{selectedTenants.length}</strong> tenant{selectedTenants.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                    onClick={handleFinalSubmit}
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {isEditing ? 'Update Course' : 'Create Course'}
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Picker Modal */}
      {showResourcePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Resource</h3>
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload File (PDF, PPT, Excel, Docs, Audio, Video, SCORM)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx,.mp3,.mp4,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={handleVideoLink}
                className="w-full btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Link className="w-4 h-4" />
                Add Link (YouTube, Vimeo, etc.)
              </button>
            </div>
            <button
              onClick={() => {
                setShowResourcePicker(false);
                setSelectedModuleId(null);
                setSelectedSubModuleId(null);
              }}
              className="mt-4 w-full btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Storage Limit Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Storage Limit Exceeded</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Your current storage usage is {(storageUsage.current / 1024 / 1024 / 1024).toFixed(2)} GB out of {(storageUsage.limit / 1024 / 1024 / 1024).toFixed(2)} GB limit.
              Please free up some space or upgrade your plan.
            </p>
            <button
              onClick={() => setShowStorageModal(false)}
              className="w-full btn-primary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Quiz Editor Modal */}
      {showQuizEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quiz Editor</h3>
              <button
                onClick={() => {
                  setShowQuizEditor(false);
                  setSelectedModuleId(null);
                  setSelectedSubModuleId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label-field">Passing Score (%)</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Questions</h4>
                <button
                  onClick={handleAddQuestion}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Question {qIndex + 1}</span>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => {
                      setQuizQuestions(quizQuestions.map(q => 
                        q.id === question.id ? { ...q, text: e.target.value } : q
                      ));
                    }}
                    className="input-field mb-3"
                    placeholder="Enter question text"
                  />
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => {
                            setQuizQuestions(quizQuestions.map(q => 
                              q.id === question.id ? { ...q, correctAnswer: oIndex } : q
                            ));
                          }}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[oIndex] = e.target.value;
                            setQuizQuestions(quizQuestions.map(q => 
                              q.id === question.id ? { ...q, options: newOptions } : q
                            ));
                          }}
                          className="input-field flex-1"
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowQuizEditor(false);
                  setSelectedModuleId(null);
                  setSelectedSubModuleId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuiz}
                className="btn-primary"
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Preview Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Course Preview</h3>
                  <p className="text-sm text-gray-600">How your course will appear to learners</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white mb-6">
                <div className="flex items-start gap-6">
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Course thumbnail"
                      className="w-32 h-20 object-cover rounded-lg border-2 border-white shadow-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium mb-3">
                      {courseCategory}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{courseTitle || 'Course Title'}</h1>
                    <div className="flex items-center gap-6 text-sm text-white/90">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{modules.length} Module{modules.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{modules.reduce((sum, m) => sum + m.subModules.length, 0)} Lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>{modules.reduce((sum, m) => sum + m.subModules.filter(sm => sm.quiz).length, 0)} Quiz{modules.reduce((sum, m) => sum + m.subModules.filter(sm => sm.quiz).length, 0) !== 1 ? 'zes' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">{moduleIndex + 1}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                      </div>
                    </div>

                    {/* Sub-modules */}
                    <div className="divide-y divide-gray-200">
                      {module.subModules.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                          <p>No sub-modules in this module</p>
                        </div>
                      ) : (
                        module.subModules.map((subModule, subIndex) => (
                          <div key={subModule.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-sm text-gray-600 font-medium">
                                  {moduleIndex + 1}.{subIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-2">{subModule.title}</h4>
                                
                                {/* Resource Preview */}
                                {subModule.resourceType === 'upload' && subModule.resourceData.file && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{subModule.resourceData.file.name}</span>
                                    <span className="text-xs text-gray-400">
                                      ({(subModule.resourceData.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                )}
                                
                                {subModule.resourceType === 'youtube' && (subModule.resourceData.youtubeUrl || subModule.resourceData.videoUrl) && (
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                                      <Link className="w-4 h-4" />
                                      <span className="truncate">{subModule.resourceData.videoUrl || subModule.resourceData.youtubeUrl}</span>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-gray-200">
                                      <VideoPlayer
                                        videoUrl={subModule.resourceData.videoUrl || subModule.resourceData.youtubeUrl || ''}
                                        title={subModule.title}
                                      />
                                    </div>
                                  </div>
                                )}

                                {!subModule.resourceType && (
                                  <div className="text-sm text-gray-400 italic">No resource added</div>
                                )}

                                {/* Quiz Badge */}
                                {subModule.quiz && (
                                  <div className="mt-2 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                    <HelpCircle className="w-3 h-3" />
                                    Quiz ({subModule.quiz.questions.length} questions, {subModule.quiz.passingScore}% passing score)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}

                {modules.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No modules added yet</p>
                  </div>
                )}
              </div>

              {/* Preview Footer */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-primary"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreator;

