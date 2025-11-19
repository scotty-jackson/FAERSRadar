/**
 * Loading skeleton components for better UX
 */
import React from 'react';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-lg border-2 border-gray-200">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
          <div className="h-2 bg-gray-100 rounded w-full animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="bg-white p-6 rounded-lg shadow-md"
      style={{ height: `${height}px` }}
    >
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
      <div className="h-full flex items-end justify-around space-x-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const randomHeight = Math.random() * 60 + 20;
          return (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t animate-pulse"
              style={{ height: `${randomHeight}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b last:border-b-0 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse"></div>
      </div>
    </div>
  );
}
