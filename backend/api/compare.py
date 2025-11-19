"""Drug comparison API endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional

from backend.db import get_db
from backend.models import DrugReactionAgg
from backend.schemas import (
    DrugComparisonResponse, DrugComparisonPoint,
    ReactionComparisonResponse, ReactionComparisonDrugSeries,
    ReactionTimeSeriesPoint
)

router = APIRouter()


@router.get("/compare/drugs", response_model=DrugComparisonResponse)
def compare_drugs(
    drug_names: List[str] = Query(..., description="List of drug names to compare"),
    metric: str = Query("total_cases", regex="^(total_cases|serious_cases|death_count)$"),
    group_by: str = Query("quarter", regex="^(year|quarter)$"),
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Compare multiple drugs over time.

    Returns aligned time series for selected metric.
    """
    if len(drug_names) > 10:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Maximum 10 drugs can be compared")

    # Normalize drug names
    normalized_names = [name.upper().strip() for name in drug_names]

    # Determine which column to aggregate
    if metric == "serious_cases":
        metric_col = DrugReactionAgg.serious_case_count
    elif metric == "death_count":
        metric_col = DrugReactionAgg.death_count
    else:
        metric_col = DrugReactionAgg.case_count

    # Get data for all drugs
    results_by_drug = {}

    for drug_name in normalized_names:
        if group_by == "year":
            query = (
                db.query(
                    DrugReactionAgg.year,
                    func.sum(metric_col).label('value')
                )
                .filter(DrugReactionAgg.product_name_normalized == drug_name)
                .group_by(DrugReactionAgg.year)
                .order_by(DrugReactionAgg.year)
            )
        else:  # quarter
            query = (
                db.query(
                    DrugReactionAgg.year,
                    DrugReactionAgg.quarter,
                    func.sum(metric_col).label('value')
                )
                .filter(DrugReactionAgg.product_name_normalized == drug_name)
                .filter(DrugReactionAgg.quarter.isnot(None))
                .group_by(DrugReactionAgg.year, DrugReactionAgg.quarter)
                .order_by(DrugReactionAgg.year, DrugReactionAgg.quarter)
            )

        # Apply year filters
        if start_year:
            query = query.filter(DrugReactionAgg.year >= start_year)
        if end_year:
            query = query.filter(DrugReactionAgg.year <= end_year)

        results = query.all()

        # Store results in dictionary keyed by time period
        for result in results:
            if group_by == "year":
                time_key = (result.year, None)
            else:
                time_key = (result.year, result.quarter)

            if time_key not in results_by_drug:
                results_by_drug[time_key] = {}

            results_by_drug[time_key][drug_name] = result.value or 0

    # Build aligned time series
    time_series = []
    for time_key in sorted(results_by_drug.keys()):
        year, quarter = time_key
        date_label = f"{year}" + (f" Q{quarter}" if quarter else "")

        drugs_data = {drug: results_by_drug[time_key].get(drug, 0) for drug in normalized_names}

        time_series.append(DrugComparisonPoint(
            year=year,
            quarter=quarter,
            date_label=date_label,
            drugs=drugs_data
        ))

    return DrugComparisonResponse(
        metric=metric,
        time_series=time_series
    )


@router.get("/compare/reactions", response_model=ReactionComparisonResponse)
def compare_reaction_across_drugs(
    drug_names: List[str] = Query(..., description="List of drug names to compare"),
    meddra_pt: str = Query(..., description="Reaction term to compare"),
    group_by: str = Query("quarter", regex="^(year|quarter)$"),
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Compare a specific reaction across multiple drugs over time.
    """
    if len(drug_names) > 10:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Maximum 10 drugs can be compared")

    # Normalize
    normalized_names = [name.upper().strip() for name in drug_names]
    meddra_pt_normalized = meddra_pt.upper().strip()

    # Get data for each drug
    drug_series = []

    for drug_name in normalized_names:
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
                    DrugReactionAgg.product_name_normalized == drug_name,
                    DrugReactionAgg.meddra_pt == meddra_pt_normalized
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
                    DrugReactionAgg.product_name_normalized == drug_name,
                    DrugReactionAgg.meddra_pt == meddra_pt_normalized
                ))
                .filter(DrugReactionAgg.quarter.isnot(None))
                .order_by(DrugReactionAgg.year, DrugReactionAgg.quarter)
            )

        # Apply year filters
        if start_year:
            query = query.filter(DrugReactionAgg.year >= start_year)
        if end_year:
            query = query.filter(DrugReactionAgg.year <= end_year)

        results = query.all()

        # Build time series for this drug
        time_series = []
        for result in results:
            quarter = result.quarter if group_by == "quarter" else None
            date_label = f"{result.year}" + (f" Q{quarter}" if quarter else "")

            time_series.append(ReactionTimeSeriesPoint(
                year=result.year,
                quarter=quarter,
                date_label=date_label,
                case_count=result.cases or 0,
                serious_case_count=result.serious or 0,
                death_count=result.deaths or 0,
                prr=round(result.prr, 2) if result.prr else None,
                ror=round(result.ror, 2) if result.ror else None,
            ))

        drug_series.append(ReactionComparisonDrugSeries(
            drug_name=drug_name,
            time_series=time_series
        ))

    return ReactionComparisonResponse(
        meddra_pt=meddra_pt_normalized,
        drug_series=drug_series
    )
