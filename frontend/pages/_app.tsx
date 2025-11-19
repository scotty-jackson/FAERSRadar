/**
 * Next.js App component
 */
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FAERS Side-Effect Radar</title>
        <meta
          name="description"
          content="Explore FDA adverse event reports for drugs - side effects, safety signals, and trends over time"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ErrorBoundary>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ErrorBoundary>
    </>
  );
}
