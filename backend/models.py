"""SQLAlchemy database models for FAERS data."""
from sqlalchemy import (
    Column, Integer, String, Date, Boolean, Float, ForeignKey, Index, JSON, Text
)
from sqlalchemy.orm import relationship
from backend.db import Base


class CaseReport(Base):
    """Main case report table - represents a single FAERS report."""
    __tablename__ = "case_report"

    id = Column(Integer, primary_key=True, index=True)
    safety_report_id = Column(String(50), unique=True, index=True, nullable=False)
    version_number = Column(Integer, default=1)
    received_date = Column(Date, index=True)
    initial_report_date = Column(Date)

    # Patient demographics
    patient_age = Column(Float)
    patient_age_unit = Column(String(10))  # YR, MON, DY, etc.
    patient_sex = Column(String(10))
    patient_weight = Column(Float)
    patient_weight_unit = Column(String(10))

    # Report metadata
    reporter_country = Column(String(2), index=True)
    reporter_occupation = Column(String(50))

    # Seriousness indicators
    serious = Column(Boolean, default=False, index=True)
    serious_death = Column(Boolean, default=False, index=True)
    serious_life_threatening = Column(Boolean, default=False)
    serious_hospitalization = Column(Boolean, default=False, index=True)
    serious_disability = Column(Boolean, default=False)
    serious_congenital_anomaly = Column(Boolean, default=False)
    serious_other = Column(Boolean, default=False)

    # Additional metadata
    metadata = Column(JSON)

    # Year and quarter for easy filtering
    year = Column(Integer, index=True)
    quarter = Column(Integer, index=True)

    # Relationships
    drugs = relationship("DrugProduct", back_populates="case_report", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="case_report", cascade="all, delete-orphan")
    outcomes = relationship("Outcome", back_populates="case_report", cascade="all, delete-orphan")
    indications = relationship("Indication", back_populates="case_report", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_case_date_year_quarter', 'year', 'quarter'),
        Index('idx_case_serious_death', 'serious', 'serious_death'),
    )


class DrugProduct(Base):
    """Drug products associated with case reports."""
    __tablename__ = "drug_product"

    id = Column(Integer, primary_key=True, index=True)
    case_report_id = Column(Integer, ForeignKey("case_report.id", ondelete="CASCADE"), nullable=False, index=True)
    drug_sequence = Column(String(10))

    # Role codes: PS (Primary Suspect), SS (Secondary Suspect), C (Concomitant), I (Interacting)
    role_code = Column(String(2), index=True)

    # Product names
    product_name_raw = Column(String(500))
    product_name_normalized = Column(String(500), index=True)

    # Drug details
    route = Column(String(50))
    dosage_text = Column(Text)
    indication_raw = Column(Text)

    # Manufacturer
    manufacturer_name = Column(String(200))

    # Additional metadata
    metadata = Column(JSON)

    # Relationship
    case_report = relationship("CaseReport", back_populates="drugs")

    __table_args__ = (
        Index('idx_drug_normalized_role', 'product_name_normalized', 'role_code'),
    )


class Reaction(Base):
    """Adverse reactions/events associated with case reports."""
    __tablename__ = "reaction"

    id = Column(Integer, primary_key=True, index=True)
    case_report_id = Column(Integer, ForeignKey("case_report.id", ondelete="CASCADE"), nullable=False, index=True)

    # MedDRA terminology
    meddra_pt = Column(String(200), index=True)  # Preferred Term
    meddra_pt_code = Column(String(20))

    # Additional metadata
    metadata = Column(JSON)

    # Relationship
    case_report = relationship("CaseReport", back_populates="reactions")

    __table_args__ = (
        Index('idx_reaction_pt_case', 'meddra_pt', 'case_report_id'),
    )


class Outcome(Base):
    """Outcomes associated with case reports."""
    __tablename__ = "outcome"

    id = Column(Integer, primary_key=True, index=True)
    case_report_id = Column(Integer, ForeignKey("case_report.id", ondelete="CASCADE"), nullable=False, index=True)

    # Outcome codes: DE (Death), LT (Life-Threatening), HO (Hospitalization),
    # DS (Disability), CA (Congenital Anomaly), OT (Other)
    outcome_code = Column(String(2), index=True)

    # Relationship
    case_report = relationship("CaseReport", back_populates="outcomes")


class Indication(Base):
    """Indications (reasons for use) associated with drugs in case reports."""
    __tablename__ = "indication"

    id = Column(Integer, primary_key=True, index=True)
    case_report_id = Column(Integer, ForeignKey("case_report.id", ondelete="CASCADE"), nullable=False, index=True)
    drug_sequence = Column(String(10))

    indication_text = Column(Text)
    indication_meddra_pt = Column(String(200))

    # Relationship
    case_report = relationship("CaseReport", back_populates="indications")


class DrugReactionAgg(Base):
    """Aggregated statistics for drug-reaction pairs by time period."""
    __tablename__ = "drug_reaction_agg"

    id = Column(Integer, primary_key=True, index=True)

    # Drug and reaction
    product_name_normalized = Column(String(500), index=True, nullable=False)
    meddra_pt = Column(String(200), index=True, nullable=False)

    # Time period
    year = Column(Integer, index=True, nullable=False)
    quarter = Column(Integer, index=True)  # NULL means full year

    # Counts for this drug-reaction-period
    case_count = Column(Integer, default=0)
    serious_case_count = Column(Integer, default=0)
    death_count = Column(Integer, default=0)
    hospitalization_count = Column(Integer, default=0)

    # Background counts for PRR/ROR calculation
    # Total reports for this reaction (all drugs) in this period
    total_reaction_reports = Column(Integer, default=0)
    # Total reports for this drug (all reactions) in this period
    total_drug_reports = Column(Integer, default=0)
    # Total reports (all drugs, all reactions) in this period
    total_all_reports = Column(Integer, default=0)

    # Disproportionality metrics
    prr = Column(Float)  # Proportional Reporting Ratio
    prr_lower_ci = Column(Float)
    prr_upper_ci = Column(Float)
    ror = Column(Float)  # Reporting Odds Ratio
    ror_lower_ci = Column(Float)
    ror_upper_ci = Column(Float)

    # Signal flag (based on thresholds: PRR >= 2, cases >= 3, chi-square >= 4)
    signal_flag = Column(Boolean, default=False, index=True)

    # Additional metadata
    metadata = Column(JSON)

    __table_args__ = (
        Index('idx_agg_drug_reaction', 'product_name_normalized', 'meddra_pt'),
        Index('idx_agg_year_quarter', 'year', 'quarter'),
        Index('idx_agg_drug_year', 'product_name_normalized', 'year', 'quarter'),
        Index('idx_agg_signal', 'signal_flag', 'prr'),
    )
