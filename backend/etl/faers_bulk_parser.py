"""Parser for FAERS bulk ASCII/CSV files."""
import pandas as pd
import os
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FAERSBulkParser:
    """Parser for FAERS quarterly bulk data files."""

    def __init__(self, quarter_path: str):
        """
        Initialize parser for a specific quarter.

        Args:
            quarter_path: Path to quarterly FAERS data directory (e.g., data/faers/raw/23Q1/)
        """
        self.quarter_path = quarter_path
        self.quarter_name = os.path.basename(quarter_path.rstrip('/'))

        # Parse year and quarter from directory name (e.g., 23Q1 -> 2023, 1)
        match = re.match(r'(\d{2})Q(\d)', self.quarter_name)
        if match:
            year_suffix = int(match.group(1))
            self.year = 2000 + year_suffix if year_suffix < 50 else 1900 + year_suffix
            self.quarter = int(match.group(2))
        else:
            logger.warning(f"Could not parse year/quarter from {self.quarter_name}")
            self.year = None
            self.quarter = None

    def _find_file(self, file_prefix: str) -> Optional[str]:
        """Find a file in the quarter directory by prefix (case-insensitive)."""
        if not os.path.exists(self.quarter_path):
            return None

        file_prefix_lower = file_prefix.lower()
        for filename in os.listdir(self.quarter_path):
            if filename.lower().startswith(file_prefix_lower) and (
                filename.endswith('.txt') or filename.endswith('.csv')
            ):
                return os.path.join(self.quarter_path, filename)
        return None

    def _read_file(self, file_path: str, encoding: str = 'utf-8') -> Optional[pd.DataFrame]:
        """Read a FAERS file with error handling."""
        if not file_path or not os.path.exists(file_path):
            return None

        try:
            # Try different encodings
            for enc in [encoding, 'latin-1', 'cp1252']:
                try:
                    # FAERS files are typically $ delimited
                    df = pd.read_csv(file_path, delimiter='$', encoding=enc, low_memory=False)
                    logger.info(f"Read {len(df)} rows from {os.path.basename(file_path)} with encoding {enc}")
                    return df
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"Error reading {file_path} with encoding {enc}: {e}")
                    continue
            return None
        except Exception as e:
            logger.error(f"Failed to read {file_path}: {e}")
            return None

    def normalize_product_name(self, name: str) -> str:
        """Normalize product name for consistency."""
        if pd.isna(name) or not name:
            return ""

        # Convert to uppercase and strip whitespace
        normalized = str(name).upper().strip()

        # Remove common suffixes (but keep the raw name too)
        # This is a simple normalization; more sophisticated rules can be added
        normalized = re.sub(r'\s+\d+\s*(MG|MCG|G|ML|%|UNIT|TAB|CAP).*$', '', normalized)

        return normalized

    def parse_demo(self) -> Optional[pd.DataFrame]:
        """Parse DEMO (demographics) file."""
        file_path = self._find_file('demo')
        if not file_path:
            logger.warning(f"DEMO file not found in {self.quarter_path}")
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        # Standardize column names (FAERS column names can vary)
        df.columns = [col.lower().strip() for col in df.columns]

        return df

    def parse_drug(self) -> Optional[pd.DataFrame]:
        """Parse DRUG file."""
        file_path = self._find_file('drug')
        if not file_path:
            logger.warning(f"DRUG file not found in {self.quarter_path}")
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        df.columns = [col.lower().strip() for col in df.columns]

        # Add normalized product name
        if 'drugname' in df.columns:
            df['product_name_normalized'] = df['drugname'].apply(self.normalize_product_name)

        return df

    def parse_reac(self) -> Optional[pd.DataFrame]:
        """Parse REAC (reactions) file."""
        file_path = self._find_file('reac')
        if not file_path:
            logger.warning(f"REAC file not found in {self.quarter_path}")
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        df.columns = [col.lower().strip() for col in df.columns]
        return df

    def parse_outc(self) -> Optional[pd.DataFrame]:
        """Parse OUTC (outcomes) file."""
        file_path = self._find_file('outc')
        if not file_path:
            logger.warning(f"OUTC file not found in {self.quarter_path}")
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        df.columns = [col.lower().strip() for col in df.columns]
        return df

    def parse_indi(self) -> Optional[pd.DataFrame]:
        """Parse INDI (indications) file."""
        file_path = self._find_file('indi')
        if not file_path:
            logger.warning(f"INDI file not found in {self.quarter_path}")
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        df.columns = [col.lower().strip() for col in df.columns]
        return df

    def parse_all(self) -> Dict[str, pd.DataFrame]:
        """Parse all available files for this quarter."""
        return {
            'demo': self.parse_demo(),
            'drug': self.parse_drug(),
            'reac': self.parse_reac(),
            'outc': self.parse_outc(),
            'indi': self.parse_indi(),
        }


def parse_faers_date(date_str: str, date_format: str = '%Y%m%d') -> Optional[datetime]:
    """Parse FAERS date string to datetime."""
    if pd.isna(date_str) or not date_str:
        return None

    try:
        # Try standard format first
        return datetime.strptime(str(date_str)[:8], date_format)
    except (ValueError, TypeError):
        # Try other common formats
        for fmt in ['%Y%m%d', '%Y-%m-%d', '%m/%d/%Y']:
            try:
                return datetime.strptime(str(date_str)[:10], fmt)
            except (ValueError, TypeError):
                continue
        return None
