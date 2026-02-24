import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/landing/Hero';
import SignatureRanking from '@/components/curation/SignatureRanking';
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

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRank, setSelectedRank] = useState<1 | 2 | 3 | null>(null);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (router.query.start_wizard) {
      // Auth gate: require login before opening wizard
      if (user) {
        setIsWizardOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }
  }, [router.query, user]);

  const handleSelectSolution = (rank: 1 | 2 | 3) => {
    setSelectedRank(rank);
    setIsModalOpen(true);
  };

  const handleDiagnosisComplete = (data: WizardData) => {
    setWizardData(data);
    setIsModalOpen(true);
  };

  // ── Auth-gated wizard start ────────────────────────────────────────────────
  const handleStartAnalysis = () => {
    if (user) {
      // Already logged in → open wizard directly
      setIsWizardOpen(true);
    } else {
      // Not logged in → show auth modal, then open wizard after login
      setIsAuthModalOpen(true);
    }
  };

  // When user logs in via AuthModal while trying to start analysis
  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
      setIsWizardOpen(true);
    }
  }, [user]);

  return (
    <div className="bg-[#050505] min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 selection:text-white scroll-smooth relative">
      <Head>
        <title>Connecting Docs | The Global Medical Intelligence Platform</title>
        <meta name="description" content="Stop Guessing. Start Designing. We translate your skin concerns into data-driven protocols." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header currentLang={currentLang} onLangChange={setCurrentLang} />

      <main>
        <Hero language={currentLang} onDiagnosisComplete={handleDiagnosisComplete} onStartAnalysis={handleStartAnalysis} />
        <SignatureRanking language={currentLang} onSelectSolution={handleSelectSolution} />

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
          rank={selectedRank}
          language={currentLang}
          tallyData={wizardData}
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
