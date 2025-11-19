/**
 * Drug-reaction detail page
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import SummaryTiles from '@/components/SummaryTiles';
import Disclaimer from '@/components/Disclaimer';
import { getReactionTimeSeries } from '@/lib/api';

export default function ReactionDetail() {
  const router = useRouter();
  const { drug_name, pt } = router.query;
  const [timeSeries, setTimeSeries] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (drug_name && pt && typeof drug_name === 'string' && typeof pt === 'string') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getReactionTimeSeries(drug_name, pt);
          setTimeSeries(data);
        } catch (err: any) {
          console.error('Error fetching reaction time series:', err);
          setError('Error loading reaction data');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [drug_name, pt]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error || !timeSeries || !timeSeries.time_series || timeSeries.time_series.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {error || 'No data available'}
        </h1>
        <p className="text-gray-600 mb-6">
          No reports found for this drug-reaction combination.
        </p>
        <Link
          href={`/drug/${drug_name}`}
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Drug Dashboard
        </Link>
      </div>
    );
  }

  // Calculate summary stats
  const totalCases = timeSeries.time_series.reduce((sum: number, item: any) => sum + item.case_count, 0);
  const totalSerious = timeSeries.time_series.reduce((sum: number, item: any) => sum + item.serious_case_count, 0);
  const totalDeaths = timeSeries.time_series.reduce((sum: number, item: any) => sum + item.death_count, 0);

  // Find peak period
  const peakPeriod = timeSeries.time_series.reduce((max: any, item: any) =>
    item.case_count > (max?.case_count || 0) ? item : max
  , null);

  // Average PRR (if available)
  const prrValues = timeSeries.time_series
    .map((item: any) => item.prr)
    .filter((prr: any) => prr !== null && prr !== undefined);
  const avgPrr = prrValues.length > 0
    ? prrValues.reduce((sum: number, val: number) => sum + val, 0) / prrValues.length
    : null;

  return (
    <>
      <Head>
        <title>
          {timeSeries.drug_name} - {timeSeries.meddra_pt} | FAERS Side-Effect Radar
        </title>
        <meta
          name="description"
          content={`View ${totalCases.toLocaleString()} reports of ${timeSeries.meddra_pt} associated with ${timeSeries.drug_name} in FAERS database.`}
        />
      </Head>

      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-primary-600 hover:text-primary-800">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/drug/${encodeURIComponent(timeSeries.drug_name)}`}
            className="text-primary-600 hover:text-primary-800"
          >
            {timeSeries.drug_name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{timeSeries.meddra_pt}</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            {timeSeries.meddra_pt}
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Reports for <strong>{timeSeries.drug_name}</strong>
          </p>
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        {/* Summary Tiles */}
        <SummaryTiles
          tiles={[
            {
              label: 'Total Reports',
              value: totalCases,
              subtext: 'All time',
              color: 'blue',
            },
            {
              label: 'Serious Cases',
              value: totalSerious,
              subtext: `${((totalSerious / totalCases) * 100).toFixed(1)}% of total`,
              color: 'orange',
            },
            {
              label: 'Deaths',
              value: totalDeaths,
              subtext: `${((totalDeaths / totalCases) * 100).toFixed(1)}% of total`,
              color: 'red',
            },
            {
              label: 'Peak Period',
              value: peakPeriod?.date_label || 'N/A',
              subtext: peakPeriod ? `${peakPeriod.case_count} reports` : '',
              color: 'gray',
            },
          ]}
        />

        {/* Time Series Charts */}
        <TimeSeriesChart
          data={timeSeries.time_series}
          lines={[
            { dataKey: 'case_count', name: 'Total Cases', color: '#0ea5e9' },
            { dataKey: 'serious_case_count', name: 'Serious Cases', color: '#f59e0b' },
            { dataKey: 'death_count', name: 'Deaths', color: '#ef4444' },
          ]}
          title="Reports Over Time"
          height={400}
        />

        {avgPrr !== null && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Disproportionality Metric</h3>
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-3xl font-bold text-primary-600">
                  {avgPrr.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Average PRR</div>
              </div>
              {avgPrr >= 2 && (
                <div className="flex-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Potential Signal
                  </span>
                  <p className="text-xs text-gray-600 mt-2">
                    PRR ≥ 2 suggests disproportionate reporting
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Understanding This Data
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This page shows FAERS reports that mentioned both <strong>{timeSeries.drug_name}</strong>
              {' '}and the adverse reaction <strong>{timeSeries.meddra_pt}</strong>.
            </p>
            <p>
              <strong>Important:</strong> These reports do NOT prove that the drug caused
              the reaction. Many factors influence reporting, including:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Media attention and regulatory actions increase reporting</li>
              <li>Patients often take multiple medications simultaneously</li>
              <li>Underlying medical conditions may cause similar symptoms</li>
              <li>Reporting is voluntary and subject to significant underreporting</li>
            </ul>
            <p>
              Always consult healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
