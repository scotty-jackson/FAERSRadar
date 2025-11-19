/**
 * Footer component
 */
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FAERS Side-Effect Radar</h3>
            <p className="text-gray-400 text-sm">
              Exploring FDA Adverse Event Reporting System data to help understand
              drug safety signals.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-gray-400 hover:text-white transition-colors">
                  Compare Drugs
                </Link>
              </li>
              <li>
                <Link href="/reactions" className="text-gray-400 hover:text-white transition-colors">
                  Top Reactions
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About & Methodology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Important Notice</h3>
            <p className="text-gray-400 text-sm">
              This tool displays spontaneous adverse event reports. It does not
              establish causation or provide medical advice. Always consult
              healthcare professionals.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {currentYear} FAERS Side-Effect Radar. Data source: FDA FAERS.</p>
        </div>
      </div>
    </footer>
  );
}
