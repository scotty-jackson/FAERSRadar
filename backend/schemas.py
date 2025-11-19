"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


# Drug Search and Overview Schemas
class DrugSearchResult(BaseModel):
    product_name_normalized: str
    representative_raw_names: List[str]
    first_report_date: Optional[date]
    last_report_date: Optional[date]
    total_case_count: int
    serious_case_count: int
    death_count: int

    class Config:
        from_attributes = True


class DrugSearchResponse(BaseModel):
    results: List[DrugSearchResult]
    total: int
    limit: int
    offset: int


class TimeSeriesPoint(BaseModel):
    year: int
    quarter: Optional[int]
    date_label: str  # "2023 Q1" or "2023"
    case_count: int
    serious_case_count: int
    death_count: int


class TopReaction(BaseModel):
    meddra_pt: str
    meddra_soc: Optional[str] = None
    case_count: int
    serious_case_count: int
    death_count: int
    prr: Optional[float] = None
    signal_flag: Optional[bool] = False


class DrugOverview(BaseModel):
    product_name_normalized: str
    total_case_count: int
    serious_case_count: int
    death_count: int
    hospitalization_count: int
    first_report_date: Optional[date]
    last_report_date: Optional[date]
    time_series: List[TimeSeriesPoint]
    top_reactions: List[TopReaction]


# Reaction Schemas
class ReactionDetail(BaseModel):
    meddra_pt: str
    meddra_soc: Optional[str] = None
    total_case_count: int
    serious_case_count: int
    death_count: int
    hospitalization_count: int
    prr: Optional[float] = None
    ror: Optional[float] = None
    signal_flag: bool = False


class ReactionListResponse(BaseModel):
    drug_name: str
    reactions: List[ReactionDetail]
    total_reactions: int
    limit: int
    offset: int


class ReactionTimeSeriesPoint(BaseModel):
    year: int
    quarter: Optional[int]
    date_label: str
    case_count: int
    serious_case_count: int
    death_count: int
    prr: Optional[float] = None
    ror: Optional[float] = None


class ReactionTimeSeries(BaseModel):
    drug_name: str
    meddra_pt: str
    time_series: List[ReactionTimeSeriesPoint]


# Comparison Schemas
class DrugComparisonPoint(BaseModel):
    year: int
    quarter: Optional[int]
    date_label: str
    drugs: dict  # {drug_name: value}


class DrugComparisonResponse(BaseModel):
    metric: str
    time_series: List[DrugComparisonPoint]


class ReactionComparisonDrugSeries(BaseModel):
    drug_name: str
    time_series: List[ReactionTimeSeriesPoint]


class ReactionComparisonResponse(BaseModel):
    meddra_pt: str
    drug_series: List[ReactionComparisonDrugSeries]


# Global Reaction Schemas
class GlobalReactionSummary(BaseModel):
    meddra_pt: str
    total_case_count: int
    serious_case_count: int
    death_count: int
    top_associated_drugs: List[str]


class GlobalReactionsResponse(BaseModel):
    reactions: List[GlobalReactionSummary]
    total: int
    limit: int
    offset: int


# Outcome Schemas
class OutcomeSummary(BaseModel):
    outcome_code: str
    outcome_label: str
    count: int


class OutcomesResponse(BaseModel):
    drug_name: Optional[str]
    year_range: str
    outcomes: List[OutcomeSummary]
    total_cases: int


# Health Check
class HealthCheck(BaseModel):
    status: str
    database: str
    total_reports: int
    date_range: Optional[str]
