"""Drug search and overview API endpoints."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, distinct
from typing import List, Optional
from datetime import date

from backend.db import get_db
from backend.models import CaseReport, DrugProduct, Reaction, DrugReactionAgg
from backend.schemas import (
    DrugSearchResponse, DrugSearchResult, DrugOverview,
    TimeSeriesPoint, TopReaction, ReactionListResponse, ReactionDetail,
    ReactionTimeSeries, ReactionTimeSeriesPoint
)

router = APIRouter()


@router.get("/drugs/search", response_model=DrugSearchResponse)
def search_drugs(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for drugs by name.

    Returns matching drugs with summary statistics.
    """
    # Search in normalized product names
    search_pattern = f"%{q.upper()}%"

    # Subquery to get drug statistics
    drug_stats = (
        db.query(
            DrugProduct.product_name_normalized,
            func.count(distinct(CaseReport.id)).label('total_cases'),
            func.sum(func.cast(CaseReport.serious, type_=func.integer())).label('serious_cases'),
            func.sum(func.cast(CaseReport.serious_death, type_=func.integer())).label('deaths'),
            func.min(CaseReport.received_date).label('first_date'),
            func.max(CaseReport.received_date).label('last_date'),
        )
        .join(CaseReport, CaseReport.id == DrugProduct.case_report_id)
        .filter(DrugProduct.product_name_normalized.ilike(search_pattern))
        .filter(DrugProduct.product_name_normalized.isnot(None))
        .filter(DrugProduct.product_name_normalized != '')
        .group_by(DrugProduct.product_name_normalized)
        .order_by(func.count(distinct(CaseReport.id)).desc())
        .limit(limit)
        .offset(offset)
    ).all()

    # Get total count
    total = (
        db.query(func.count(distinct(DrugProduct.product_name_normalized)))
        .filter(DrugProduct.product_name_normalized.ilike(search_pattern))
        .filter(DrugProduct.product_name_normalized.isnot(None))
        .filter(DrugProduct.product_name_normalized != '')
        .scalar()
    ) or 0

    # Get representative raw names for each normalized name
    results = []
    for stat in drug_stats:
        raw_names = (
            db.query(distinct(DrugProduct.product_name_raw))
            .filter(DrugProduct.product_name_normalized == stat.product_name_normalized)
            .filter(DrugProduct.product_name_raw.isnot(None))
            .limit(3)
            .all()
        )

        results.append(DrugSearchResult(
            product_name_normalized=stat.product_name_normalized,
            representative_raw_names=[name[0] for name in raw_names if name[0]],
            first_report_date=stat.first_date,
            last_report_date=stat.last_date,
            total_case_count=stat.total_cases or 0,
            serious_case_count=stat.serious_cases or 0,
            death_count=stat.deaths or 0,
        ))

    return DrugSearchResponse(
        results=results,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/drug/{drug_name}/overview", response_model=DrugOverview)
def get_drug_overview(
    drug_name: str,
    db: Session = Depends(get_db)
):
    """
    Get overview statistics and charts for a specific drug.
    """
    # Normalize the drug name for querying
    drug_name_normalized = drug_name.upper().strip()

    # Get overall statistics
    stats = (
        db.query(
            func.count(distinct(CaseReport.id)).label('total_cases'),
            func.sum(func.cast(CaseReport.serious, type_=func.integer())).label('serious_cases'),
            func.sum(func.cast(CaseReport.serious_death, type_=func.integer())).label('deaths'),
            func.sum(func.cast(CaseReport.serious_hospitalization, type_=func.integer())).label('hospitalizations'),
            func.min(CaseReport.received_date).label('first_date'),
            func.max(CaseReport.received_date).label('last_date'),
        )
        .join(DrugProduct, DrugProduct.case_report_id == CaseReport.id)
        .filter(DrugProduct.product_name_normalized == drug_name_normalized)
    ).first()

    if not stats or not stats.total_cases:
        raise HTTPException(status_code=404, detail="Drug not found")

    # Get time series data (by quarter)
    time_series_data = (
        db.query(
            CaseReport.year,
            CaseReport.quarter,
            func.count(distinct(CaseReport.id)).label('cases'),
            func.sum(func.cast(CaseReport.serious, type_=func.integer())).label('serious'),
            func.sum(func.cast(CaseReport.serious_death, type_=func.integer())).label('deaths'),
        )
        .join(DrugProduct, DrugProduct.case_report_id == CaseReport.id)
        .filter(DrugProduct.product_name_normalized == drug_name_normalized)
        .filter(CaseReport.year.isnot(None))
        .group_by(CaseReport.year, CaseReport.quarter)
        .order_by(CaseReport.year, CaseReport.quarter)
    ).all()

    time_series = []
    for ts in time_series_data:
        date_label = f"{ts.year}" + (f" Q{ts.quarter}" if ts.quarter else "")
        time_series.append(TimeSeriesPoint(
            year=ts.year,
            quarter=ts.quarter,
            date_label=date_label,
            case_count=ts.cases or 0,
            serious_case_count=ts.serious or 0,
            death_count=ts.deaths or 0,
        ))

    # Get top reactions using aggregation table
    top_reactions_data = (
        db.query(
            DrugReactionAgg.meddra_pt,
            func.sum(DrugReactionAgg.case_count).label('total_cases'),
            func.sum(DrugReactionAgg.serious_case_count).label('serious_cases'),
            func.sum(DrugReactionAgg.death_count).label('deaths'),
            func.avg(DrugReactionAgg.prr).label('avg_prr'),
            func.bool_or(DrugReactionAgg.signal_flag).label('has_signal'),
        )
        .filter(DrugReactionAgg.product_name_normalized == drug_name_normalized)
        .group_by(DrugReactionAgg.meddra_pt)
        .order_by(func.sum(DrugReactionAgg.case_count).desc())
        .limit(20)
    ).all()

    top_reactions = []
    for rxn in top_reactions_data:
        top_reactions.append(TopReaction(
            meddra_pt=rxn.meddra_pt,
            case_count=rxn.total_cases or 0,
            serious_case_count=rxn.serious_cases or 0,
            death_count=rxn.deaths or 0,
            prr=round(rxn.avg_prr, 2) if rxn.avg_prr else None,
            signal_flag=rxn.has_signal or False,
        ))

    return DrugOverview(
        product_name_normalized=drug_name_normalized,
        total_case_count=stats.total_cases or 0,
        serious_case_count=stats.serious_cases or 0,
        death_count=stats.deaths or 0,
        hospitalization_count=stats.hospitalizations or 0,
        first_report_date=stats.first_date,
        last_report_date=stats.last_date,
        time_series=time_series,
        top_reactions=top_reactions,
    )


@router.get("/drug/{drug_name}/reactions", response_model=ReactionListResponse)
def get_drug_reactions(
    drug_name: str,
    min_cases: int = Query(1, ge=1),
    sort_by: str = Query("cases", regex="^(cases|serious|death|prr)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get all reactions for a specific drug with filtering and sorting.
    """
    drug_name_normalized = drug_name.upper().strip()

    # Build query
    query = (
        db.query(
            DrugReactionAgg.meddra_pt,
            func.sum(DrugReactionAgg.case_count).label('total_cases'),
            func.sum(DrugReactionAgg.serious_case_count).label('serious_cases'),
            func.sum(DrugReactionAgg.death_count).label('deaths'),
            func.sum(DrugReactionAgg.hospitalization_count).label('hospitalizations'),
            func.avg(DrugReactionAgg.prr).label('avg_prr'),
            func.avg(DrugReactionAgg.ror).label('avg_ror'),
            func.bool_or(DrugReactionAgg.signal_flag).label('has_signal'),
        )
        .filter(DrugReactionAgg.product_name_normalized == drug_name_normalized)
        .group_by(DrugReactionAgg.meddra_pt)
        .having(func.sum(DrugReactionAgg.case_count) >= min_cases)
    )

    # Sort
    if sort_by == "serious":
        query = query.order_by(func.sum(DrugReactionAgg.serious_case_count).desc())
    elif sort_by == "death":
        query = query.order_by(func.sum(DrugReactionAgg.death_count).desc())
    elif sort_by == "prr":
        query = query.order_by(func.avg(DrugReactionAgg.prr).desc())
    else:  # cases
        query = query.order_by(func.sum(DrugReactionAgg.case_count).desc())

    # Get total count
    total_query = (
        db.query(func.count(distinct(DrugReactionAgg.meddra_pt)))
        .filter(DrugReactionAgg.product_name_normalized == drug_name_normalized)
    )
    total = total_query.scalar() or 0

    # Apply pagination
    results = query.limit(limit).offset(offset).all()

    reactions = []
    for rxn in results:
        reactions.append(ReactionDetail(
            meddra_pt=rxn.meddra_pt,
            total_case_count=rxn.total_cases or 0,
            serious_case_count=rxn.serious_cases or 0,
            death_count=rxn.deaths or 0,
            hospitalization_count=rxn.hospitalizations or 0,
            prr=round(rxn.avg_prr, 2) if rxn.avg_prr else None,
            ror=round(rxn.avg_ror, 2) if rxn.avg_ror else None,
            signal_flag=rxn.has_signal or False,
        ))

    return ReactionListResponse(
        drug_name=drug_name_normalized,
        reactions=reactions,
        total_reactions=total,
        limit=limit,
        offset=offset
    )


@router.get("/drug/{drug_name}/reaction/{meddra_pt}/timeseries", response_model=ReactionTimeSeries)
def get_reaction_timeseries(
    drug_name: str,
    meddra_pt: str,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    group_by: str = Query("quarter", regex="^(year|quarter)$"),
    db: Session = Depends(get_db)
):
    """
    Get time series data for a specific drug-reaction pair.
    """
    drug_name_normalized = drug_name.upper().strip()
    meddra_pt = meddra_pt.upper().strip()

    # Build query
    if group_by == "year":
        query = (
            db.query(
                DrugReactionAgg.year,
                func.sum(DrugReactionAgg.case_count).label('cases'),
                func.sum(DrugReactionAgg.serious_case_count).label('serious'),
                func.sum(DrugReactionAgg.death_count).label('deaths'),
                func.avg(DrugReactionAgg.prr).label('prr'),
                func.avg(DrugReactionAgg.ror).label('ror'),
            )
            .filter(and_(
                DrugReactionAgg.product_name_normalized == drug_name_normalized,
                DrugReactionAgg.meddra_pt == meddra_pt
            ))
            .group_by(DrugReactionAgg.year)
            .order_by(DrugReactionAgg.year)
        )
    else:  # quarter
        query = (
            db.query(
                DrugReactionAgg.year,
                DrugReactionAgg.quarter,
                DrugReactionAgg.case_count.label('cases'),
                DrugReactionAgg.serious_case_count.label('serious'),
                DrugReactionAgg.death_count.label('deaths'),
                DrugReactionAgg.prr,
                DrugReactionAgg.ror,
            )
            .filter(and_(
                DrugReactionAgg.product_name_normalized == drug_name_normalized,
                DrugReactionAgg.meddra_pt == meddra_pt
            ))
            .order_by(DrugReactionAgg.year, DrugReactionAgg.quarter)
        )

    # Apply year filters
    if start_year:
        query = query.filter(DrugReactionAgg.year >= start_year)
    if end_year:
        query = query.filter(DrugReactionAgg.year <= end_year)

    results = query.all()

    time_series = []
    for ts in results:
        quarter = ts.quarter if group_by == "quarter" else None
        date_label = f"{ts.year}" + (f" Q{quarter}" if quarter else "")

        time_series.append(ReactionTimeSeriesPoint(
            year=ts.year,
            quarter=quarter,
            date_label=date_label,
            case_count=ts.cases or 0,
            serious_case_count=ts.serious or 0,
            death_count=ts.deaths or 0,
            prr=round(ts.prr, 2) if ts.prr else None,
            ror=round(ts.ror, 2) if ts.ror else None,
        ))

    return ReactionTimeSeries(
        drug_name=drug_name_normalized,
        meddra_pt=meddra_pt,
        time_series=time_series
    )
