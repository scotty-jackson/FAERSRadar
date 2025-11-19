/**
 * Home page
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DrugSearchBar from '@/components/DrugSearchBar';
import Disclaimer from '@/components/Disclaimer';
import ReactionTable from '@/components/ReactionTable';
import { getTopReactions, GlobalReaction } from '@/lib/api';

export default function Home() {
  const [topReactions, setTopReactions] = useState<GlobalReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTopReactions(undefined, false, 10);
        setTopReactions(data.reactions);
      } catch (error) {
        console.error('Error fetching top reactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Head>
        <title>FAERS Side-Effect Radar - Explore Drug Safety Signals</title>
        <meta
          name="description"
          content="Search and explore FDA adverse event reports (FAERS) for drugs. Discover side effects, safety signals, and trends over time."
        />
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            FAERS Side-Effect Radar
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Explore drug safety signals from the FDA Adverse Event Reporting System (FAERS).
            Search by drug name to view reported side effects, trends over time, and
            disproportionality metrics.
          </p>

          <DrugSearchBar />
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        {/* What is FAERS Section */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What is FAERS?
          </h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              The <strong>FDA Adverse Event Reporting System (FAERS)</strong> is a database
              containing adverse event reports, medication error reports, and product quality
              complaints submitted to the FDA. Healthcare professionals, consumers, and
              manufacturers report these events voluntarily.
            </p>
            <p>
              This tool analyzes FAERS data to help users explore:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Side-effect profiles</strong> - What adverse reactions are reported
                with specific drugs
              </li>
              <li>
                <strong>Trends over time</strong> - How reporting patterns change across
                quarters and years
              </li>
              <li>
                <strong>Disproportionality signals</strong> - Statistical indicators (PRR, ROR)
                that may suggest safety signals
              </li>
              <li>
                <strong>Drug comparisons</strong> - Compare safety reporting across drugs in
                the same therapeutic class
              </li>
            </ul>
            <p>
              <strong>Use responsibly:</strong> FAERS data has significant limitations.
              Reports are not verified for causality, and reporting rates do not reflect
              true incidence. This tool is for informational and research purposes only.
            </p>
          </div>
        </div>

        {/* Ad slot - Inline */}
        <div id="ad-slot-inline-1" className="ad-slot">
          {/* Google AdSense code would go here */}
          <span>Advertisement Space</span>
        </div>

        {/* Top Reactions Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Most Frequently Reported Reactions Overall
          </h2>
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
            </div>
          ) : topReactions.length > 0 ? (
            <ReactionTable
              reactions={topReactions.map((r) => ({
                meddra_pt: r.meddra_pt,
                total_case_count: r.total_case_count,
                serious_case_count: r.serious_case_count,
                death_count: r.death_count,
              }))}
              showSignals={false}
            />
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-600">
              No data available. Please load FAERS data first.
            </div>
          )}
        </div>

        {/* Educational Content */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Understanding the Metrics
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Proportional Reporting Ratio (PRR)
              </h3>
              <p className="text-gray-700 text-sm">
                PRR compares the proportion of reports for a specific drug-reaction pair
                to the proportion expected based on overall reporting patterns. A PRR ≥ 2
                (with sufficient cases) may indicate a potential signal.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Reporting Odds Ratio (ROR)
              </h3>
              <p className="text-gray-700 text-sm">
                ROR is similar to PRR but uses odds ratios. It measures the odds of
                reporting a specific reaction with a drug compared to the odds of
                reporting it with other drugs.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Signal Flag
              </h3>
              <p className="text-gray-700 text-sm">
                A signal flag is shown when PRR ≥ 2, there are at least 3 cases, and
                the chi-square statistic ≥ 4. This suggests potential disproportionate
                reporting that warrants further investigation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Serious vs. Non-Serious
              </h3>
              <p className="text-gray-700 text-sm">
                Serious adverse events include death, hospitalization, life-threatening
                events, disability, or congenital anomalies. Non-serious events are
                medically significant but do not meet these criteria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
