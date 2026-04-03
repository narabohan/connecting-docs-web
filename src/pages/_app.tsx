import "@/styles/globals.css";
import "@/components/report-v7/report-v7.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { AppI18nProvider } from "@/i18n";

// ─── Client-only Toaster (avoids React 19 hydration mismatch) ──
const Toaster = dynamic(
  () => import("react-hot-toast").then((mod) => mod.Toaster),
  { ssr: false },
);

export default function App({ Component, pageProps }: AppProps) {
  // ── Process retry queue on app load (C-3: Await-Confirm)
  useEffect(() => {
    // Lazy-import to avoid loading queue modules during SSR
    Promise.all([
      import("@/services/retry-queue"),
      import("@/services/queue-processor"),
      import("react-hot-toast"),
    ]).then(([{ getQueueSize }, { processQueue }, { toast }]) => {
      const queueSize = getQueueSize();
      if (queueSize === 0) return;

      toast.loading(
        `저장되지 않은 결과가 ${queueSize}건 있습니다. 다시 저장 중...`,
        { id: 'queue-process', duration: 5000 },
      );

      processQueue()
        .then((result) => {
          if (result.succeeded > 0) {
            toast.success(
              `${result.succeeded} report(s) saved`,
              { id: 'queue-process' },
            );
          }
          if (result.permanentlyFailed > 0) {
            toast.error(
              `${result.permanentlyFailed} save(s) failed. Please contact support.`,
              { id: 'queue-failed', duration: 8000 },
            );
          }
        })
        .catch((err) => {
          console.error('[_app] Queue processing error:', err);
          toast.dismiss('queue-process');
        });
    });
  }, []);

  return (
    <AppI18nProvider>
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </AuthProvider>
    </AppI18nProvider>
  );
}
