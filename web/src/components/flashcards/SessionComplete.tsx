import React from "react";
import { Trophy, Target, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionCompleteProps {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  onRestart?: () => void;
  onClose?: () => void;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  totalCards,
  correctCards,
  incorrectCards,
  onRestart,
  onClose,
}) => {
  const accuracy = totalCards > 0 ? Math.round((correctCards / totalCards) * 100) : 0;

  return (
    <div className="w-full flex items-center justify-center py-6">
      <div className="max-w-2xl w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Flashcard Session Complete!
          </h1>
          <p className="text-gray-600 text-sm">
            Great work on completing your study session
          </p>
        </div>

        {/* Main Score Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Percentage */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {accuracy}%
            </div>
            <div className="text-gray-600 text-sm">Overall Accuracy</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          {/* Motivation Badge */}
          <div className="bg-orange-100 rounded-full py-3 px-6 flex items-center justify-center gap-2 mb-8">
            <Target className="w-5 h-5 text-orange-600" />
            <span className="text-orange-600 font-medium text-sm">
              Keep Going! Practice Makes Perfect
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Total Cards */}
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-gray-900 mb-1">
                {totalCards}
              </div>
              <div className="text-xs text-gray-600">Total Cards</div>
            </div>

            {/* Correct Cards */}
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  {correctCards}
                </span>
              </div>
              <div className="text-xs text-green-600">Correct</div>
            </div>

            {/* Incorrect Cards */}
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-xl font-bold text-red-600">
                  {incorrectCards}
                </span>
              </div>
              <div className="text-xs text-red-600">Incorrect</div>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-cyan-50 rounded-2xl p-6 mb-6">
          <h3 className="text-xs font-semibold text-gray-900 mb-4">
            Study Insights
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 text-sm">
                <span className="font-medium">Study Time:</span> You've reviewed all {totalCards} flashcards in this session
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 text-sm">
                <span className="font-medium">Retention Rate:</span> {accuracy}% accuracy shows {accuracy >= 70 ? 'excellent' : accuracy >= 50 ? 'good' : 'developing'} understanding
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {onRestart && (
            <Button
              onClick={onRestart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium"
            >
              Study Again
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="px-8 py-3 rounded-lg font-medium"
            >
              Back to Notes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
