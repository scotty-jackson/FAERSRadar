"""Global reactions and outcomes API endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct
from typing import Optional

from backend.db import get_db
from backend.models import (
    CaseReport, DrugProduct, Reaction, Outcome, DrugReactionAgg
)
from backend.schemas import (
    GlobalReactionsResponse, GlobalReactionSummary,
    OutcomesResponse, OutcomeSummary
)

router = APIRouter()


@router.get("/reactions/top", response_model=GlobalReactionsResponse)
def get_top_reactions(
    year: Optional[int] = None,
    serious_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get top reactions overall (optionally filtered by year and seriousness).
    """
    # Build query on aggregation table
    query = db.query(
        DrugReactionAgg.meddra_pt,
        func.sum(DrugReactionAgg.case_count).label('total_cases'),
        func.sum(DrugReactionAgg.serious_case_count).label('serious_cases'),
        func.sum(DrugReactionAgg.death_count).label('deaths'),
    )

    if year:
        query = query.filter(DrugReactionAgg.year == year)

    query = query.group_by(DrugReactionAgg.meddra_pt)

    if serious_only:
        query = query.having(func.sum(DrugReactionAgg.serious_case_count) > 0)
        query = query.order_by(func.sum(DrugReactionAgg.serious_case_count).desc())
    else:
        query = query.order_by(func.sum(DrugReactionAgg.case_count).desc())

    # Get total count
    count_query = (
        db.query(func.count(distinct(DrugReactionAgg.meddra_pt)))
    )
    if year:
        count_query = count_query.filter(DrugReactionAgg.year == year)

    total = count_query.scalar() or 0

    # Get paginated results
    results = query.limit(limit).offset(offset).all()

    # For each reaction, get top associated drugs
    reactions = []
    for rxn in results:
        # Get top 3 drugs for this reaction
        top_drugs_query = (
            db.query(DrugReactionAgg.product_name_normalized)
            .filter(DrugReactionAgg.meddra_pt == rxn.meddra_pt)
            .group_by(DrugReactionAgg.product_name_normalized)
            .order_by(func.sum(DrugReactionAgg.case_count).desc())
            .limit(3)
        )

        if year:
            top_drugs_query = top_drugs_query.filter(DrugReactionAgg.year == year)

        top_drugs = [drug[0] for drug in top_drugs_query.all()]

        reactions.append(GlobalReactionSummary(
            meddra_pt=rxn.meddra_pt,
            total_case_count=rxn.total_cases or 0,
            serious_case_count=rxn.serious_cases or 0,
            death_count=rxn.deaths or 0,
            top_associated_drugs=top_drugs
        ))

    return GlobalReactionsResponse(
        reactions=reactions,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/outcomes/summary", response_model=OutcomesResponse)
def get_outcomes_summary(
    drug_name: Optional[str] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get distribution of outcomes (death, hospitalization, etc.).

    Optionally filtered by drug and year range.
    """
    # Build query
    query = db.query(
        Outcome.outcome_code,
        func.count(distinct(Outcome.case_report_id)).label('count')
    ).join(CaseReport, CaseReport.id == Outcome.case_report_id)

    if drug_name:
        drug_name_normalized = drug_name.upper().strip()
        query = query.join(
            DrugProduct,
            DrugProduct.case_report_id == CaseReport.id
        ).filter(DrugProduct.product_name_normalized == drug_name_normalized)

    if start_year:
        query = query.filter(CaseReport.year >= start_year)
    if end_year:
        query = query.filter(CaseReport.year <= end_year)

    query = query.group_by(Outcome.outcome_code)

    results = query.all()

    # Map outcome codes to labels
    outcome_labels = {
        'DE': 'Death',
        'LT': 'Life-Threatening',
        'HO': 'Hospitalization',
        'DS': 'Disability',
        'CA': 'Congenital Anomaly',
        'OT': 'Other Serious',
    }

    outcomes = []
    total_cases = 0

    for outcome in results:
        code = outcome.outcome_code or 'UN'
        label = outcome_labels.get(code, f'Unknown ({code})')
        count = outcome.count or 0
        total_cases += count

        outcomes.append(OutcomeSummary(
            outcome_code=code,
            outcome_label=label,
            count=count
        ))

    # Sort by count
    outcomes.sort(key=lambda x: x.count, reverse=True)

    # Build year range string
    year_range = "All years"
    if start_year and end_year:
        year_range = f"{start_year}-{end_year}"
    elif start_year:
        year_range = f"{start_year}+"
    elif end_year:
        year_range = f"Up to {end_year}"

    return OutcomesResponse(
        drug_name=drug_name.upper().strip() if drug_name else None,
        year_range=year_range,
        outcomes=outcomes,
        total_cases=total_cases
    )
