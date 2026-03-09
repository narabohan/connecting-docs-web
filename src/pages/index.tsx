import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PremiumHero from '@/components/premium/PremiumHero';
import IntelligenceEngine from '@/components/premium/IntelligenceEngine';
import SignatureGallery from '@/components/premium/SignatureGallery';
import SkinBoosterRecommendations from '@/components/curation/SkinBoosterRecommendations';
import DeepDiveModal from '@/components/curation/DeepDiveModal';
import ForPatients from '@/components/landing/ForPatients';
import ForDoctors from '@/components/landing/ForDoctors';
import PricingTable from '@/components/landing/PricingTable';
import Footer from '@/components/Footer';
import AiRoadmap from '@/components/landing/AiRoadmap';
import AuthModal from '@/components/auth/AuthModal';
import { LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import { WizardData } from '@/components/landing/DiagnosisWizard';
import DiagnosisWizard from '@/components/landing/DiagnosisWizard';
import { useRouter } from 'next/router';
import { AnalysisResponseV2 } from '@/types/airtable';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRank, setSelectedRank] = useState<1 | 2 | 3 | null>(null);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResponseV2 | null>(null);

  useEffect(() => {
    if (router.query.start_wizard || router.query.auth === 'required') {
      if (user) {
        router.push('/survey-v2');
      } else {
        setIsAuthModalOpen(true);
      }
    }
  }, [router.query, user]);

  const handleSelectSolution = (rank: 1 | 2 | 3) => {
    setSelectedRank(rank);
    setIsModalOpen(true);
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleDiagnosisComplete = async (data: WizardData) => {
    setWizardData(data);
    setAnalyzeError(null);
    setIsAnalyzing(true);
    setIsModalOpen(true); // Open modal immediately — shows skeleton/loading state

    try {
      const res = await fetch('/api/engine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryGoal: data.primaryGoal,
          secondaryGoal: data.secondaryGoal,
          risks: data.risks,
          painTolerance: data.painTolerance,
          downtimeTolerance: data.downtimeTolerance,
          budget: data.budget,
          skinType: data.skinType,
          areas: data.areas,
          volumePreference: data.volumePreference,
          language: currentLang,
          userId: data.email || undefined,
          userEmail: data.email,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const result = await res.json();
      setAnalysisData(result); // AnalysisResponseV2 with runId
    } catch (err: any) {
      console.error('[analyze] error:', err);
      setAnalyzeError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = () => {
    // Route to Survey V2 hybrid pipeline (auth-gated)
    if (user) {
      router.push('/survey-v2');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
      router.push('/survey-v2');
    }
  }, [user]);

  return (
    <div className="bg-[#050505] min-h-screen text-slate-50 font-sans selection:bg-cyan-500/30 selection:text-white scroll-smooth relative">
      <Head>
        <title>ConnectingDocs | Find Your Perfect Skin Treatment in 3 Minutes</title>
        <meta name="description" content="Find Your Perfect Skin Treatment in 3 Minutes — Free AI Analysis. Stop Guessing. Start Designing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header currentLang={currentLang} onLangChange={setCurrentLang} />

      <main>
        {/* 1. Premium Hero Section */}
        <PremiumHero
          language={currentLang}
          onStartAnalysis={handleStartAnalysis}
        />

        {/* 2. Signature Gallery (Moved Up) */}
        <SignatureGallery
          language={currentLang}
          onStartAnalysis={handleStartAnalysis}
          onViewDeepDive={handleSelectSolution}
        />

        {/* 3. Clinical Intelligence Engine (Visualization) */}
        <IntelligenceEngine language={currentLang} />

        {/* 4. Combination Skin Boosters */}
        <SkinBoosterRecommendations language={currentLang} />

        {/* Diagnosis Wizard (Auth-gated) */}
        <DiagnosisWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={(data) => {
            handleDiagnosisComplete(data);
            setIsWizardOpen(false);
          }}
          language={currentLang}
        />

        {/* Deep Dive Modal */}
        <DeepDiveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          runId={analysisData?.runId ?? null}
          analysisData={analysisData ?? undefined}
          language={currentLang}
        />

        <ForPatients language={currentLang} onStartSurvey={handleStartAnalysis} />
        <ForDoctors language={currentLang} />
        <AiRoadmap language={currentLang} />
        <div id="pricing">
          <PricingTable language={currentLang} />
        </div>
      </main>

      <Footer language={currentLang} />

      {/* Global Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
