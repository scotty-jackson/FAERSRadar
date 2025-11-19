/**
 * Tooltip component for help icons and metric explanations
 */
import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  maxWidth = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children || (
          <svg
            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]}`}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded shadow-lg">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          ></div>
        </div>
      )}
    </div>
  );
}

/**
 * Metric tooltip with pre-defined explanations
 */
interface MetricTooltipProps {
  metric: 'prr' | 'ror' | 'signal' | 'serious' | 'death' | 'hospitalization';
}

export function MetricTooltip({ metric }: MetricTooltipProps) {
  const tooltips = {
    prr: (
      <div>
        <strong>Proportional Reporting Ratio (PRR)</strong>
        <p className="mt-1">
          Compares the proportion of reports for this drug-reaction pair to the
          expected proportion based on overall reporting. PRR ≥ 2 may indicate a
          potential signal.
        </p>
      </div>
    ),
    ror: (
      <div>
        <strong>Reporting Odds Ratio (ROR)</strong>
        <p className="mt-1">
          Measures the odds of reporting this reaction with this drug compared to
          other drugs. Similar to PRR but uses odds ratios.
        </p>
      </div>
    ),
    signal: (
      <div>
        <strong>Signal Flag</strong>
        <p className="mt-1">
          Indicates disproportionate reporting when PRR ≥ 2, at least 3 cases
          reported, and chi-square ≥ 4. Does NOT prove causation.
        </p>
      </div>
    ),
    serious: (
      <div>
        <strong>Serious Adverse Events</strong>
        <p className="mt-1">
          Events resulting in death, hospitalization, life-threatening situations,
          disability, or congenital anomalies.
        </p>
      </div>
    ),
    death: (
      <div>
        <strong>Death Reports</strong>
        <p className="mt-1">
          Number of reports where death was reported as an outcome. Does not
          establish that the drug caused the death.
        </p>
      </div>
    ),
    hospitalization: (
      <div>
        <strong>Hospitalization Reports</strong>
        <p className="mt-1">
          Number of reports where hospitalization or prolongation of existing
          hospitalization was reported.
        </p>
      </div>
    ),
  };

  return <Tooltip content={tooltips[metric]} maxWidth={350} />;
}
