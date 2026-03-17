// ═══════════════════════════════════════════════════════════════
//  Environment Variable Validator — Phase 1 (C-5)
//  서버 시작 시 필수 환경변수 존재 확인
//  참조: MASTER_PLAN_V4.md §7 (Kakao OAuth 환경변수)
//
//  사용법:
//    import { validateEnv } from '@/lib/env-validator';
//    validateEnv(); // throws if missing
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────

interface EnvGroup {
  name: string;
  required: boolean;
  vars: string[];
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

// ─── Env Groups ──────────────────────────────────────────────

const ENV_GROUPS: EnvGroup[] = [
  {
    name: 'Airtable',
    required: true,
    vars: ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'],
  },
  {
    name: 'Firebase Client',
    required: true,
    vars: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ],
  },
  {
    name: 'Firebase Admin',
    required: false, // Falls back to Airtable-based auth
    vars: [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
    ],
  },
  {
    name: 'Kakao OAuth',
    required: false, // Feature flag — Kakao login disabled if not set
    vars: [
      'KAKAO_REST_API_KEY',
      'KAKAO_REDIRECT_URI',
    ],
  },
  {
    name: 'Naver OAuth',
    required: false, // Feature flag — Naver login disabled if not set
    vars: [
      'NAVER_CLIENT_ID',
      'NAVER_CLIENT_SECRET',
      'NAVER_REDIRECT_URI',
    ],
  },
];

// ─── Validator ───────────────────────────────────────────────

/**
 * Validate all required environment variables.
 * Returns a result object instead of throwing.
 */
export function checkEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const group of ENV_GROUPS) {
    const missingVars = group.vars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      if (group.required) {
        missing.push(...missingVars);
      } else {
        warnings.push(
          `[env-validator] Optional group "${group.name}" incomplete: ${missingVars.join(', ')}. Feature will be disabled.`
        );
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate environment variables and log results.
 * Throws only if required vars are missing.
 */
export function validateEnv(): void {
  const result = checkEnv();

  // Log warnings for optional groups
  for (const warning of result.warnings) {
    console.warn(warning);
  }

  if (!result.valid) {
    const msg = `[env-validator] Missing required environment variables: ${result.missing.join(', ')}`;
    console.error(msg);
    throw new Error(msg);
  }
}

/**
 * Check if a specific feature's env vars are configured.
 */
export function isFeatureConfigured(featureName: string): boolean {
  const group = ENV_GROUPS.find((g) => g.name === featureName);
  if (!group) return false;
  return group.vars.every((v) => !!process.env[v]);
}
