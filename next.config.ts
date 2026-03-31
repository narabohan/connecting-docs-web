import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ── Disable Next.js image optimization to prevent React 19 hydration mismatch.
  // Next.js 16 outputs `srcSet` (camelCase) in SSR HTML, but browsers normalize
  // HTML attributes to lowercase `srcset`. React 19 detects this diff and refuses
  // to hydrate (Error #418), breaking ALL client-side interactivity site-wide.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
