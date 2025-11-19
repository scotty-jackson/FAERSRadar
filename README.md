# FAERS Side-Effect Radar

A production-quality web application for exploring drug safety signals from the FDA Adverse Event Reporting System (FAERS). Built with Python/FastAPI backend and Next.js/React frontend.

## Features

- **Drug Search**: Typeahead search across all drugs in FAERS database
- **Drug Dashboards**: Per-drug side-effect profiles with time-series trends
- **Reaction Analysis**: Detailed drug-reaction pair analysis with time trends
- **Signal Detection**: PRR/ROR-based disproportionality metrics with signal flags
- **Drug Comparison**: Compare adverse event patterns across multiple drugs
- **Global Views**: Top reactions overall and outcome distributions
- **SEO-Optimized**: Server-side rendering for drug and reaction pages
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Architecture

### Backend (Python)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy with Alembic migrations
- **Database**: PostgreSQL
- **ETL**: Python modules for parsing FAERS bulk CSV files and computing aggregations

### Frontend (Next.js)
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **API Client**: Axios

### Data Sources
- FDA FAERS quarterly bulk ASCII/CSV files
- Optional: openFDA FAERS API (future enhancement)

## Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 18.x or higher
- **PostgreSQL**: 13 or higher
- **Git**: For version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FAERSRadar
```

### 2. Set Up PostgreSQL Database

Create a PostgreSQL database and user:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE faers_db;
CREATE USER faers_user WITH PASSWORD 'faers_password';
GRANT ALL PRIVILEGES ON DATABASE faers_db TO faers_user;
\q
```

### 3. Configure Environment Variables

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual database credentials:

```ini
# Database Configuration
DATABASE_URL=postgresql://faers_user:faers_password@localhost:5432/faers_db

# FAERS Data Configuration
FAERS_DATA_ROOT=./data/faers/raw

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Set Up Backend

Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Copy and configure Alembic:

```bash
cp alembic.ini.example alembic.ini
# Edit alembic.ini and update sqlalchemy.url with your DATABASE_URL
```

Run database migrations:

```bash
# From backend directory
alembic upgrade head
```

### 5. Set Up Frontend

Install Node.js dependencies:

```bash
cd ../frontend
npm install
```

## Data Ingestion

### Downloading FAERS Data

1. Go to the FDA FAERS website:
   https://fis.fda.gov/extensions/FPD-QDE-FAERS/FPD-QDE-FAERS.html

2. Download quarterly data files (e.g., 23Q1, 23Q2, 23Q3, 23Q4, 24Q1, etc.)

3. Extract each quarter into `data/faers/raw/`:
   ```
   data/faers/raw/
   ├── 23Q1/
   │   ├── DEMO23Q1.txt
   │   ├── DRUG23Q1.txt
   │   ├── REAC23Q1.txt
   │   ├── OUTC23Q1.txt
   │   └── INDI23Q1.txt
   ├── 23Q2/
   │   └── ...
   └── 24Q1/
       └── ...
   ```

### Loading FAERS Data into Database

From the project root directory:

```bash
# Load all quarters in data/faers/raw/
python -m backend.etl.load_faers_bulk --data-root ./data/faers/raw

# Or load a specific quarter
python -m backend.etl.load_faers_bulk --data-root ./data/faers/raw --quarter 23Q1

# Initialize DB schema first if needed
python -m backend.etl.load_faers_bulk --init-db --data-root ./data/faers/raw
```

This will:
- Parse DEMO, DRUG, REAC, OUTC, and INDI files
- Normalize product names
- Load data into PostgreSQL
- Display progress and statistics

**Note**: Loading multiple quarters can take significant time (several hours for 10+ years of data).

### Building Aggregations

After loading raw data, build aggregated statistics:

```bash
# Build quarterly aggregations for a year range
python -m backend.etl.build_drug_reaction_agg --from-year 2013 --to-year 2024

# Or build yearly aggregations (faster but less granular)
python -m backend.etl.build_drug_reaction_agg --from-year 2013 --to-year 2024 --yearly
```

This will:
- Group data by drug, reaction, and time period
- Calculate PRR and ROR metrics
- Compute signal flags
- Create `drug_reaction_agg` table for fast queries

## Running the Application

### Development Mode

**Start Backend** (from project root):

```bash
cd backend
python main.py
```

Backend will run on http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

**Start Frontend** (from project root, in a new terminal):

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

### Production Mode

**Backend**:

```bash
cd backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend**:

```bash
cd frontend
npm run build
npm start
```

## Project Structure

