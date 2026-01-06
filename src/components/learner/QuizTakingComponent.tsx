import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

interface Question {
  text: string;
  type: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}

interface Assessment {
  _id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  retryLimit: number;
  timeLimit?: number;
}

interface QuizTakingComponentProps {
  assessmentId: string;
  courseId: string;
  onComplete: (result: { passed: boolean; percentage: number }) => void;
  onCancel: () => void;
}

const QuizTakingComponent: React.FC<QuizTakingComponentProps> = ({
  assessmentId,
  courseId,
  onComplete,
  onCancel,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (assessment?.timeLimit && timeRemaining !== null) {
      if (timeRemaining <= 0) {
        handleSubmit();
        return;
      }
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, assessment]);

  const loadAssessment = async () => {
    try {
      const response = await api.get(`/assessments/${assessmentId}`);
      setAssessment(response.data.data);
      if (response.data.data.timeLimit) {
        setTimeRemaining(response.data.data.timeLimit * 60); // Convert to seconds
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (assessment && currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    const unanswered = assessment.questions.filter(
      (_, index) => answers[index] === undefined
    );

    if (unanswered.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const submitAnswers = assessment.questions.map((_, index) => ({
        questionId: index.toString(),
        selectedAnswerIndex: answers[index] ?? -1,
      }));

      const response = await api.post('/assessments/submit', {
        assessmentId: assessment._id,
        courseId: courseId,
        answers: submitAnswers,
      });

      onComplete({
        passed: response.data.data.passed,
        percentage: response.data.data.percentage,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button onClick={onCancel} className="btn-secondary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{assessment.title}</h2>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-600">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {assessment.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {answeredCount} / {assessment.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {question.text}
          </h3>

          {question.type === 'MCQ' && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === index}
                    onChange={() => handleAnswerSelect(currentQuestion, index)}
                    className="w-4 h-4 text-primary-600 mr-3"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'True/False' && (
            <div className="space-y-3">
              {['True', 'False'].map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === index}
                    onChange={() => handleAnswerSelect(currentQuestion, index)}
                    className="w-4 h-4 text-primary-600 mr-3"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="btn-secondary"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {currentQuestion < assessment.questions.length - 1 ? (
            <button onClick={handleNext} className="btn-primary">
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {assessment.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-full border-2 transition-all ${
              index === currentQuestion
                ? 'border-primary-600 bg-primary-600 text-white'
                : answers[index] !== undefined
                ? 'border-green-500 bg-green-100 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default QuizTakingComponent;

