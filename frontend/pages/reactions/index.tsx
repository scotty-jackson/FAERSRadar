/**
 * Global top reactions page
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { getTopReactions, GlobalReaction } from '@/lib/api';

export default function ReactionsPage() {
  const [reactions, setReactions] = useState<GlobalReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seriousOnly, setSeriousOnly] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getTopReactions(selectedYear, seriousOnly, 50);
        setReactions(data.reactions);
      } catch (error) {
        console.error('Error fetching reactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seriousOnly, selectedYear]);

  return (
    <>
      <Head>
        <title>Top Reactions - FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content="View the most frequently reported adverse reactions in the FAERS database"
        />
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Top Reported Reactions</h1>
          <p className="text-gray-600 mt-2">
            Most frequently reported adverse events in FAERS database
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Filter
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) =>
                  setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => 2024 - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Filter
              </label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={!seriousOnly}
                    onChange={() => setSeriousOnly(false)}
                    className="mr-2"
                  />
                  <span>All Reports</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={seriousOnly}
                    onChange={() => setSeriousOnly(true)}
                    className="mr-2"
                  />
                  <span>Serious Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <div className="inline-block animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading reactions...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reaction (MedDRA PT)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Cases
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Serious
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deaths
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Top Associated Drugs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reactions.map((reaction, index) => (
                    <tr key={reaction.meddra_pt} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {reaction.meddra_pt}
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {reaction.top_associated_drugs.length > 0
                          ? reaction.top_associated_drugs.join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            About This Data
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This table shows the most frequently reported adverse reactions in the FAERS
              database. The "Top Associated Drugs" column lists drugs most commonly
              mentioned in reports with each reaction.
            </p>
            <p>
              <strong>Remember:</strong> Common reactions like "nausea" or "headache" appear
              frequently because they are general symptoms that can be caused by many drugs
              and conditions. High report counts do NOT indicate that a reaction is more
              severe or more likely to be drug-related.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
