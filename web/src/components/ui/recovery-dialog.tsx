/**
 * Recovery dialog for restoring previous course creation state
 * Requirements: 8.2, 8.4
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { RecoverableState } from '@/lib/utils/state-recovery';

interface RecoveryDialogProps {
  isOpen: boolean;
  recoveredState: RecoverableState;
  stateSummary: string;
  validationIssues: string[];
  onRestore: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

/**
 * Dialog for recovering previous course creation session
 */
export function RecoveryDialog({
  isOpen,
  recoveredState,
  stateSummary,
  validationIssues,
  onRestore,
  onDiscard,
  onClose
}: RecoveryDialogProps) {
  if (!isOpen) return null;

  const hasIssues = validationIssues.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg  max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Restore Previous Session?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                We found a previous course creation session that was interrupted.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium">
                  Found: {stateSummary}
                </p>
              </div>

              {hasIssues && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium mb-1">
                        Issues found:
                      </p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {validationIssues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-700 mt-2">
                        You can still restore and fix these issues manually.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  <strong>Restore:</strong> Continue where you left off
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Start Fresh:</strong> Begin a new course creation
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onRestore}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore Session
            </Button>
            
            <Button
              onClick={onDiscard}
              variant="outline"
              className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Start Fresh
            </Button>
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Decide later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact recovery banner for inline display
 */
interface RecoveryBannerProps {
  stateSummary: string;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

export function RecoveryBanner({
  stateSummary,
  onRestore,
  onDiscard,
  className = ''
}: RecoveryBannerProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Previous session found
          </p>
          <p className="text-xs text-blue-700 mb-3">
            {stateSummary}
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={onRestore}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
            >
              Restore
            </Button>
            <Button
              onClick={onDiscard}
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-100 text-xs px-3 py-1"
            >
              Discard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}