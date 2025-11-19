/**
 * Reaction table component
 */
import React from 'react';
import Link from 'next/link';

export interface ReactionRow {
  meddra_pt: string;
  total_case_count: number;
  serious_case_count: number;
  death_count: number;
  prr?: number | null;
  signal_flag?: boolean;
}

interface ReactionTableProps {
  reactions: ReactionRow[];
  drugName?: string;
  showSignals?: boolean;
}

export default function ReactionTable({
  reactions,
  drugName,
  showSignals = true,
}: ReactionTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reaction (MedDRA PT)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cases
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serious Cases
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deaths
              </th>
              {showSignals && (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRR
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signal
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reactions.map((reaction) => (
              <tr
                key={reaction.meddra_pt}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {drugName ? (
                    <Link
                      href={`/drug/${encodeURIComponent(drugName)}/reaction/${encodeURIComponent(
                        reaction.meddra_pt
                      )}`}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      {reaction.meddra_pt}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {reaction.meddra_pt}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {reaction.total_case_count.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600 font-medium">
                  {reaction.serious_case_count.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                  {reaction.death_count.toLocaleString()}
                </td>
                {showSignals && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {reaction.prr !== null && reaction.prr !== undefined
                        ? reaction.prr.toFixed(2)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {reaction.signal_flag ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Signal
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
