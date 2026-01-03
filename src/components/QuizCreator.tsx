import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../utils/api';

interface QuizCreatorProps {
  moduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuestionForm {
  text: string;
  type: 'MCQ' | 'True/False';
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}

interface QuizForm {
  title: string;
  questions: QuestionForm[];
  passingScore: number;
  retryLimit: number;
  timeLimit?: number;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ moduleId, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuizForm>({
    defaultValues: {
      title: '',
      questions: [
        {
          text: '',
          type: 'MCQ',
          options: ['', ''],
          correctAnswerIndex: 0,
          points: 1,
        },
      ],
      passingScore: 80,
      retryLimit: 3,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: QuizForm) => {
    setSubmitting(true);
    setError(null);

    try {
      // Validate questions
      const validQuestions = data.questions.filter(
        (q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2,
      );

      if (validQuestions.length === 0) {
        setError('Please add at least one valid question');
        setSubmitting(false);
        return;
      }

      await api.post('/assessments', {
        moduleId,
        title: data.title,
        questions: validQuestions.map((q) => ({
          text: q.text,
          type: q.type,
          options: q.options.filter((o) => o.trim()),
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation,
          points: q.points || 1,
        })),
        passingScore: data.passingScore,
        retryLimit: data.retryLimit,
        timeLimit: data.timeLimit || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create quiz');
      setSubmitting(false);
    }
  };

  const addQuestion = () => {
    append({
      text: '',
      type: 'MCQ',
      options: ['', ''],
      correctAnswerIndex: 0,
      points: 1,
    });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = watch(`questions.${questionIndex}.options`);
    const newOptions = [...currentOptions, ''];
    // Update options array
    const questions = watch('questions');
    questions[questionIndex].options = newOptions;
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const questions = watch('questions');
    questions[questionIndex].options.splice(optionIndex, 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Quiz</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label-field">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title', { required: 'Quiz title is required' })}
                className="input-field"
                placeholder="Enter quiz title"
                disabled={submitting}
              />
              {errors.title && (
                <p className="error-message">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-field">
                  Passing Score (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('passingScore', {
                    required: true,
                    min: 0,
                    max: 100,
                  })}
                  className="input-field"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="label-field">Retry Limit</label>
                <input
                  type="number"
                  {...register('retryLimit', { min: 0 })}
                  className="input-field"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="label-field">Time Limit (minutes)</label>
                <input
                  type="number"
                  {...register('timeLimit', { min: 0 })}
                  className="input-field"
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-primary text-sm"
                  disabled={submitting}
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-6">
                {fields.map((field, questionIndex) => {
                  const questionType = watch(`questions.${questionIndex}.type`);
                  const options = watch(`questions.${questionIndex}.options`);

                  return (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Question {questionIndex + 1}
                        </h4>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(questionIndex)}
                            className="text-red-600 hover:text-red-700 text-sm"
                            disabled={submitting}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="label-field">Question Text</label>
                          <textarea
                            {...register(
                              `questions.${questionIndex}.text` as const,
                              { required: 'Question text is required' },
                            )}
                            className="input-field"
                            rows={2}
                            placeholder="Enter your question"
                            disabled={submitting}
                          />
                        </div>

                        <div>
                          <label className="label-field">Question Type</label>
                          <select
                            {...register(
                              `questions.${questionIndex}.type` as const,
                            )}
                            className="input-field"
                            disabled={submitting}
                          >
                            <option value="MCQ">Multiple Choice</option>
                            <option value="True/False">True/False</option>
                          </select>
                        </div>

                        {questionType === 'MCQ' && (
                          <div>
                            <label className="label-field">Options</label>
                            {options.map((_, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex items-center gap-2 mb-2"
                              >
                                <input
                                  type="radio"
                                  {...register(
                                    `questions.${questionIndex}.correctAnswerIndex` as const,
                                  )}
                                  value={optionIndex}
                                  className="w-4 h-4 text-primary-600"
                                  disabled={submitting}
                                />
                                <input
                                  {...register(
                                    `questions.${questionIndex}.options.${optionIndex}` as const,
                                    { required: 'Option text is required' },
                                  )}
                                  className="input-field flex-1"
                                  placeholder={`Option ${optionIndex + 1}`}
                                  disabled={submitting}
                                />
                                {options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOption(questionIndex, optionIndex)
                                    }
                                    className="text-red-600 hover:text-red-700"
                                    disabled={submitting}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                              disabled={submitting}
                            >
                              + Add Option
                            </button>
                          </div>
                        )}

                        {questionType === 'True/False' && (
                          <div>
                            <label className="label-field">Correct Answer</label>
                            <select
                              {...register(
                                `questions.${questionIndex}.correctAnswerIndex` as const,
                              )}
                              className="input-field"
                              disabled={submitting}
                            >
                              <option value={0}>True</option>
                              <option value={1}>False</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="label-field">Points</label>
                          <input
                            type="number"
                            {...register(
                              `questions.${questionIndex}.points` as const,
                              { min: 1, valueAsNumber: true },
                            )}
                            className="input-field"
                            defaultValue={1}
                            disabled={submitting}
                          />
                        </div>

                        <div>
                          <label className="label-field">
                            Explanation (Optional)
                          </label>
                          <textarea
                            {...register(
                              `questions.${questionIndex}.explanation` as const,
                            )}
                            className="input-field"
                            rows={2}
                            placeholder="Explanation shown after quiz submission"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;

