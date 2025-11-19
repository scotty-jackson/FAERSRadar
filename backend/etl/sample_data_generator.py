"""Generate sample FAERS data for testing without real data."""
import argparse
import random
import os
import sys
from datetime import datetime, timedelta
from typing import List, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy.orm import Session

from backend.db import SessionLocal, engine, Base
from backend.models import CaseReport, DrugProduct, Reaction, Outcome, Indication

load_dotenv()

# Sample drugs
SAMPLE_DRUGS = [
    "ASPIRIN", "IBUPROFEN", "ACETAMINOPHEN", "METFORMIN", "LISINOPRIL",
    "ATORVASTATIN", "AMLODIPINE", "OMEPRAZOLE", "LEVOTHYROXINE", "METOPROLOL",
    "SIMVASTATIN", "LOSARTAN", "GABAPENTIN", "HYDROCHLOROTHIAZIDE", "SERTRALINE",
    "MONTELUKAST", "ESCITALOPRAM", "ROSUVASTATIN", "ALBUTEROL", "FUROSEMIDE"
]

# Sample reactions (MedDRA-like terms)
SAMPLE_REACTIONS = [
    "NAUSEA", "HEADACHE", "DIZZINESS", "FATIGUE", "DIARRHEA",
    "VOMITING", "RASH", "PRURITUS", "DYSPNOEA", "ABDOMINAL PAIN",
    "CONSTIPATION", "INSOMNIA", "PAIN", "OEDEMA PERIPHERAL", "COUGH",
    "ASTHENIA", "HYPOTENSION", "HYPERTENSION", "ANXIETY", "DEPRESSION",
    "MYALGIA", "ARTHRALGIA", "BACK PAIN", "CHEST PAIN", "TACHYCARDIA",
    "HYPOGLYCAEMIA", "HYPERKALAEMIA", "ANAPHYLACTIC REACTION", "ANGIOEDEMA",
    "STEVENS-JOHNSON SYNDROME", "HEPATOTOXICITY", "RHABDOMYOLYSIS", "SEIZURE"
]

# Sample indications
SAMPLE_INDICATIONS = [
    "HYPERTENSION", "DIABETES MELLITUS TYPE 2", "HYPERLIPIDAEMIA", "PAIN",
    "DEPRESSION", "ANXIETY", "ASTHMA", "COPD", "HYPOTHYROIDISM",
    "ACID REFLUX", "MIGRAINE", "ARTHRITIS", "HEART FAILURE"
]

# Outcome codes
OUTCOME_CODES = ["DE", "LT", "HO", "DS", "CA", "OT"]


