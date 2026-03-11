import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/landing/Hero';
import SignatureRanking from '@/components/curation/SignatureRanking';
import HowItWorks from '@/components/HowItWorks';
import ForPatients from '@/components/landing/ForPatients';
import SocialProof from '@/components/landing/SocialProof';
import ForDoctors from '@/components/landing/ForDoctors';
import AiRoadmap from '@/components/landing/AiRoadmap';
import FAQ from '@/components/landing/FAQ';
import PricingTable from '@/components/landing/PricingTable';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigate to new survey-v2
  const handleStartAnalysis = () => {
    router.push('/survey-v2');
  };

  // Handle global event to open AuthModal
  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 selection:text-white scroll-smooth relative">
      <Head>
        <title>Connecting Docs | The Global Medical Intelligence Platform</title>
        <meta name="description" content="Stop Guessing. Start Designing. We translate your skin concerns into data-driven protocols." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Connecting Docs | The Global Medical Intelligence Platform" />
        <meta property="og:description" content="Stop Guessing. Start Designing. We translate your skin concerns into data-driven protocols in 4 languages." />
        <meta property="og:url" content="https://connectingdocs.ai" />
        <meta property="og:image" content="https://connectingdocs.ai/og-image.png" />
        <meta property="og:site_name" content="Connecting Docs" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Connecting Docs | AI Skin Treatment Analysis" />
        <meta name="twitter:description" content="Stop Guessing. Start Designing. Data-driven skin treatment protocols powered by AI." />
        <meta name="twitter:image" content="https://connectingdocs.ai/og-image.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://connectingdocs.ai" />
      </Head>

      <Header currentLang={currentLang} onLangChange={setCurrentLang} />

      <main>
        <Hero language={currentLang} onStartAnalysis={handleStartAnalysis} />
        <SignatureRanking language={currentLang} onSelectSolution={() => handleStartAnalysis()} />

        {/* How It Works — overview of the 3-step analysis process */}
        <HowItWorks language={currentLang} />

        <ForPatients language={currentLang} onStartSurvey={handleStartAnalysis} />

        {/* Social Proof — stats & testimonials */}
        <SocialProof language={currentLang} />

        <ForDoctors language={currentLang} />

        {/* AI Architecture — visible to logged-in users only (internal details) */}
        {user && <AiRoadmap language={currentLang} />}

        {/* FAQ — common questions before purchase */}
        <FAQ language={currentLang} />

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
