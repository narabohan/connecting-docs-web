// Force Rebuild v2
import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/landing/Hero';
import SignatureRanking from '@/components/curation/SignatureRanking';
import DeepDiveModal from '@/components/curation/DeepDiveModal';
import ForPatients from '@/components/landing/ForPatients';
import ForDoctors from '@/components/landing/ForDoctors';
import PricingTable from '@/components/landing/PricingTable';
import Footer from '@/components/Footer';
import { LanguageCode } from '@/utils/translations';

export default function Home() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRank, setSelectedRank] = useState<1 | 2 | 3 | null>(null);

  const handleSelectSolution = (rank: 1 | 2 | 3) => {
    setSelectedRank(rank);
    setIsModalOpen(true);
  };

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
        <Hero language={currentLang} />
        <SignatureRanking language={currentLang} onSelectSolution={handleSelectSolution} />

        {/* Deep Dive Modal */}
        <DeepDiveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          rank={selectedRank}
          language={currentLang}
        />

        <ForPatients language={currentLang} />
        <ForDoctors language={currentLang} />
        <div id="pricing">
          <PricingTable language={currentLang} />
        </div>
      </main>

      <Footer language={currentLang} />
    </div>
  )
}
