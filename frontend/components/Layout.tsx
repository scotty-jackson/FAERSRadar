/**
 * Main layout component with navigation and footer
 */
import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      {/* Ad slot - Top banner */}
      <div className="container mx-auto px-4 mt-4">
        <div id="ad-slot-top" className="ad-slot">
          {/* Google AdSense code would go here */}
          <span>Advertisement Space</span>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
