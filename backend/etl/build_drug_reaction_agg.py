"""Build aggregated drug-reaction statistics with PRR/ROR metrics."""
import argparse
import os
import sys
import logging
from typing import Dict, Optional
import math

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from backend.db import SessionLocal, engine, Base
from backend.models import (
    CaseReport, DrugProduct, Reaction, DrugReactionAgg
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DrugReactionAggBuilder:
    """Build aggregated drug-reaction statistics."""

    def __init__(self, db: Session):
        self.db = db

    def build_aggregations(
        self,
        from_year: int,
        to_year: int,
        by_quarter: bool = True
    ) -> Dict[str, int]:
        """
        Build drug-reaction aggregations for a year range.

        Args:
            from_year: Start year (inclusive)
            to_year: End year (inclusive)
            by_quarter: If True, aggregate by quarter; else by year

        Returns:
            Dictionary with counts of created aggregations
        """
        stats = {'aggregations_created': 0}

        for year in range(from_year, to_year + 1):
            if by_quarter:
                for quarter in range(1, 5):
                    logger.info(f"Building aggregations for {year} Q{quarter}")
                    count = self._build_period(year, quarter)
                    stats['aggregations_created'] += count
            else:
                logger.info(f"Building aggregations for {year}")
                count = self._build_period(year, None)
                stats['aggregations_created'] += count

        return stats

    def _build_period(self, year: int, quarter: Optional[int]) -> int:
        """Build aggregations for a specific time period."""

        # Clear existing aggregations for this period
        query = self.db.query(DrugReactionAgg).filter(
            DrugReactionAgg.year == year
        )
        if quarter is not None:
            query = query.filter(DrugReactionAgg.quarter == quarter)
        else:
            query = query.filter(DrugReactionAgg.quarter.is_(None))

        deleted_count = query.delete()
        logger.info(f"Deleted {deleted_count} existing aggregations")

        # Build filter for case reports
        case_filter = [CaseReport.year == year]
        if quarter is not None:
            case_filter.append(CaseReport.quarter == quarter)

        # Get all drug-reaction combinations for this period
        # Join CaseReport -> DrugProduct -> Reaction
        query = (
            self.db.query(
                DrugProduct.product_name_normalized,
                Reaction.meddra_pt,
                func.count(CaseReport.id).label('case_count'),
                func.sum(
                    func.cast(CaseReport.serious, type_=func.integer())
                ).label('serious_case_count'),
                func.sum(
                    func.cast(CaseReport.serious_death, type_=func.integer())
                ).label('death_count'),
                func.sum(
                    func.cast(CaseReport.serious_hospitalization, type_=func.integer())
                ).label('hospitalization_count'),
            )
            .join(DrugProduct, DrugProduct.case_report_id == CaseReport.id)
            .join(Reaction, Reaction.case_report_id == CaseReport.id)
            .filter(and_(*case_filter))
            .filter(DrugProduct.product_name_normalized.isnot(None))
            .filter(DrugProduct.product_name_normalized != '')
            .filter(Reaction.meddra_pt.isnot(None))
            .filter(Reaction.meddra_pt != '')
            .group_by(
                DrugProduct.product_name_normalized,
                Reaction.meddra_pt
            )
        )

        results = query.all()
        logger.info(f"Found {len(results)} drug-reaction combinations")

        # Get background counts for PRR/ROR calculation
        # Total reports in this period
        total_reports = (
            self.db.query(func.count(func.distinct(CaseReport.id)))
            .filter(and_(*case_filter))
            .scalar()
        ) or 0

        # Build dictionaries for reaction totals and drug totals
        reaction_totals = {}
        drug_totals = {}

        # Get total reports per reaction (across all drugs)
        reaction_query = (
            self.db.query(
                Reaction.meddra_pt,
                func.count(func.distinct(Reaction.case_report_id)).label('count')
            )
            .join(CaseReport, CaseReport.id == Reaction.case_report_id)
            .filter(and_(*case_filter))
            .filter(Reaction.meddra_pt.isnot(None))
            .filter(Reaction.meddra_pt != '')
            .group_by(Reaction.meddra_pt)
        )

        for pt, count in reaction_query.all():
            reaction_totals[pt] = count

        # Get total reports per drug (across all reactions)
        drug_query = (
            self.db.query(
                DrugProduct.product_name_normalized,
                func.count(func.distinct(DrugProduct.case_report_id)).label('count')
            )
            .join(CaseReport, CaseReport.id == DrugProduct.case_report_id)
            .filter(and_(*case_filter))
            .filter(DrugProduct.product_name_normalized.isnot(None))
            .filter(DrugProduct.product_name_normalized != '')
            .group_by(DrugProduct.product_name_normalized)
        )

        for drug_name, count in drug_query.all():
            drug_totals[drug_name] = count

        # Create aggregation records with PRR/ROR
        created_count = 0
        for result in results:
            drug_name = result.product_name_normalized
            meddra_pt = result.meddra_pt
            case_count = result.case_count or 0
            serious_count = result.serious_case_count or 0
            death_count = result.death_count or 0
            hosp_count = result.hospitalization_count or 0

            total_drug = drug_totals.get(drug_name, case_count)
            total_reaction = reaction_totals.get(meddra_pt, case_count)

            # Calculate PRR and ROR
            prr, prr_lower, prr_upper = self._calculate_prr(
                case_count, total_drug, total_reaction, total_reports
            )

            ror, ror_lower, ror_upper = self._calculate_ror(
                case_count, total_drug, total_reaction, total_reports
            )

            # Signal detection: PRR >= 2, cases >= 3, and chi-square >= 4
            signal_flag = False
            if case_count >= 3 and prr is not None and prr >= 2.0:
                chi_square = self._calculate_chi_square(
                    case_count, total_drug, total_reaction, total_reports
                )
                if chi_square >= 4.0:
                    signal_flag = True

            agg = DrugReactionAgg(
                product_name_normalized=drug_name,
                meddra_pt=meddra_pt,
                year=year,
                quarter=quarter,
                case_count=case_count,
                serious_case_count=serious_count,
                death_count=death_count,
                hospitalization_count=hosp_count,
                total_drug_reports=total_drug,
                total_reaction_reports=total_reaction,
                total_all_reports=total_reports,
                prr=prr,
                prr_lower_ci=prr_lower,
                prr_upper_ci=prr_upper,
                ror=ror,
                ror_lower_ci=ror_lower,
                ror_upper_ci=ror_upper,
                signal_flag=signal_flag,
            )

            self.db.add(agg)
            created_count += 1

            if created_count % 1000 == 0:
                self.db.commit()
                logger.info(f"Created {created_count} aggregations...")

        self.db.commit()
        logger.info(f"Created {created_count} aggregations for {year}" +
                   (f" Q{quarter}" if quarter else ""))

        return created_count

    def _calculate_prr(
        self,
        a: int,  # drug-reaction count
        b: int,  # total drug reports
        c: int,  # total reaction reports
        n: int,  # total reports
    ) -> tuple:
        """
        Calculate Proportional Reporting Ratio (PRR) with 95% CI.

        PRR = (a/b) / ((c-a)/(n-b))

        Returns:
            (prr, lower_ci, upper_ci)
        """
        if a == 0 or b == 0 or c == 0 or n == 0:
            return (None, None, None)

        if b == n or c == a:
            return (None, None, None)

        expected = (b * c) / n
        if expected == 0:
            return (None, None, None)

        prr = a / expected

        # Calculate 95% CI using log transformation
        try:
            se_log_prr = math.sqrt(1/a - 1/b + 1/(c-a) - 1/(n-b))
            log_prr = math.log(prr)
            lower_ci = math.exp(log_prr - 1.96 * se_log_prr)
            upper_ci = math.exp(log_prr + 1.96 * se_log_prr)
            return (prr, lower_ci, upper_ci)
        except (ValueError, ZeroDivisionError):
            return (prr, None, None)

    def _calculate_ror(
        self,
        a: int,  # drug-reaction count
        b: int,  # total drug reports
        c: int,  # total reaction reports
        n: int,  # total reports
    ) -> tuple:
        """
        Calculate Reporting Odds Ratio (ROR) with 95% CI.

        ROR = (a/(b-a)) / ((c-a)/(n-b-c+a))

        Returns:
            (ror, lower_ci, upper_ci)
        """
        if a == 0 or b == 0 or c == 0 or n == 0:
            return (None, None, None)

        # 2x2 contingency table:
        # | drug+reaction | drug+other |
        # | other+reaction| other+other|
        #     a               b-a
        #     c-a           n-b-c+a

        b_minus_a = b - a
        c_minus_a = c - a
        d = n - b - c + a

        if b_minus_a <= 0 or c_minus_a <= 0 or d <= 0:
            return (None, None, None)

        ror = (a * d) / (b_minus_a * c_minus_a)

        # Calculate 95% CI
        try:
            se_log_ror = math.sqrt(1/a + 1/b_minus_a + 1/c_minus_a + 1/d)
            log_ror = math.log(ror)
            lower_ci = math.exp(log_ror - 1.96 * se_log_ror)
            upper_ci = math.exp(log_ror + 1.96 * se_log_ror)
            return (ror, lower_ci, upper_ci)
        except (ValueError, ZeroDivisionError):
            return (ror, None, None)

    def _calculate_chi_square(
        self,
        a: int,
        b: int,
        c: int,
        n: int
    ) -> float:
        """Calculate chi-square statistic for signal detection."""
        b_minus_a = b - a
        c_minus_a = c - a
        d = n - b - c + a

        if b_minus_a <= 0 or c_minus_a <= 0 or d <= 0:
            return 0.0

        # Chi-square with Yates correction
        try:
            numerator = abs(a * d - b_minus_a * c_minus_a) - n / 2
            numerator = max(0, numerator) ** 2
            denominator = b * (n - b) * c * (n - c)
            if denominator == 0:
                return 0.0
            chi_square = (n * numerator) / denominator
            return chi_square
        except (ValueError, ZeroDivisionError):
            return 0.0


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Build drug-reaction aggregations with disproportionality metrics'
    )
    parser.add_argument('--from-year', type=int, default=2004,
                       help='Start year (default: 2004)')
    parser.add_argument('--to-year', type=int, default=2024,
                       help='End year (default: 2024)')
    parser.add_argument('--yearly', action='store_true',
                       help='Aggregate by year instead of quarter')
    parser.add_argument('--init-db', action='store_true',
                       help='Initialize database schema before building')

    args = parser.parse_args()

    # Initialize database if requested
    if args.init_db:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)

    # Build aggregations
    db = SessionLocal()
    builder = DrugReactionAggBuilder(db)

    try:
        logger.info(f"Building aggregations from {args.from_year} to {args.to_year}")
        logger.info(f"Aggregation level: {'yearly' if args.yearly else 'quarterly'}")

        stats = builder.build_aggregations(
            from_year=args.from_year,
            to_year=args.to_year,
            by_quarter=not args.yearly
        )

        logger.info(f"\n{'='*60}")
        logger.info("SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total aggregations created: {stats['aggregations_created']:,}")

    finally:
        db.close()


if __name__ == '__main__':
    main()
