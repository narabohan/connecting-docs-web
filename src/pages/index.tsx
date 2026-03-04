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
import { WizardData } from '@/components/landing/DiagnosisWizard';
import DiagnosisWizard from '@/components/landing/DiagnosisWizard';
import { useRouter } from 'next/router';
import { Loader2, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ── 분석 로딩 상태 ───────────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');

  useEffect(() => {
    if (router.query.start_wizard) {
      setIsWizardOpen(true);
    }
  }, [router.query]);

  const handleStartAnalysis = () => {
    setIsWizardOpen(true);
  };

  // ── 설문 완료 → analyze.ts 호출 → /report/[runId] 이동 ──────────────────────
  const handleDiagnosisComplete = async (data: WizardData) => {
    setIsWizardOpen(false);
    setIsAnalyzing(true);

    const statusMessages: Record<LanguageCode, string[]> = {
      KO: ['피부 프로파일 분석 중...', '임상 프로토콜 매칭 중...', '최적 시술 조합 계산 중...', '리포트 생성 중...'],
      EN: ['Analyzing skin profile...', 'Matching clinical protocols...', 'Calculating optimal combinations...', 'Generating your report...'],
      JP: ['肌プロファイル分析中...', '臨床プロトコルマッチング中...', '最適な組み合わせを計算中...', 'レポート生成中...'],
      CN: ['分析皮肤档案...', '匹配临床方案...', '计算最优组合...', '生成报告中...'],
    };
    const msgs = statusMessages[currentLang] || statusMessages['EN'];

    let msgIdx = 0;
    setAnalyzeStatus(msgs[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setAnalyzeStatus(msgs[msgIdx]);
    }, 1400);

    try {
      const res = await fetch('/api/engine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user?.uid || null,
          userEmail: user?.email || data.email || null,
          language: currentLang,
        }),
      });

      clearInterval(msgInterval);

      if (!res.ok) throw new Error('Analysis failed');
      const result = await res.json();

      const runId = result.reportId || result.runId;
      if (!runId || runId.startsWith('mock_run_')) {
        // Airtable 저장 안 된 경우 — 게스트 데모 페이지로
        router.push(`/report/demo?lang=${currentLang}`);
      } else {
        router.push(`/report/${runId}?lang=${currentLang}`);
      }
    } catch (err) {
      console.error('[Analyze] Error:', err);
      clearInterval(msgInterval);
      // 오류 시 데모 리포트로 fallback
      router.push(`/report/demo?lang=${currentLang}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle global event to open AuthModal
  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
      if (!isWizardOpen) setIsWizardOpen(true);
    }
  }, [user]);

  return (
    <div className="bg-[#050505] min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 selection:text-white scroll-smooth relative">
      <Head>
        <title>Connecting Docs | The Global Medical Intelligence Platform</title>
        <meta name="description" content="Stop Guessing. Start Designing. We translate your skin concerns into data-driven protocols." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Connecting Docs | The Global Medical Intelligence Platform" />
        <meta property="og:description" content="Stop Guessing. Start Designing. We translate your skin concerns into data-driven protocols in 4 languages." />
        <meta property="og:url" content="https://connectingdocs.ai" />
        <meta property="og:image" content="https://connectingdocs.ai/og-image.png" />
        <meta property="og:site_name" content="Connecting Docs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Connecting Docs | AI Skin Treatment Analysis" />
        <meta name="twitter:description" content="Stop Guessing. Start Designing. Data-driven skin treatment protocols powered by AI." />
        <meta name="twitter:image" content="https://connectingdocs.ai/og-image.png" />
        <link rel="canonical" href="https://connectingdocs.ai" />
      </Head>

      <Header currentLang={currentLang} onLangChange={setCurrentLang} />

      <main>
        <Hero language={currentLang} onDiagnosisComplete={handleDiagnosisComplete} onStartAnalysis={handleStartAnalysis} />

        {/* SignatureRanking — 마케팅용 정적 쇼케이스 (실제 추천 아님) */}
        <SignatureRanking language={currentLang} onSelectSolution={() => setIsWizardOpen(true)} />

        <HowItWorks language={currentLang} />

        <DiagnosisWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={handleDiagnosisComplete}
          language={currentLang}
        />

        <ForPatients language={currentLang} onStartSurvey={handleStartAnalysis} />
        <SocialProof language={currentLang} />
        <ForDoctors language={currentLang} />
        {user && <AiRoadmap language={currentLang} />}
        <FAQ language={currentLang} />
        <div id="pricing">
          <PricingTable language={currentLang} />
        </div>
      </main>

      <Footer language={currentLang} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* ── AI 분석 로딩 오버레이 ───────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
          {/* 중앙 애니메이션 */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 animate-ping absolute inset-0" />
            <div className="w-24 h-24 rounded-full border border-cyan-400/50 flex items-center justify-center relative">
              <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* 상태 메시지 */}
          <div className="text-center space-y-3">
            <div className="text-xs font-bold tracking-[0.4em] text-cyan-400 uppercase">
              {currentLang === 'KO' ? 'AI 임상 분석' : currentLang === 'JP' ? 'AI 臨床分析' : currentLang === 'CN' ? 'AI 临床分析' : 'AI Clinical Analysis'}
            </div>
            <div className="text-white text-lg font-medium min-w-[280px] text-center transition-all duration-500">
              {analyzeStatus}
            </div>
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>

          <div className="text-xs text-white/20 tracking-widest">
            connectingdocs.ai
          </div>
        </div>
      )}
    </div>
  );
}
