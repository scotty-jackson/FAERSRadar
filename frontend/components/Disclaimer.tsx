/**
 * Disclaimer component for displaying important warnings
 */
import React from 'react';

interface DisclaimerProps {
  className?: string;
}

export default function Disclaimer({ className = '' }: DisclaimerProps) {
  return (
    <div className={`disclaimer ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Important Limitations
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              <strong>This tool displays spontaneous adverse event reports from FAERS.</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Reports do NOT establish that a drug caused the adverse event
              </li>
              <li>
                Frequency of reports does NOT reflect incidence rates or risk levels
              </li>
              <li>
                Reporting is voluntary and subject to underreporting, duplicates, and confounding
              </li>
              <li>
                This is NOT medical advice - always consult qualified healthcare professionals
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
