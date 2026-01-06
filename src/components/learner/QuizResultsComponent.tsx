import { CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';

interface QuizResultsComponentProps {
  result: {
    passed: boolean;
    percentage: number;
  };
  onContinue: () => void;
}

const QuizResultsComponent: React.FC<QuizResultsComponentProps> = ({ result, onContinue }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="text-center">
        {/* Result Icon */}
        <div className="mb-6">
          {result.passed ? (
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          )}
        </div>

        {/* Result Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {result.passed ? 'Congratulations!' : 'Quiz Completed'}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {result.passed
            ? 'You have successfully passed the assessment!'
            : `You scored ${result.percentage}%. Please review the material and try again.`}
        </p>

        {/* Score Display */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Score</p>
              <p
                className={`text-4xl font-bold ${
                  result.passed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {result.percentage}%
              </p>
            </div>
            {result.passed && (
              <div className="border-l border-gray-300 pl-4">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2 text-green-600">
                  <Award className="w-6 h-6" />
                  <span className="text-xl font-semibold">Passed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button onClick={onContinue} className="btn-primary">
            Continue Course
          </button>
          {!result.passed && (
            <button
              onClick={() => {
                // Reload page to retake quiz
                window.location.reload();
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
          )}
        </div>

        {/* Additional Info */}
        {result.passed && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Your progress has been updated. You can continue to the next module or review this
              course.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResultsComponent;

