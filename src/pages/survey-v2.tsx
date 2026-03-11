// ═══════════════════════════════════════════════════════════════
//  /survey-v2 — Standalone Survey v2 Page
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §11-1
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import SurveyV2Container from '@/components/survey-v2/SurveyV2Container';

export default function SurveyV2Page() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback((runId: string) => {
    setIsComplete(true);
    // Navigate to v2 report page with runId
    router.push(`/report-v2/${runId}`);
  }, [router]);

  return (
    <>
      <Head>
        <title>ConnectingDocs — AI Skin Consultation</title>
        <meta name="description" content="AI-powered personalized skin treatment consultation" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <SurveyV2Container onComplete={handleComplete} />
    </>
  );
}
