/**
 * Error message component for displaying errors
 */
import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  onGoBack,
}: ErrorMessageProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-gray-600">{message}</p>

          {(onRetry || onGoBack) && (
            <div className="mt-4 flex space-x-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
