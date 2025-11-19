/**
 * About and methodology page
 */
import React from 'react';
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About & Methodology - FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content="Learn about FAERS Side-Effect Radar methodology, data sources, and limitations"
        />
      </Head>

      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">About & Methodology</h1>
          <p className="text-gray-600 mt-2">
            Understanding how FAERS Side-Effect Radar works
          </p>
        </div>

        {/* Data Source */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Source</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              FAERS Side-Effect Radar analyzes data from the{' '}
              <strong>FDA Adverse Event Reporting System (FAERS)</strong>, a publicly
              available database of adverse event reports, medication errors, and product
              quality complaints submitted to the U.S. Food and Drug Administration (FDA).
            </p>
            <p>
              The data includes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Case Demographics:</strong> Patient age, sex, weight, country
              </li>
              <li>
                <strong>Drug Information:</strong> Product names, manufacturers, routes,
                dosages, and indications
              </li>
              <li>
                <strong>Adverse Reactions:</strong> Reported adverse events coded using
                MedDRA (Medical Dictionary for Regulatory Activities) terminology
              </li>
              <li>
                <strong>Outcomes:</strong> Seriousness indicators including death,
                hospitalization, life-threatening events, disability, and congenital anomalies
              </li>
            </ul>
            <p>
              FAERS data is updated quarterly by the FDA. This application uses the bulk
              ASCII/CSV files provided by the FDA for download.
            </p>
          </div>
        </section>

        {/* Database Schema */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Architecture</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              The application uses a PostgreSQL database with the following normalized schema:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>case_report:</strong> Core case information including demographics,
                dates, and seriousness indicators
              </li>
              <li>
                <strong>drug_product:</strong> Drugs mentioned in each report with normalized
                product names
              </li>
              <li>
                <strong>reaction:</strong> Adverse reactions linked to cases
              </li>
              <li>
                <strong>outcome:</strong> Outcome codes for each case
              </li>
              <li>
                <strong>indication:</strong> Reported reasons for drug use
              </li>
              <li>
                <strong>drug_reaction_agg:</strong> Pre-computed aggregations for
                drug-reaction pairs by time period, including disproportionality metrics
              </li>
            </ul>
            <p>
              Product names are normalized (uppercased, trimmed, common suffixes removed)
              to improve searchability while preserving original names for reference.
            </p>
          </div>
        </section>

        {/* Disproportionality Metrics */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Disproportionality Metrics
          </h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <h3 className="text-lg font-semibold">Proportional Reporting Ratio (PRR)</h3>
            <p>
              PRR compares the proportion of a specific adverse event reported for a drug
              to the proportion expected based on all drugs in the database:
            </p>
            <div className="bg-gray-50 p-4 rounded font-mono text-sm">
              PRR = (a / b) / ((c - a) / (n - b))
            </div>
            <p>Where:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>a = reports for drug-reaction pair</li>
              <li>b = total reports for the drug</li>
              <li>c = total reports for the reaction</li>
              <li>n = total reports in database</li>
            </ul>
            <p>
              A PRR ≥ 2 with at least 3 cases may indicate disproportionate reporting.
            </p>

            <h3 className="text-lg font-semibold mt-6">Reporting Odds Ratio (ROR)</h3>
            <p>
              ROR uses odds ratios instead of proportions:
            </p>
            <div className="bg-gray-50 p-4 rounded font-mono text-sm">
              ROR = (a × d) / (b × c)
            </div>
            <p>
              where a, b, c, d form a 2×2 contingency table. ROR and PRR often yield
              similar results but may differ for rare events.
            </p>

            <h3 className="text-lg font-semibold mt-6">Signal Detection Rules</h3>
            <p>
              A "signal flag" is displayed when all of the following criteria are met:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>PRR ≥ 2.0</li>
              <li>At least 3 cases reported</li>
              <li>Chi-square statistic ≥ 4.0</li>
            </ul>
            <p>
              These thresholds are commonly used in pharmacovigilance but should NOT be
              interpreted as proof of causation.
            </p>
          </div>
        </section>

        {/* Limitations */}
        <section className="bg-yellow-50 border-2 border-yellow-400 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Critical Limitations</h2>
          <div className="prose max-w-none text-gray-800 space-y-4">
            <p className="font-semibold text-lg">
              FAERS data has substantial limitations and must be interpreted with extreme
              caution:
            </p>
            <ol className="list-decimal list-inside ml-4 space-y-3">
              <li>
                <strong>No Causality:</strong> Reports do not establish that a drug caused
                an adverse event. Temporal association does not prove causation.
              </li>
              <li>
                <strong>Underreporting:</strong> Only a small fraction of adverse events
                are reported to FAERS. Reporting rates vary widely by event type, drug,
                and time period.
              </li>
              <li>
                <strong>Duplicate Reports:</strong> The same event may be reported multiple
                times by different sources.
              </li>
              <li>
                <strong>Confounding:</strong> Patients often take multiple drugs and have
                underlying conditions that can cause similar symptoms.
              </li>
              <li>
                <strong>Reporting Bias:</strong> Media attention, regulatory actions, and
                litigation increase reporting for specific drugs or events.
              </li>
              <li>
                <strong>No Denominator:</strong> FAERS does not contain information about
                total prescriptions or patient-exposure, making it impossible to calculate
                true incidence rates.
              </li>
              <li>
                <strong>Data Quality:</strong> Reports vary in completeness and accuracy.
                Product names may be misspelled or ambiguous.
              </li>
              <li>
                <strong>Not Medical Advice:</strong> This tool is for informational and
                research purposes only. It is NOT a substitute for professional medical
                advice, diagnosis, or treatment.
              </li>
            </ol>
          </div>
        </section>

        {/* How to Use */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How to Use This Tool Responsibly
          </h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              FAERS Side-Effect Radar is designed for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Researchers:</strong> Exploratory analysis and hypothesis generation
                for pharmacovigilance studies
              </li>
              <li>
                <strong>Healthcare Professionals:</strong> Supplementary information when
                evaluating drug safety profiles (not for clinical decision-making)
              </li>
              <li>
                <strong>Journalists:</strong> Background research on drug safety topics
                (with appropriate caveats about limitations)
              </li>
              <li>
                <strong>Informed Patients:</strong> Educational purposes to learn about
                reported experiences (not for self-diagnosis or treatment decisions)
              </li>
            </ul>
            <p className="font-semibold mt-6">
              Always Consult Qualified Healthcare Professionals
            </p>
            <p>
              If you have concerns about medication safety, side effects, or treatment
              options, consult your doctor, pharmacist, or other qualified healthcare
              provider. Do not start, stop, or change medications based on this tool.
            </p>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Stack</h2>
          <div className="prose max-w-none text-gray-700">
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Backend:</strong> Python, FastAPI, SQLAlchemy, PostgreSQL
              </li>
              <li>
                <strong>Frontend:</strong> Next.js, React, TypeScript, Tailwind CSS, Recharts
              </li>
              <li>
                <strong>Data:</strong> FDA FAERS quarterly bulk ASCII/CSV files
              </li>
              <li>
                <strong>Deployment:</strong> Designed for VPS or cloud hosting
              </li>
            </ul>
            <p className="mt-4">
              This project is open-source and available for review and contributions.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
