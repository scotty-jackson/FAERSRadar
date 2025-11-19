/**
 * Drug comparison page
 */
import React, { useState } from 'react';
import Head from 'next/head';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import Disclaimer from '@/components/Disclaimer';
import { searchDrugs, compareDrugs } from '@/lib/api';

export default function ComparePage() {
  const [drugQuery, setDrugQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [metric, setMetric] = useState('total_cases');
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const handleSearch = async (query: string) => {
    setDrugQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const data = await searchDrugs(query, 10);
        setSearchResults(data.results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddDrug = (drugName: string) => {
    if (!selectedDrugs.includes(drugName) && selectedDrugs.length < 5) {
      setSelectedDrugs([...selectedDrugs, drugName]);
      setDrugQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveDrug = (drugName: string) => {
    setSelectedDrugs(selectedDrugs.filter((d) => d !== drugName));
  };

  const handleCompare = async () => {
    if (selectedDrugs.length < 2) {
      alert('Please select at least 2 drugs to compare');
      return;
    }

    setIsComparing(true);
    try {
      const data = await compareDrugs(selectedDrugs, metric, 'quarter');
      setComparisonData(data);
    } catch (error) {
      console.error('Comparison error:', error);
      alert('Error comparing drugs');
    } finally {
      setIsComparing(false);
    }
  };

  // Prepare chart data
  const chartData = comparisonData?.time_series.map((point: any) => ({
    date_label: point.date_label,
    ...point.drugs,
  })) || [];

  const chartLines = selectedDrugs.map((drug, index) => ({
    dataKey: drug,
    name: drug,
    color: ['#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'][index % 5],
  }));

  return (
    <>
      <Head>
        <title>Compare Drugs - FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content="Compare adverse event reporting patterns across multiple drugs in FAERS database"
        />
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Compare Drugs</h1>
          <p className="text-gray-600 mt-2">
            Compare adverse event reporting patterns across multiple drugs
          </p>
        </div>

        <Disclaimer />

        {/* Drug Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select Drugs to Compare</h2>

          {/* Selected Drugs */}
          {selectedDrugs.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedDrugs.map((drug) => (
                  <div
                    key={drug}
                    className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full"
                  >
                    <span className="font-medium">{drug}</span>
                    <button
                      onClick={() => handleRemoveDrug(drug)}
                      className="ml-2 text-primary-600 hover:text-primary-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={drugQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for drugs to add (max 5)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              disabled={selectedDrugs.length >= 5}
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.product_name_normalized}
                  onClick={() => handleAddDrug(result.product_name_normalized)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                  disabled={selectedDrugs.includes(result.product_name_normalized)}
                >
                  <div className="font-medium">{result.product_name_normalized}</div>
                  <div className="text-sm text-gray-600">
                    {result.total_case_count.toLocaleString()} reports
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Metric Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metric to Compare
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="total_cases">Total Cases</option>
              <option value="serious_cases">Serious Cases</option>
              <option value="death_count">Deaths</option>
            </select>
          </div>

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            disabled={selectedDrugs.length < 2 || isComparing}
            className="mt-4 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isComparing ? 'Comparing...' : 'Compare Drugs'}
          </button>
        </div>

        {/* Comparison Chart */}
        {comparisonData && chartData.length > 0 && (
          <TimeSeriesChart
            data={chartData}
            lines={chartLines}
            title={`${metric.replace('_', ' ').toUpperCase()} Comparison Over Time`}
            height={500}
          />
        )}

        {/* Educational Content */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How to Use Drug Comparison
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Drug comparison allows you to view reporting trends for multiple drugs
              simultaneously. This can be useful for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Comparing drugs in the same therapeutic class</li>
              <li>Identifying differences in reporting patterns over time</li>
              <li>Understanding relative reporting volumes</li>
            </ul>
            <p className="font-semibold mt-4">Important Notes:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Higher report counts do NOT mean a drug is more dangerous
              </li>
              <li>
                Newer drugs often have higher reporting due to enhanced surveillance
              </li>
              <li>
                Popular drugs with more users naturally have more reports
              </li>
              <li>
                Use this tool for exploratory analysis, not clinical decision-making
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
