/**
 * Full drug reactions list page with pagination and filtering
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ReactionTable from '@/components/ReactionTable';
import Pagination from '@/components/Pagination';
import { getDrugReactions } from '@/lib/api';

export default function AllReactionsPage() {
  const router = useRouter();
  const { drug_name } = router.query;
  const [reactions, setReactions] = useState<any[]>([]);
  const [totalReactions, setTotalReactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [minCases, setMinCases] = useState(1);
  const [sortBy, setSortBy] = useState('cases');
  const limit = 50;

  useEffect(() => {
    if (drug_name && typeof drug_name === 'string') {
      fetchReactions();
    }
  }, [drug_name, currentPage, minCases, sortBy]);

  const fetchReactions = async () => {
    if (!drug_name || typeof drug_name !== 'string') return;

    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const data = await getDrugReactions(drug_name, minCases, sortBy, limit, offset);
      setReactions(data.reactions);
      setTotalReactions(data.total_reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalReactions / limit);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <>
      <Head>
        <title>{drug_name} - All Reactions | FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content={`Complete list of adverse reactions reported for ${drug_name} in FAERS database`}
        />
      </Head>

      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-primary-600 hover:text-primary-800">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/drug/${encodeURIComponent(drug_name as string)}`}
            className="text-primary-600 hover:text-primary-800"
          >
            {drug_name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">All Reactions</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            All Reactions for {drug_name}
          </h1>
          <p className="text-gray-600 mt-2">
            {totalReactions.toLocaleString()} unique reactions reported
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Cases
              </label>
              <select
                value={minCases}
                onChange={(e) => {
                  setMinCases(parseInt(e.target.value));
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="1">1+ cases</option>
                <option value="3">3+ cases</option>
                <option value="5">5+ cases</option>
                <option value="10">10+ cases</option>
                <option value="25">25+ cases</option>
                <option value="50">50+ cases</option>
                <option value="100">100+ cases</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="cases">Total Cases</option>
                <option value="serious">Serious Cases</option>
                <option value="death">Deaths</option>
                <option value="prr">PRR (Signal Strength)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchReactions}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <div className="inline-block animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading reactions...</p>
          </div>
        ) : reactions.length > 0 ? (
          <>
            <ReactionTable
              reactions={reactions}
              drugName={drug_name as string}
              showSignals={true}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}

            {/* Results Info */}
            <div className="text-center text-sm text-gray-600">
              Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalReactions)} of {totalReactions.toLocaleString()} reactions
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-gray-600">
              No reactions found with the current filters.
            </p>
            <button
              onClick={() => {
                setMinCases(1);
                setSortBy('cases');
                handleFilterChange();
              }}
              className="mt-4 text-primary-600 hover:text-primary-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
