import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../utils/api';
import ResourceUploader from './ResourceUploader';
import QuizCreator from './QuizCreator';

interface Lesson {
  title: string;
  type: string;
  contentUrl?: string;
  orderIndex: number;
  isMaster?: boolean;
  description?: string;
  duration?: number;
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
  status: string;
}

interface CourseBuilderProps {
  courseId: string;
}

function SortableModule({
  module,
  onAddLesson,
  onAddQuiz,
  onUpdateLessonOrder,
}: {
  module: Module;
  onAddLesson: (moduleId: string) => void;
  onAddQuiz: (moduleId: string) => void;
  onUpdateLessonOrder: (moduleId: string, indices: number[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = module.lessons.findIndex(
      (_l, i) => `lesson-${i}` === active.id,
    );
    const newIndex = module.lessons.findIndex(
      (_l, i) => `lesson-${i}` === over.id,
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
      const indices = newLessons.map((_, i) => i);
      onUpdateLessonOrder(module._id, indices);
    }
  };

  const lessonSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-md p-6 mb-4"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-4 cursor-move"
      >
        <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onAddLesson(module._id)}
            className="btn-primary text-sm"
          >
            + Add Lesson
          </button>
          <button
            onClick={() => onAddQuiz(module._id)}
            className="btn-secondary text-sm"
          >
            + Add Quiz
          </button>
        </div>
      </div>

      <DndContext
        sensors={lessonSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext
          items={module.lessons.map((_, i) => `lesson-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {module.lessons.map((lesson, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">⋮⋮</span>
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {lesson.type} {lesson.duration && `• ${lesson.duration} min`}
                    </p>
                  </div>
                </div>
                {lesson.contentUrl && (
                  <a
                    href={lesson.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {module.lessons.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">
          No lessons yet. Click "Add Lesson" to get started.
        </p>
      )}
    </div>
  );
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [quizModuleId, setQuizModuleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadCourse();
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !course) return;

    const oldIndex = course.modules.findIndex((m) => m._id === active.id);
    const newIndex = course.modules.findIndex((m) => m._id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newModules = arrayMove(course.modules, oldIndex, newIndex);
      setCourse({ ...course, modules: newModules });

      // Update order in backend
      try {
        await api.put(`/courses/${courseId}/modules/order`, {
          moduleIds: newModules.map((m) => m._id),
        });
      } catch (error) {
        console.error('Failed to update module order:', error);
        loadCourse(); // Revert on error
      }
    }
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModule(moduleId);
    setShowUploader(true);
  };

  const handleAddQuiz = (moduleId: string) => {
    setQuizModuleId(moduleId);
    setShowQuizCreator(true);
  };

  const handleLessonAdded = () => {
    setShowUploader(false);
    setSelectedModule(null);
    loadCourse();
  };

  const handleQuizCreated = () => {
    setShowQuizCreator(false);
    setQuizModuleId(null);
    loadCourse();
  };

  const handleUpdateLessonOrder = async (
    moduleId: string,
    indices: number[],
  ) => {
    try {
      await api.put(`/courses/modules/${moduleId}/lessons/order`, {
        lessonIndices: indices,
      });
      loadCourse();
    } catch (error) {
      console.error('Failed to update lesson order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-gray-600">{course.description}</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={course.modules.map((m) => m._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {course.modules.map((module) => (
              <SortableModule
                key={module._id}
                module={module}
                onAddLesson={handleAddLesson}
                onAddQuiz={handleAddQuiz}
                onUpdateLessonOrder={handleUpdateLessonOrder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {course.modules.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No modules yet.</p>
          <button className="btn-primary">Add First Module</button>
        </div>
      )}

      {showUploader && selectedModule && (
        <ResourceUploader
          moduleId={selectedModule}
          courseId={courseId}
          onClose={() => {
            setShowUploader(false);
            setSelectedModule(null);
          }}
          onSuccess={handleLessonAdded}
        />
      )}

      {showQuizCreator && quizModuleId && (
        <QuizCreator
          moduleId={quizModuleId}
          onClose={() => {
            setShowQuizCreator(false);
            setQuizModuleId(null);
          }}
          onSuccess={handleQuizCreated}
        />
      )}
    </div>
  );
};

export default CourseBuilder;

