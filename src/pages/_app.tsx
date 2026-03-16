import "@/styles/globals.css";
import "@/components/report-v7/report-v7.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