```
FAERSRadar/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── db.py                   # Database connection
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── requirements.txt        # Python dependencies
│   ├── alembic/                # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── api/                    # API endpoints
│   │   ├── drugs.py            # Drug search and overview
│   │   ├── compare.py          # Drug comparison
│   │   ├── reactions.py        # Global reactions
│   │   └── health.py           # Health check
│   └── etl/                    # ETL modules
│       ├── faers_bulk_parser.py
│       ├── load_faers_bulk.py
│       └── build_drug_reaction_agg.py
├── frontend/
│   ├── pages/                  # Next.js pages
│   │   ├── index.tsx           # Home page
│   │   ├── drug/[drug_name]/   # Drug dashboards
│   │   ├── compare/            # Comparison page
│   │   ├── reactions/          # Top reactions
│   │   └── about.tsx           # About page
│   ├── components/             # React components
│   │   ├── Layout.tsx
│   │   ├── NavBar.tsx
│   │   ├── Footer.tsx
│   │   ├── DrugSearchBar.tsx
│   │   ├── SummaryTiles.tsx
│   │   ├── TimeSeriesChart.tsx
│   │   ├── ReactionTable.tsx
│   │   └── Disclaimer.tsx
│   ├── lib/                    # Utilities
│   │   └── api.ts              # API client
│   ├── styles/                 # CSS
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
├── data/                       # Data directory
│   └── faers/
│       └── raw/                # Place FAERS quarterly data here
├── .env.example                # Example environment config
└── README.md                   # This file
```

## API Endpoints

### Drugs

- `GET /api/drugs/search?q={query}` - Search for drugs
- `GET /api/drug/{drug_name}/overview` - Get drug dashboard data
- `GET /api/drug/{drug_name}/reactions` - Get all reactions for drug
- `GET /api/drug/{drug_name}/reaction/{pt}/timeseries` - Get time series for drug-reaction pair

### Comparison

- `GET /api/compare/drugs?drug_names[]={name1}&drug_names[]={name2}` - Compare multiple drugs
- `GET /api/compare/reactions?drug_names[]={name1}&meddra_pt={reaction}` - Compare reaction across drugs

### Reactions

- `GET /api/reactions/top` - Get top reactions overall
- `GET /api/outcomes/summary` - Get outcome distribution

### Health

- `GET /api/health` - Health check endpoint

Full API documentation available at: http://localhost:8000/docs

## Database Schema

### Core Tables

- **case_report**: Main case information (demographics, dates, seriousness)
- **drug_product**: Drugs mentioned in reports (with normalized names)
- **reaction**: Adverse reactions (MedDRA Preferred Terms)
- **outcome**: Outcome codes (death, hospitalization, etc.)
- **indication**: Reported drug indications

### Aggregation Table

- **drug_reaction_agg**: Pre-computed statistics for drug-reaction pairs
  - Counts by time period (year, quarter)
  - PRR and ROR with confidence intervals
  - Signal flags

## Testing the Application

### Quick Test with Sample Data

1. Download and load 1-2 quarters of FAERS data
2. Run the ETL loader
3. Build aggregations for those quarters
4. Start backend and frontend
5. Search for a common drug (e.g., "ASPIRIN", "METFORMIN", "IBUPROFEN")
6. View drug dashboard and explore reactions

### Example Test Commands

```bash
# Load Q1 2024
python -m backend.etl.load_faers_bulk --quarter 24Q1

# Build aggregations for 2024
python -m backend.etl.build_drug_reaction_agg --from-year 2024 --to-year 2024

# Start backend
cd backend && python main.py

# Start frontend (new terminal)
cd frontend && npm run dev

# Visit http://localhost:3000
# Search for "ASPIRIN"
```

## Limitations and Disclaimers

**CRITICAL**: FAERS data has substantial limitations:

1. **No Causality**: Reports do not prove a drug caused an adverse event
2. **Underreporting**: Only a fraction of events are reported
3. **Duplicates**: Same event may be reported multiple times
4. **Confounding**: Patients take multiple drugs and have underlying conditions
5. **Reporting Bias**: Media attention and regulatory actions affect reporting
6. **No Denominator**: Cannot calculate true incidence without exposure data
7. **Data Quality**: Reports vary in completeness and accuracy

**This tool is for informational and research purposes only. It is NOT medical advice.**

## Future Enhancements

- [ ] OpenFDA API integration for incremental updates
- [ ] EMA EudraVigilance data integration
- [ ] Advanced signal detection algorithms (BCPNN, MGPS)
- [ ] Drug class/ATC code mapping
- [ ] MedDRA SOC (System Organ Class) hierarchy
- [ ] User accounts and saved queries
- [ ] Export functionality (CSV, PDF reports)
- [ ] Data visualization improvements (heatmaps, treemaps)
- [ ] Real-time data updates
- [ ] Full-text search with Elasticsearch
- [ ] Caching layer (Redis)
- [ ] Containerization (Docker)
- [ ] Automated testing suite

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is provided as-is for educational and research purposes. FAERS data is public domain (U.S. government data).

## Acknowledgments

- FDA for maintaining and publishing FAERS data
- MedDRA for standardized adverse event terminology
- Open-source community for the excellent tools and libraries used in this project

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Review existing documentation
- Check the About page for methodology details

## Disclaimer

**This application is not affiliated with, endorsed by, or officially connected to the U.S. Food and Drug Administration (FDA) or any government agency.**

**Always consult qualified healthcare professionals for medical advice, diagnosis, and treatment decisions.**

---

Built with ❤️ for pharmacovigilance research and drug safety transparency.