class SampleDataGenerator:
    """Generate sample FAERS-like data for testing."""

    def __init__(self, db: Session):
        self.db = db

    def generate_cases(
        self,
        num_cases: int = 1000,
        start_year: int = 2020,
        end_year: int = 2024
    ) -> None:
        """Generate sample case reports with drugs, reactions, and outcomes."""

        print(f"Generating {num_cases} sample case reports...")

        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        date_range = (end_date - start_date).days

        for i in range(num_cases):
            # Generate random date
            random_days = random.randint(0, date_range)
            report_date = start_date + timedelta(days=random_days)

            # Determine seriousness (30% serious)
            is_serious = random.random() < 0.3

            # Case report
            case = CaseReport(
                safety_report_id=f"SAMPLE-{start_year}-{i+1:06d}",
                version_number=1,
                received_date=report_date.date(),
                initial_report_date=report_date.date(),
                patient_age=random.randint(18, 85) if random.random() < 0.9 else None,
                patient_age_unit="YR",
                patient_sex=random.choice(["M", "F", "UNK"]),
                patient_weight=random.randint(50, 120) if random.random() < 0.7 else None,
                patient_weight_unit="KG",
                reporter_country="US",
                serious=is_serious,
                serious_death=is_serious and random.random() < 0.05,
                serious_life_threatening=is_serious and random.random() < 0.1,
                serious_hospitalization=is_serious and random.random() < 0.4,
                serious_disability=is_serious and random.random() < 0.05,
                serious_congenital_anomaly=False,
                serious_other=is_serious and random.random() < 0.2,
                year=report_date.year,
                quarter=(report_date.month - 1) // 3 + 1,
            )

            self.db.add(case)
            self.db.flush()

            # Add drugs (1-4 drugs per case)
            num_drugs = random.choices([1, 2, 3, 4], weights=[60, 25, 10, 5])[0]
            selected_drugs = random.sample(SAMPLE_DRUGS, num_drugs)

            for seq, drug_name in enumerate(selected_drugs, 1):
                role = "PS" if seq == 1 else random.choice(["SS", "C"])

                drug = DrugProduct(
                    case_report_id=case.id,
                    drug_sequence=str(seq),
                    role_code=role,
                    product_name_raw=drug_name,
                    product_name_normalized=drug_name,
                    route=random.choice(["ORAL", "INTRAVENOUS", "TOPICAL", "SUBCUTANEOUS"]),
                    indication_raw=random.choice(SAMPLE_INDICATIONS),
                )
                self.db.add(drug)

            # Add reactions (1-5 reactions per case)
            num_reactions = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 15, 10, 5])[0]
            selected_reactions = random.sample(SAMPLE_REACTIONS, num_reactions)

            for reaction_name in selected_reactions:
                reaction = Reaction(
                    case_report_id=case.id,
                    meddra_pt=reaction_name,
                )
                self.db.add(reaction)

            # Add outcomes if serious
            if is_serious:
                num_outcomes = random.randint(1, 3)
                selected_outcomes = random.sample(OUTCOME_CODES, num_outcomes)

                for outcome_code in selected_outcomes:
                    outcome = Outcome(
                        case_report_id=case.id,
                        outcome_code=outcome_code,
                    )
                    self.db.add(outcome)

            # Commit in batches
            if (i + 1) % 100 == 0:
                self.db.commit()
                print(f"Generated {i+1} cases...")

        # Final commit
        self.db.commit()
        print(f"Successfully generated {num_cases} sample cases!")

        # Print summary
        total_drugs = self.db.query(DrugProduct).count()
        total_reactions = self.db.query(Reaction).count()
        total_outcomes = self.db.query(Outcome).count()

        print(f"\nSummary:")
        print(f"  Cases: {num_cases:,}")
        print(f"  Drugs: {total_drugs:,}")
        print(f"  Reactions: {total_reactions:,}")
        print(f"  Outcomes: {total_outcomes:,}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Generate sample FAERS data for testing'
    )
    parser.add_argument('--cases', type=int, default=1000,
                       help='Number of sample cases to generate (default: 1000)')
    parser.add_argument('--start-year', type=int, default=2020,
                       help='Start year for sample data (default: 2020)')
    parser.add_argument('--end-year', type=int, default=2024,
                       help='End year for sample data (default: 2024)')
    parser.add_argument('--init-db', action='store_true',
                       help='Initialize database schema before generating')
    parser.add_argument('--clear-existing', action='store_true',
                       help='Clear existing data before generating')

    args = parser.parse_args()

    # Initialize database if requested
    if args.init_db:
        print("Initializing database schema...")
        Base.metadata.create_all(bind=engine)

    # Clear existing data if requested
    if args.clear_existing:
        print("Clearing existing data...")
        db = SessionLocal()
        try:
            db.query(Outcome).delete()
            db.query(Indication).delete()
            db.query(Reaction).delete()
            db.query(DrugProduct).delete()
            db.query(CaseReport).delete()
            db.commit()
            print("Existing data cleared.")
        finally:
            db.close()

    # Generate sample data
    db = SessionLocal()
    generator = SampleDataGenerator(db)

    try:
        generator.generate_cases(
            num_cases=args.cases,
            start_year=args.start_year,
            end_year=args.end_year
        )

        print("\nNext steps:")
        print("1. Build aggregations:")
        print(f"   python -m backend.etl.build_drug_reaction_agg --from-year {args.start_year} --to-year {args.end_year}")
        print("2. Start the backend server:")
        print("   cd backend && python main.py")
        print("3. Start the frontend:")
        print("   cd frontend && npm run dev")

    finally:
        db.close()


if __name__ == '__main__':
    main()
