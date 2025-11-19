"""Initial schema for FAERS database

Revision ID: 001
Revises:
Create Date: 2025-01-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create case_report table
    op.create_table(
        'case_report',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('safety_report_id', sa.String(length=50), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=True),
        sa.Column('received_date', sa.Date(), nullable=True),
        sa.Column('initial_report_date', sa.Date(), nullable=True),
        sa.Column('patient_age', sa.Float(), nullable=True),
        sa.Column('patient_age_unit', sa.String(length=10), nullable=True),
        sa.Column('patient_sex', sa.String(length=10), nullable=True),
        sa.Column('patient_weight', sa.Float(), nullable=True),
        sa.Column('patient_weight_unit', sa.String(length=10), nullable=True),
        sa.Column('reporter_country', sa.String(length=2), nullable=True),
        sa.Column('reporter_occupation', sa.String(length=50), nullable=True),
        sa.Column('serious', sa.Boolean(), nullable=True),
        sa.Column('serious_death', sa.Boolean(), nullable=True),
        sa.Column('serious_life_threatening', sa.Boolean(), nullable=True),
        sa.Column('serious_hospitalization', sa.Boolean(), nullable=True),
        sa.Column('serious_disability', sa.Boolean(), nullable=True),
        sa.Column('serious_congenital_anomaly', sa.Boolean(), nullable=True),
        sa.Column('serious_other', sa.Boolean(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('quarter', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_case_date_year_quarter', 'case_report', ['year', 'quarter'])
    op.create_index('idx_case_serious_death', 'case_report', ['serious', 'serious_death'])
    op.create_index(op.f('ix_case_report_id'), 'case_report', ['id'])
    op.create_index(op.f('ix_case_report_received_date'), 'case_report', ['received_date'])
    op.create_index(op.f('ix_case_report_reporter_country'), 'case_report', ['reporter_country'])
    op.create_index(op.f('ix_case_report_safety_report_id'), 'case_report', ['safety_report_id'], unique=True)
    op.create_index(op.f('ix_case_report_serious'), 'case_report', ['serious'])
    op.create_index(op.f('ix_case_report_serious_death'), 'case_report', ['serious_death'])
    op.create_index(op.f('ix_case_report_serious_hospitalization'), 'case_report', ['serious_hospitalization'])
    op.create_index(op.f('ix_case_report_year'), 'case_report', ['year'])
    op.create_index(op.f('ix_case_report_quarter'), 'case_report', ['quarter'])

    # Create drug_product table
    op.create_table(
        'drug_product',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_report_id', sa.Integer(), nullable=False),
        sa.Column('drug_sequence', sa.String(length=10), nullable=True),
        sa.Column('role_code', sa.String(length=2), nullable=True),
        sa.Column('product_name_raw', sa.String(length=500), nullable=True),
        sa.Column('product_name_normalized', sa.String(length=500), nullable=True),
        sa.Column('route', sa.String(length=50), nullable=True),
        sa.Column('dosage_text', sa.Text(), nullable=True),
        sa.Column('indication_raw', sa.Text(), nullable=True),
        sa.Column('manufacturer_name', sa.String(length=200), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['case_report_id'], ['case_report.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_drug_normalized_role', 'drug_product', ['product_name_normalized', 'role_code'])
    op.create_index(op.f('ix_drug_product_case_report_id'), 'drug_product', ['case_report_id'])
    op.create_index(op.f('ix_drug_product_id'), 'drug_product', ['id'])
    op.create_index(op.f('ix_drug_product_product_name_normalized'), 'drug_product', ['product_name_normalized'])
    op.create_index(op.f('ix_drug_product_role_code'), 'drug_product', ['role_code'])

    # Create reaction table
    op.create_table(
        'reaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_report_id', sa.Integer(), nullable=False),
        sa.Column('meddra_pt', sa.String(length=200), nullable=True),
        sa.Column('meddra_pt_code', sa.String(length=20), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['case_report_id'], ['case_report.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_reaction_pt_case', 'reaction', ['meddra_pt', 'case_report_id'])
    op.create_index(op.f('ix_reaction_case_report_id'), 'reaction', ['case_report_id'])
    op.create_index(op.f('ix_reaction_id'), 'reaction', ['id'])
    op.create_index(op.f('ix_reaction_meddra_pt'), 'reaction', ['meddra_pt'])

    # Create outcome table
    op.create_table(
        'outcome',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_report_id', sa.Integer(), nullable=False),
        sa.Column('outcome_code', sa.String(length=2), nullable=True),
        sa.ForeignKeyConstraint(['case_report_id'], ['case_report.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_outcome_case_report_id'), 'outcome', ['case_report_id'])
    op.create_index(op.f('ix_outcome_id'), 'outcome', ['id'])
    op.create_index(op.f('ix_outcome_outcome_code'), 'outcome', ['outcome_code'])

    # Create indication table
    op.create_table(
        'indication',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_report_id', sa.Integer(), nullable=False),
        sa.Column('drug_sequence', sa.String(length=10), nullable=True),
        sa.Column('indication_text', sa.Text(), nullable=True),
        sa.Column('indication_meddra_pt', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['case_report_id'], ['case_report.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_indication_case_report_id'), 'indication', ['case_report_id'])
    op.create_index(op.f('ix_indication_id'), 'indication', ['id'])

    # Create drug_reaction_agg table
    op.create_table(
        'drug_reaction_agg',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_name_normalized', sa.String(length=500), nullable=False),
        sa.Column('meddra_pt', sa.String(length=200), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('quarter', sa.Integer(), nullable=True),
        sa.Column('case_count', sa.Integer(), nullable=True),
        sa.Column('serious_case_count', sa.Integer(), nullable=True),
        sa.Column('death_count', sa.Integer(), nullable=True),
        sa.Column('hospitalization_count', sa.Integer(), nullable=True),
        sa.Column('total_reaction_reports', sa.Integer(), nullable=True),
        sa.Column('total_drug_reports', sa.Integer(), nullable=True),
        sa.Column('total_all_reports', sa.Integer(), nullable=True),
        sa.Column('prr', sa.Float(), nullable=True),
        sa.Column('prr_lower_ci', sa.Float(), nullable=True),
        sa.Column('prr_upper_ci', sa.Float(), nullable=True),
        sa.Column('ror', sa.Float(), nullable=True),
        sa.Column('ror_lower_ci', sa.Float(), nullable=True),
        sa.Column('ror_upper_ci', sa.Float(), nullable=True),
        sa.Column('signal_flag', sa.Boolean(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_agg_drug_reaction', 'drug_reaction_agg', ['product_name_normalized', 'meddra_pt'])
    op.create_index('idx_agg_drug_year', 'drug_reaction_agg', ['product_name_normalized', 'year', 'quarter'])
    op.create_index('idx_agg_signal', 'drug_reaction_agg', ['signal_flag', 'prr'])
    op.create_index('idx_agg_year_quarter', 'drug_reaction_agg', ['year', 'quarter'])
    op.create_index(op.f('ix_drug_reaction_agg_id'), 'drug_reaction_agg', ['id'])
    op.create_index(op.f('ix_drug_reaction_agg_meddra_pt'), 'drug_reaction_agg', ['meddra_pt'])
    op.create_index(op.f('ix_drug_reaction_agg_product_name_normalized'), 'drug_reaction_agg', ['product_name_normalized'])
    op.create_index(op.f('ix_drug_reaction_agg_signal_flag'), 'drug_reaction_agg', ['signal_flag'])
    op.create_index(op.f('ix_drug_reaction_agg_year'), 'drug_reaction_agg', ['year'])


def downgrade() -> None:
    op.drop_table('drug_reaction_agg')
    op.drop_table('indication')
    op.drop_table('outcome')
    op.drop_table('reaction')
    op.drop_table('drug_product')
    op.drop_table('case_report')
