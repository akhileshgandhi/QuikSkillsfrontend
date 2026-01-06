import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

interface QuizResult {
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  quizScore?: number;
  isPassed: boolean;
  completionPercentage: number;
  attemptDate?: string | null;
  questions: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

interface AssessmentAuditModalProps {
  userId: string;
  courseId: string;
  onClose: () => void;
}

const AssessmentAuditModal: React.FC<AssessmentAuditModalProps> = ({ userId, courseId, onClose }) => {
  const [results, setResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizResults();
  }, [userId, courseId]);

  const loadQuizResults = async () => {
    try {
      const response = await api.get(`/manager/quiz-results/${userId}/${courseId}`);
      setResults(response.data.data);
    } catch (error) {
      console.error('Failed to load quiz results:', error);
      alert('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-500">No quiz results available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
            <p className="text-gray-500 mt-1">{results.userName} - {results.courseTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Quiz Score</p>
              <p className={`text-3xl font-bold ${results.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {results.quizScore !== undefined && results.quizScore !== null ? `${results.quizScore}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
              <div className="mt-1">
                {results.isPassed ? (
                  <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                    <CheckCircle className="w-5 h-5" /> Passed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                    <XCircle className="w-5 h-5" /> Failed
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completion</p>
              <p className="text-3xl font-bold text-gray-900">{results.completionPercentage}%</p>
            </div>
            {results.attemptDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Attempt Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(results.attemptDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(results.attemptDate).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Question Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Question Breakdown</h3>
            {results.questions && results.questions.length > 0 && (
              <span className="text-sm text-gray-500">
                {results.questions.filter(q => q.isCorrect).length} / {results.questions.length} Correct
              </span>
            )}
          </div>
          {results.questions && results.questions.length > 0 ? (
            <div className="space-y-4">
              {results.questions.map((question, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-5 transition-shadow hover:shadow-md ${
                    question.isCorrect 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {question.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-semibold text-gray-900 text-base">
                          Question {index + 1}: {question.question}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question.isCorrect 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="space-y-2 bg-white rounded p-3 border border-gray-200">
                        <div>
                          <span className="text-sm font-medium text-gray-700">User Answer: </span>
                          <span className={`text-sm font-semibold ${
                            question.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {question.userAnswer}
                          </span>
                        </div>
                        {!question.isCorrect && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Correct Answer: </span>
                            <span className="text-sm font-semibold text-green-700">
                              {question.correctAnswer}
                            </span>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-600">Explanation: </span>
                            <span className="text-xs text-gray-700">{question.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700 mb-1">Detailed question breakdown is not available</p>
              <p className="text-sm text-gray-500">
                {results.quizScore !== undefined && results.quizScore !== null 
                  ? `Quiz score: ${results.quizScore}%`
                  : 'No quiz attempt recorded yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentAuditModal;

