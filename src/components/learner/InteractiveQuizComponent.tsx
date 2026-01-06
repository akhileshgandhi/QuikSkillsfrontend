import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, Award, RotateCcw, 
  Download, BookOpen, AlertCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
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
  timeLimit?: number; // in minutes
}

interface QuizResult {
  passed: boolean;
  percentage: number;
  score: number;
  totalPoints: number;
  attemptsRemaining?: number;
  certificateUrl?: string;
}

interface InteractiveQuizComponentProps {
  assessmentId: string;
  courseId: string;
  onComplete: (result: QuizResult) => void;
  onCancel: () => void;
}

const InteractiveQuizComponent: React.FC<InteractiveQuizComponentProps> = ({
  assessmentId,
  courseId,
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAssessment();
    loadAttemptsRemaining();
  }, [assessmentId, courseId]);

  useEffect(() => {
    if (assessment?.timeLimit && timeRemaining !== null && !result) {
      if (timeRemaining <= 0) {
        handleSubmit();
        return;
      }
      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    }
  }, [timeRemaining, assessment, result]);

  const loadAssessment = async () => {
    try {
      const response = await api.get(`/assessments/${assessmentId}`);
      const assessmentData = response.data.data;
      setAssessment(assessmentData);
      
      if (assessmentData.timeLimit) {
        setTimeRemaining(assessmentData.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptsRemaining = async () => {
    try {
      // Get previous attempts for this assessment
      const response = await api.get(`/learner/assessments/${assessmentId}/attempts`);
      const attempts = response.data.data || [];
      const assessmentData = await api.get(`/assessments/${assessmentId}`);
      const retryLimit = assessmentData.data.data?.retryLimit || 3;
      const remaining = Math.max(0, retryLimit - attempts.length);
      setAttemptsRemaining(remaining);
    } catch (error) {
      // If endpoint doesn't exist, assume unlimited attempts
      console.error('Failed to load attempts:', error);
      // Try to get retry limit from assessment
      try {
        const assessmentData = await api.get(`/assessments/${assessmentId}`);
        const retryLimit = assessmentData.data.data?.retryLimit || 3;
        setAttemptsRemaining(retryLimit);
      } catch (e) {
        // Default to 3 attempts
        setAttemptsRemaining(3);
      }
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

    // Clear timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

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

      // Submit to learner endpoint
      const response = await api.post('/learner/submit-quiz', {
        assessmentId: assessment._id,
        courseId: courseId,
        answers: submitAnswers,
      });

      const quizResult: QuizResult = {
        passed: response.data.data.passed,
        percentage: response.data.data.percentage,
        score: response.data.data.score || 0,
        totalPoints: response.data.data.totalPoints || assessment.questions.reduce((sum, q) => sum + q.points, 0),
        attemptsRemaining: attemptsRemaining !== null ? Math.max(0, (attemptsRemaining || 0) - 1) : undefined,
        certificateUrl: response.data.data.certificateUrl,
      };

      setResult(quizResult);
      setSubmitting(false);
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

  const handleDownloadCertificate = () => {
    if (result?.certificateUrl) {
      window.open(result.certificateUrl, '_blank');
    }
  };

  const handleReviewModules = () => {
    navigate(`/learner/course/${courseId}`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-800 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button onClick={onCancel} className="btn-primary w-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (result && assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            {/* Result Icon */}
            <div className="mb-6">
              {result.passed ? (
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
              ) : (
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-red-600" />
                </div>
              )}
            </div>

            {/* Result Message */}
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              {result.passed ? 'Congratulations!' : 'Quiz Completed'}
            </h2>
            <p className={`text-xl font-semibold mb-6 ${
              result.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.passed ? 'You Passed!' : 'You Failed'}
            </p>

            {/* Score Display */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Your Score</p>
                  <p className={`text-5xl font-bold ${
                    result.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.percentage}%
                  </p>
                </div>
                <div className="border-l border-gray-300 pl-6">
                  <p className="text-sm text-gray-500 mb-2">Points</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {result.score} / {result.totalPoints}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {result.passed ? (
              <div className="space-y-4">
                <button
                  onClick={handleDownloadCertificate}
                  className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg"
                >
                  <Download className="w-6 h-6" />
                  Download Certificate
                </button>
                <button
                  onClick={() => onComplete(result)}
                  className="btn-secondary w-full py-3"
                >
                  Continue Course
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {result.attemptsRemaining !== undefined && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-800">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">
                        {result.attemptsRemaining > 0
                          ? `${result.attemptsRemaining} attempt(s) remaining`
                          : 'No attempts remaining'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  {result.attemptsRemaining !== undefined && result.attemptsRemaining > 0 ? (
                    <button
                      onClick={() => {
                        setResult(null);
                        setAnswers({});
                        setCurrentQuestion(0);
                        setTimeRemaining(assessment.timeLimit ? assessment.timeLimit * 60 : null);
                        loadAttemptsRemaining();
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Retake Quiz
                    </button>
                  ) : null}
                  <button
                    onClick={handleReviewModules}
                    className={`${result.attemptsRemaining === 0 ? 'btn-primary flex-1' : 'btn-secondary'} flex items-center justify-center gap-2 py-3`}
                  >
                    <BookOpen className="w-5 h-5" />
                    Review Modules
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  if (!assessment) return null;

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestion === assessment.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{assessment.title}</h2>
                <p className="text-primary-100 text-sm">
                  Question {currentQuestion + 1} of {assessment.questions.length}
                </p>
              </div>
              {timeRemaining !== null && (
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <Clock className="w-6 h-6" />
                  <span className="text-2xl font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-primary-100">
                  {answeredCount} / {assessment.questions.length} answered
                </span>
                <span className="text-primary-100">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="bg-white h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                {question.text}
              </h3>

              {/* Large Clickable Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const isSelected = answers[currentQuestion] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion, index)}
                      className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                        </div>
                        <p className="text-lg text-gray-900 flex-1">{option}</p>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="flex gap-3">
                {!isLastQuestion ? (
                  <button
                    onClick={handleNext}
                    className="btn-primary flex items-center gap-2"
                  >
                    Next Question
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2 px-8"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Quiz
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Question Navigation Dots */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {assessment.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                    index === currentQuestion
                      ? 'border-primary-600 bg-primary-600 text-white scale-110'
                      : answers[index] !== undefined
                      ? 'border-green-500 bg-green-100 text-green-700 hover:border-green-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mx-8 mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuizComponent;

