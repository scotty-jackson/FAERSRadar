/**
 * Export utilities for downloading data as CSV or JSON
 */

export interface ExportData {
  headers: string[];
  rows: any[][];
  filename: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData): void {
  const csvContent = [
    // Headers
    data.headers.join(','),
    // Rows
    ...data.rows.map((row) =>
      row
        .map((cell) => {
          // Handle null/undefined
          if (cell === null || cell === undefined) return '';

          // Convert to string
          const str = String(cell);

          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }

          return str;
        })
        .join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, `${data.filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Download a file with given content
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Helper to convert reaction data to export format
 */
export function prepareReactionExport(
  reactions: any[],
  drugName: string
): ExportData {
  return {
    headers: [
      'Reaction (MedDRA PT)',
      'Total Cases',
      'Serious Cases',
      'Deaths',
      'Hospitalizations',
      'PRR',
      'ROR',
      'Signal Flag',
    ],
    rows: reactions.map((r) => [
      r.meddra_pt,
      r.total_case_count,
      r.serious_case_count,
      r.death_count,
      r.hospitalization_count || 0,
      r.prr !== null && r.prr !== undefined ? r.prr.toFixed(2) : '',
      r.ror !== null && r.ror !== undefined ? r.ror.toFixed(2) : '',
      r.signal_flag ? 'Yes' : 'No',
    ]),
    filename: `${drugName.replace(/[^a-z0-9]/gi, '_')}_reactions`,
  };
}

/**
 * Helper to convert time series data to export format
 */
export function prepareTimeSeriesExport(
  timeSeries: any[],
  drugName: string,
  reactionName?: string
): ExportData {
  const filename = reactionName
    ? `${drugName}_${reactionName}_timeseries`
    : `${drugName}_timeseries`;

  return {
    headers: [
      'Period',
      'Year',
      'Quarter',
      'Total Cases',
      'Serious Cases',
      'Deaths',
      ...(timeSeries[0]?.prr !== undefined ? ['PRR', 'ROR'] : []),
    ],
    rows: timeSeries.map((ts) => [
      ts.date_label,
      ts.year,
      ts.quarter || '',
      ts.case_count,
      ts.serious_case_count,
      ts.death_count,
      ...(ts.prr !== undefined
        ? [
            ts.prr !== null ? ts.prr.toFixed(2) : '',
            ts.ror !== null ? ts.ror.toFixed(2) : '',
          ]
        : []),
    ]),
    filename: filename.replace(/[^a-z0-9_]/gi, '_'),
  };
}

/**
 * Helper to convert comparison data to export format
 */
export function prepareComparisonExport(
  comparisonData: any,
  metric: string
): ExportData {
  const drugNames = Object.keys(comparisonData.time_series[0]?.drugs || {});

  return {
    headers: ['Period', 'Year', 'Quarter', ...drugNames],
    rows: comparisonData.time_series.map((ts: any) => [
      ts.date_label,
      ts.year,
      ts.quarter || '',
      ...drugNames.map((drug) => ts.drugs[drug] || 0),
    ]),
    filename: `drug_comparison_${metric}`,
  };
}
