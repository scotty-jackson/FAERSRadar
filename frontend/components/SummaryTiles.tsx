/**
 * Summary tiles component for displaying key metrics
 */
import React from 'react';

interface Tile {
  label: string;
  value: number | string;
  subtext?: string;
  color?: 'blue' | 'orange' | 'red' | 'gray';
}

interface SummaryTilesProps {
  tiles: Tile[];
}

export default function SummaryTiles({ tiles }: SummaryTilesProps) {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'orange':
        return 'bg-warning-50 border-warning-200 text-warning-700';
      case 'red':
        return 'bg-danger-50 border-danger-200 text-danger-700';
      case 'gray':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      default: // blue
        return 'bg-primary-50 border-primary-200 text-primary-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg border-2 ${getColorClasses(tile.color)}`}
        >
          <div className="text-sm font-medium uppercase tracking-wide opacity-75">
            {tile.label}
          </div>
          <div className="text-3xl font-bold mt-2">
            {typeof tile.value === 'number'
              ? tile.value.toLocaleString()
              : tile.value}
          </div>
          {tile.subtext && (
            <div className="text-xs mt-2 opacity-75">{tile.subtext}</div>
          )}
        </div>
      ))}
    </div>
  );
}
