// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Report v2 Page — Client-Only Rendering
//
//  Uses next/dynamic with ssr:false to bypass React 19 hydration.
//  SSR renders only a skeleton; the full report loads client-side.
//
//  Data flow: useReportData hook → ReportV7
//    Step 1: sessionStorage (sync)
//    Step 2: Airtable fallback via /api/report-v2/[id] (async)
//
//  getServerSideProps ensures router.query.id is available
//  on first render (required for Netlify dynamic routes).
// ═══════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { SkeletonReport } from '@/components/report-v7/SkeletonReport';

// ─── Client-only report component (no SSR, no hydration) ──────
const ReportV2Content = dynamic(() => import('@/components/report-v7/ReportV2Content'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      <SkeletonReport lang="EN" />
    </div>
  ),
});

// ─── Page Component ───────────────────────────────────────────
export default function ReportV2Page() {
  return (
    <>
      <Head>
        <title>ConnectingDocs Report</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ReportV2Content />
    </>
  );
}

// ─── SSR: Ensures router.query is available on first render ────
// Without this, Netlify pre-renders the page as static HTML and
// router.query stays empty (router.isReady = false forever).
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
