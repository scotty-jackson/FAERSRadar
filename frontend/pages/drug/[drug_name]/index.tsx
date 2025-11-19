/**
 * Drug dashboard page
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SummaryTiles from '@/components/SummaryTiles';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ReactionTable from '@/components/ReactionTable';
import Disclaimer from '@/components/Disclaimer';
import { getDrugOverview, DrugOverview } from '@/lib/api';

export default function DrugDashboard() {
  const router = useRouter();
  const { drug_name } = router.query;
  const [overview, setOverview] = useState<DrugOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (drug_name && typeof drug_name === 'string') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getDrugOverview(drug_name);
          setOverview(data);
        } catch (err: any) {
          console.error('Error fetching drug overview:', err);
          if (err.response?.status === 404) {
            setError('Drug not found in database');
          } else {
            setError('Error loading drug data');
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [drug_name]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading drug data...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Data not available'}</h1>
        <p className="text-gray-600 mb-6">
          The drug "{drug_name}" was not found in the database.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  const dateRange = overview.first_report_date && overview.last_report_date
    ? `${new Date(overview.first_report_date).getFullYear()} - ${new Date(overview.last_report_date).getFullYear()}`
    : 'Not available';

  return (
    <>
      <Head>
        <title>{overview.product_name_normalized} - FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content={`View adverse event reports for ${overview.product_name_normalized}. ${overview.total_case_count.toLocaleString()} total reports in FAERS database.`}
        />
      </Head>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-800 inline-flex items-center mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Search
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">
            {overview.product_name_normalized}
          </h1>
          <p className="text-gray-600 mt-2">
            Adverse event reports from FAERS database
          </p>
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        {/* Summary Tiles */}
        <SummaryTiles
          tiles={[
            {
              label: 'Total Reports',
              value: overview.total_case_count,
              subtext: dateRange,
              color: 'blue',
            },
            {
              label: 'Serious Events',
              value: overview.serious_case_count,
              subtext: `${((overview.serious_case_count / overview.total_case_count) * 100).toFixed(1)}% of total`,
              color: 'orange',
            },
            {
              label: 'Deaths Reported',
              value: overview.death_count,
              subtext: `${((overview.death_count / overview.total_case_count) * 100).toFixed(1)}% of total`,
              color: 'red',
            },
            {
              label: 'Hospitalizations',
              value: overview.hospitalization_count,
              subtext: 'Reported cases',
              color: 'gray',
            },
          ]}
        />

        {/* Ad slot - Sidebar */}
        <div id="ad-slot-sidebar" className="ad-slot">
          {/* Google AdSense code would go here */}
          <span>Advertisement Space</span>
        </div>

        {/* Time Series Chart */}
        {overview.time_series && overview.time_series.length > 0 && (
          <TimeSeriesChart
            data={overview.time_series}
            lines={[
              { dataKey: 'case_count', name: 'Total Cases', color: '#0ea5e9' },
              { dataKey: 'serious_case_count', name: 'Serious Cases', color: '#f59e0b' },
              { dataKey: 'death_count', name: 'Deaths', color: '#ef4444' },
            ]}
            title="Reports Over Time"
            height={400}
          />
        )}

        {/* Top Reactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Most Frequently Reported Reactions
            </h2>
            <Link
              href={`/drug/${encodeURIComponent(overview.product_name_normalized)}/reactions`}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              View all reactions →
            </Link>
          </div>
          <ReactionTable
            reactions={overview.top_reactions}
            drugName={overview.product_name_normalized}
            showSignals={true}
          />
        </div>

        {/* Interpretation Guide */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Interpret This Data
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Total Reports:</strong> Number of FAERS reports mentioning this drug.
              Multiple drugs may be listed per report.
            </p>
            <p>
              <strong>Serious Events:</strong> Reports involving death, hospitalization,
              life-threatening events, disability, or congenital anomalies.
            </p>
            <p>
              <strong>Signal Flag:</strong> Indicates disproportionate reporting using
              statistical thresholds. Does NOT prove causation.
            </p>
            <p>
              <strong>Remember:</strong> Reporting rates do not reflect actual risk or
              incidence. Confounding factors, underreporting, and duplicate reports affect
              the data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
