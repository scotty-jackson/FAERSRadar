/**
 * API client for FAERS Side-Effect Radar backend
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface DrugSearchResult {
  product_name_normalized: string;
  representative_raw_names: string[];
  first_report_date: string | null;
  last_report_date: string | null;
  total_case_count: number;
  serious_case_count: number;
  death_count: number;
}

export interface TimeSeriesPoint {
  year: number;
  quarter: number | null;
  date_label: string;
  case_count: number;
  serious_case_count: number;
  death_count: number;
}

export interface TopReaction {
  meddra_pt: string;
  meddra_soc: string | null;
  case_count: number;
  serious_case_count: number;
  death_count: number;
  prr: number | null;
  signal_flag: boolean;
}

export interface DrugOverview {
  product_name_normalized: string;
  total_case_count: number;
  serious_case_count: number;
  death_count: number;
  hospitalization_count: number;
  first_report_date: string | null;
  last_report_date: string | null;
  time_series: TimeSeriesPoint[];
  top_reactions: TopReaction[];
}

export interface ReactionDetail {
  meddra_pt: string;
  meddra_soc: string | null;
  total_case_count: number;
  serious_case_count: number;
  death_count: number;
  hospitalization_count: number;
  prr: number | null;
  ror: number | null;
  signal_flag: boolean;
}

export interface ReactionTimeSeriesPoint {
  year: number;
  quarter: number | null;
  date_label: string;
  case_count: number;
  serious_case_count: number;
  death_count: number;
  prr: number | null;
  ror: number | null;
}

export interface GlobalReaction {
  meddra_pt: string;
  total_case_count: number;
  serious_case_count: number;
  death_count: number;
  top_associated_drugs: string[];
}

// API functions
export const searchDrugs = async (query: string, limit = 20, offset = 0) => {
  const response = await api.get('/drugs/search', {
    params: { q: query, limit, offset },
  });
  return response.data;
};

export const getDrugOverview = async (drugName: string): Promise<DrugOverview> => {
  const response = await api.get(`/drug/${encodeURIComponent(drugName)}/overview`);
  return response.data;
};

export const getDrugReactions = async (
  drugName: string,
  minCases = 1,
  sortBy = 'cases',
  limit = 50,
  offset = 0
) => {
  const response = await api.get(`/drug/${encodeURIComponent(drugName)}/reactions`, {
    params: { min_cases: minCases, sort_by: sortBy, limit, offset },
  });
  return response.data;
};

export const getReactionTimeSeries = async (
  drugName: string,
  meddraPt: string,
  startYear?: number,
  endYear?: number,
  groupBy = 'quarter'
) => {
  const response = await api.get(
    `/drug/${encodeURIComponent(drugName)}/reaction/${encodeURIComponent(meddraPt)}/timeseries`,
    {
      params: {
        start_year: startYear,
        end_year: endYear,
        group_by: groupBy,
      },
    }
  );
  return response.data;
};

export const compareDrugs = async (
  drugNames: string[],
  metric = 'total_cases',
  groupBy = 'quarter',
  startYear?: number,
  endYear?: number
) => {
  const params = new URLSearchParams();
  drugNames.forEach((name) => params.append('drug_names', name));
  params.append('metric', metric);
  params.append('group_by', groupBy);
  if (startYear) params.append('start_year', startYear.toString());
  if (endYear) params.append('end_year', endYear.toString());

  const response = await api.get(`/compare/drugs?${params.toString()}`);
  return response.data;
};

export const compareReactions = async (
  drugNames: string[],
  meddraPt: string,
  groupBy = 'quarter',
  startYear?: number,
  endYear?: number
) => {
  const params = new URLSearchParams();
  drugNames.forEach((name) => params.append('drug_names', name));
  params.append('meddra_pt', meddraPt);
  params.append('group_by', groupBy);
  if (startYear) params.append('start_year', startYear.toString());
  if (endYear) params.append('end_year', endYear.toString());

  const response = await api.get(`/compare/reactions?${params.toString()}`);
  return response.data;
};

export const getTopReactions = async (
  year?: number,
  seriousOnly = false,
  limit = 50,
  offset = 0
) => {
  const response = await api.get('/reactions/top', {
    params: { year, serious_only: seriousOnly, limit, offset },
  });
  return response.data;
};

export const getOutcomesSummary = async (
  drugName?: string,
  startYear?: number,
  endYear?: number
) => {
  const response = await api.get('/outcomes/summary', {
    params: { drug_name: drugName, start_year: startYear, end_year: endYear },
  });
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
