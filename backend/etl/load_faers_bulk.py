"""Load FAERS bulk data into PostgreSQL database."""
import argparse
import os
import sys
import logging
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.db import SessionLocal, engine, Base
from backend.models import CaseReport, DrugProduct, Reaction, Outcome, Indication
from backend.etl.faers_bulk_parser import FAERSBulkParser, parse_faers_date

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FAERSBulkLoader:
    """Load FAERS bulk data into database."""

    def __init__(self, db: Session):
        self.db = db

    def load_quarter(self, quarter_path: str) -> Dict[str, int]:
        """
        Load data from a single quarter directory.

        Returns:
            Dictionary with counts of loaded records
        """
        logger.info(f"Loading data from {quarter_path}")

        parser = FAERSBulkParser(quarter_path)
        data = parser.parse_all()

        if not any(df is not None for df in data.values()):
            logger.error(f"No valid data files found in {quarter_path}")
            return {}

        demo_df = data['demo']
        drug_df = data['drug']
        reac_df = data['reac']
        outc_df = data['outc']
        indi_df = data['indi']

        if demo_df is None:
            logger.error("DEMO file is required but not found")
            return {}

        stats = {
            'cases_processed': 0,
            'cases_inserted': 0,
            'cases_updated': 0,
            'drugs_inserted': 0,
            'reactions_inserted': 0,
            'outcomes_inserted': 0,
            'indications_inserted': 0,
        }

        # Process each case in DEMO
        for idx, row in demo_df.iterrows():
            try:
                primaryid = str(row.get('primaryid', ''))
                caseid = str(row.get('caseid', ''))

                # Use primaryid as safety_report_id (unique identifier for this version)
                safety_report_id = primaryid if primaryid else caseid

                if not safety_report_id:
                    continue

                stats['cases_processed'] += 1

                # Check if case already exists
                existing_case = self.db.query(CaseReport).filter(
                    CaseReport.safety_report_id == safety_report_id
                ).first()

                # Parse dates
                received_date = parse_faers_date(row.get('fda_dt', ''))
                init_date = parse_faers_date(row.get('init_fda_dt', ''))

                # Extract age
                age = None
                age_unit = None
                try:
                    age_str = row.get('age', '')
                    if pd.notna(age_str) and age_str:
                        age = float(age_str)
                        age_unit = str(row.get('age_cod', 'YR'))
                except (ValueError, TypeError):
                    pass

                # Extract weight
                weight = None
                weight_unit = None
                try:
                    weight_str = row.get('wt', '')
                    if pd.notna(weight_str) and weight_str:
                        weight = float(weight_str)
                        weight_unit = str(row.get('wt_cod', 'KG'))
                except (ValueError, TypeError):
                    pass

                # Determine year and quarter
                year = parser.year
                quarter = parser.quarter
                if received_date and not year:
                    year = received_date.year
                    quarter = (received_date.month - 1) // 3 + 1

                # Seriousness indicators
                serious = None
                serious_death = None
                serious_lt = None
                serious_hosp = None
                serious_disab = None
                serious_congen = None
                serious_other = None

                # Check different column name variations
                for col_name in ['serious', 'ser']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious = str(row.get(col_name)).strip() == '1'
                        break

                # Outcomes (some are in DEMO, some in OUTC)
                for col_name in ['death', 'de']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_death = str(row.get(col_name)).strip() == '1'
                        break

                for col_name in ['lt']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_lt = str(row.get(col_name)).strip() == '1'
                        break

                for col_name in ['hosp']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_hosp = str(row.get(col_name)).strip() == '1'
                        break

                for col_name in ['disab']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_disab = str(row.get(col_name)).strip() == '1'
                        break

                for col_name in ['congen']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_congen = str(row.get(col_name)).strip() == '1'
                        break

                for col_name in ['ot']:
                    if col_name in row and pd.notna(row.get(col_name)):
                        serious_other = str(row.get(col_name)).strip() == '1'
                        break

                if existing_case:
                    # Update existing case
                    existing_case.received_date = received_date
                    existing_case.initial_report_date = init_date
                    existing_case.patient_age = age
                    existing_case.patient_age_unit = age_unit
                    existing_case.patient_sex = str(row.get('sex', ''))[:10] if pd.notna(row.get('sex')) else None
                    existing_case.patient_weight = weight
                    existing_case.patient_weight_unit = weight_unit
                    existing_case.reporter_country = str(row.get('occr_country', ''))[:2] if pd.notna(row.get('occr_country')) else None
                    existing_case.serious = serious
                    existing_case.serious_death = serious_death
                    existing_case.serious_life_threatening = serious_lt
                    existing_case.serious_hospitalization = serious_hosp
                    existing_case.serious_disability = serious_disab
                    existing_case.serious_congenital_anomaly = serious_congen
                    existing_case.serious_other = serious_other
                    existing_case.year = year
                    existing_case.quarter = quarter

                    case = existing_case
                    stats['cases_updated'] += 1
                else:
                    # Create new case
                    case = CaseReport(
                        safety_report_id=safety_report_id,
                        version_number=1,
                        received_date=received_date,
                        initial_report_date=init_date,
                        patient_age=age,
                        patient_age_unit=age_unit,
                        patient_sex=str(row.get('sex', ''))[:10] if pd.notna(row.get('sex')) else None,
                        patient_weight=weight,
                        patient_weight_unit=weight_unit,
                        reporter_country=str(row.get('occr_country', ''))[:2] if pd.notna(row.get('occr_country')) else None,
                        reporter_occupation=str(row.get('occp_cod', ''))[:50] if pd.notna(row.get('occp_cod')) else None,
                        serious=serious,
                        serious_death=serious_death,
                        serious_life_threatening=serious_lt,
                        serious_hospitalization=serious_hosp,
                        serious_disability=serious_disab,
                        serious_congenital_anomaly=serious_congen,
                        serious_other=serious_other,
                        year=year,
                        quarter=quarter,
                    )
                    self.db.add(case)
                    stats['cases_inserted'] += 1

                self.db.flush()

                # Load associated drugs
                if drug_df is not None:
                    case_drugs = drug_df[drug_df['primaryid'] == primaryid]
                    for _, drug_row in case_drugs.iterrows():
                        drug = DrugProduct(
                            case_report_id=case.id,
                            drug_sequence=str(drug_row.get('drug_seq', ''))[:10] if pd.notna(drug_row.get('drug_seq')) else None,
                            role_code=str(drug_row.get('role_cod', ''))[:2] if pd.notna(drug_row.get('role_cod')) else None,
                            product_name_raw=str(drug_row.get('drugname', ''))[:500] if pd.notna(drug_row.get('drugname')) else None,
                            product_name_normalized=str(drug_row.get('product_name_normalized', ''))[:500] if pd.notna(drug_row.get('product_name_normalized')) else None,
                            route=str(drug_row.get('route', ''))[:50] if pd.notna(drug_row.get('route')) else None,
                            dosage_text=str(drug_row.get('dose_amt', '')) if pd.notna(drug_row.get('dose_amt')) else None,
                            manufacturer_name=str(drug_row.get('mfr_sndr', ''))[:200] if pd.notna(drug_row.get('mfr_sndr')) else None,
                        )
                        self.db.add(drug)
                        stats['drugs_inserted'] += 1

                # Load associated reactions
                if reac_df is not None:
                    case_reacs = reac_df[reac_df['primaryid'] == primaryid]
                    for _, reac_row in case_reacs.iterrows():
                        reaction = Reaction(
                            case_report_id=case.id,
                            meddra_pt=str(reac_row.get('pt', ''))[:200] if pd.notna(reac_row.get('pt')) else None,
                        )
                        self.db.add(reaction)
                        stats['reactions_inserted'] += 1

                # Load associated outcomes
                if outc_df is not None:
                    case_outcs = outc_df[outc_df['primaryid'] == primaryid]
                    for _, outc_row in case_outcs.iterrows():
                        outcome = Outcome(
                            case_report_id=case.id,
                            outcome_code=str(outc_row.get('outc_cod', ''))[:2] if pd.notna(outc_row.get('outc_cod')) else None,
                        )
                        self.db.add(outcome)
                        stats['outcomes_inserted'] += 1

                # Load associated indications
                if indi_df is not None:
                    case_indis = indi_df[indi_df['primaryid'] == primaryid]
                    for _, indi_row in case_indis.iterrows():
                        indication = Indication(
                            case_report_id=case.id,
                            drug_sequence=str(indi_row.get('drug_seq', ''))[:10] if pd.notna(indi_row.get('drug_seq')) else None,
                            indication_text=str(indi_row.get('indi_pt', '')) if pd.notna(indi_row.get('indi_pt')) else None,
                        )
                        self.db.add(indication)
                        stats['indications_inserted'] += 1

                # Commit in batches
                if stats['cases_processed'] % 1000 == 0:
                    self.db.commit()
                    logger.info(f"Processed {stats['cases_processed']} cases...")

            except Exception as e:
                logger.error(f"Error processing case {idx}: {e}")
                continue

        # Final commit
        self.db.commit()
        logger.info(f"Completed loading quarter: {stats}")

        return stats


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description='Load FAERS bulk data into database')
    parser.add_argument('--data-root', default='./data/faers/raw',
                       help='Root directory containing quarterly FAERS folders')
    parser.add_argument('--quarter', help='Specific quarter to load (e.g., 23Q1)')
    parser.add_argument('--init-db', action='store_true',
                       help='Initialize database schema before loading')

    args = parser.parse_args()

    # Initialize database if requested
    if args.init_db:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)

    # Get list of quarters to process
    quarters_to_load = []
    if args.quarter:
        quarter_path = os.path.join(args.data_root, args.quarter)
        if os.path.exists(quarter_path):
            quarters_to_load.append(quarter_path)
        else:
            logger.error(f"Quarter directory not found: {quarter_path}")
            return
    else:
        # Load all quarters in data root
        if os.path.exists(args.data_root):
            for entry in os.listdir(args.data_root):
                quarter_path = os.path.join(args.data_root, entry)
                if os.path.isdir(quarter_path):
                    quarters_to_load.append(quarter_path)

    if not quarters_to_load:
        logger.error(f"No quarter directories found in {args.data_root}")
        return

    quarters_to_load.sort()

    # Load each quarter
    db = SessionLocal()
    loader = FAERSBulkLoader(db)

    total_stats = {
        'cases_processed': 0,
        'cases_inserted': 0,
        'cases_updated': 0,
        'drugs_inserted': 0,
        'reactions_inserted': 0,
        'outcomes_inserted': 0,
        'indications_inserted': 0,
    }

    try:
        for quarter_path in quarters_to_load:
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing {os.path.basename(quarter_path)}")
            logger.info(f"{'='*60}")

            stats = loader.load_quarter(quarter_path)
            for key in total_stats:
                total_stats[key] += stats.get(key, 0)

        logger.info(f"\n{'='*60}")
        logger.info("TOTAL SUMMARY")
        logger.info(f"{'='*60}")
        for key, value in total_stats.items():
            logger.info(f"{key}: {value:,}")

    finally:
        db.close()


if __name__ == '__main__':
    main()
