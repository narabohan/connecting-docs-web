import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { LanguageCode } from '@/utils/translations';

export default function PrivacyPolicy() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');

  return (
    <div className="bg-[#050505] min-h-screen text-slate-50 font-sans">
      <Head>
        <title>Privacy Policy | Connecting Docs</title>
        <meta name="description" content="Connecting Docs Privacy Policy — how we collect, use, and protect your personal data." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://connectingdocs.ai/privacy" />
      </Head>

      <Header currentLang={currentLang} onLangChange={setCurrentLang} />

      <main className="max-w-3xl mx-auto px-6 py-28">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-10">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-300">Privacy Policy</span>
        </div>

        <div className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: February 2026</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-10">

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p className="text-slate-400 leading-relaxed">
              Connecting Docs (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website connectingdocs.ai and provides AI-assisted skin treatment analysis services. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform.
            </p>
            <p className="text-slate-400 leading-relaxed mt-3">
              By using our service, you agree to the collection and use of information in accordance with this policy. If you disagree, please discontinue use of the platform.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <div>
                <h3 className="text-white font-medium mb-1">Account Information</h3>
                <p>When you create an account, we collect your email address and, optionally, your name. We do not collect payment information directly — payment is handled by third-party processors.</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Survey & Analysis Data</h3>
                <p>When you complete the skin analysis wizard, we collect your responses to questions about your skin concerns, pain tolerance, preferences, and related health context. This data is used solely to generate your personalized report.</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Usage Data</h3>
                <p>We automatically collect certain information when you visit our site, including IP address, browser type, pages visited, and time spent. This data is used for analytics and service improvement only.</p>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 text-slate-400">
              {[
                'To generate and deliver your personalized skin treatment analysis report',
                'To maintain and improve the accuracy of our AI recommendation engine',
                'To send you service updates and, with your consent, relevant health content',
                'To detect and prevent fraudulent or unauthorized use',
                'To comply with applicable legal obligations',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing & Third Parties</h2>
            <p className="text-slate-400 leading-relaxed">
              We do <strong className="text-white">not</strong> sell, trade, or rent your personal information to any third party. We may share data with trusted service providers who assist in operating our platform (e.g., authentication, hosting, analytics) under strict confidentiality agreements.
            </p>
            <p className="text-slate-400 leading-relaxed mt-3">
              AI analysis is performed using Anthropic&apos;s Claude API. Survey data transmitted to Claude is processed per Anthropic&apos;s data handling policies and is not stored by Anthropic for training purposes under our enterprise agreement.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention & Deletion</h2>
            <p className="text-slate-400 leading-relaxed">
              Your account and report data are retained for as long as your account is active. You may request deletion of your account and all associated data at any time by emailing{' '}
              <a href="mailto:hello@connectingdocs.ai" className="text-cyan-400 hover:underline">hello@connectingdocs.ai</a>.
              We will process deletion requests within 30 days.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p className="text-slate-400 leading-relaxed">
              We use essential cookies for authentication and session management. We may use analytics cookies (e.g., Google Analytics) to understand how users interact with the platform. You can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="text-slate-400 leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
            <ul className="space-y-2 text-slate-400">
              {[
                'Access the personal data we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your data',
                'Withdraw consent for data processing at any time',
                'Lodge a complaint with a supervisory authority (EU/EEA users)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p className="text-slate-400 leading-relaxed">
              We implement industry-standard security measures including HTTPS encryption, secure authentication, and access controls. However, no method of internet transmission is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p className="text-slate-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify registered users via email when material changes are made. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-cyan-500/10 bg-cyan-500/5">
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p className="text-slate-400 leading-relaxed">
              For any privacy-related questions or requests, please contact us at:
            </p>
            <div className="mt-3 space-y-1 text-slate-300">
              <p><strong className="text-white">Connecting Docs</strong></p>
              <p>Email: <a href="mailto:hello@connectingdocs.ai" className="text-cyan-400 hover:underline">hello@connectingdocs.ai</a></p>
              <p>Website: <a href="https://connectingdocs.ai" className="text-cyan-400 hover:underline">connectingdocs.ai</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer language={currentLang} />
    </div>
  );
}
