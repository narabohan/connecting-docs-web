import type { NextConfig } from "next";
import * as fs from "fs";
import * as path from "path";

// ─── Force-load .env.local values even when system env has empty vars ───
// Fixes: dotenv skips .env.local values when the same key exists in process.env
// (even if the system value is an empty string)
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      // Override if process.env has empty string or undefined
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // Silently ignore — env loading is best-effort
}

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
};

export default nextConfig;
