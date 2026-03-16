import "@/styles/globals.css";
import "@/components/report-v7/report-v7.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import { getQueueSize } from "@/services/retry-queue";
import { processQueue } from "@/services/queue-processor";

export default function App({ Component, pageProps }: AppProps) {
  // ── Process retry queue on app load (C-3: Await-Confirm)
  useEffect(() => {
    const queueSize = getQueueSize();
    if (queueSize === 0) return;

    toast.loading(
      `저장되지 않은 결과가 ${queueSize}건 있습니다. 다시 저장 중...`,
      { id: 'queue-process', duration: 5000 }
    );

    processQueue()
      .then((result) => {
        if (result.succeeded > 0) {
          toast.success(
            `${result.succeeded}건 저장 완료`,
            { id: 'queue-process' }
          );
        }
        if (result.permanentlyFailed > 0) {
          toast.error(
            `${result.permanentlyFailed}건 저장 실패. 고객센터에 문의해주세요.`,
            { id: 'queue-failed', duration: 8000 }
          );
        }
      })
      .catch((err) => {
        console.error('[_app] Queue processing error:', err);
        toast.dismiss('queue-process');
      });
  }, []);

  return (
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
  );
}
