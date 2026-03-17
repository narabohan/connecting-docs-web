// ═══════════════════════════════════════════════════════════════
//  Firebase Admin SDK — Phase 1 (C-2)
//  Server-side token verification for API role guards
//
//  Required env vars:
//    FIREBASE_PROJECT_ID          (same as NEXT_PUBLIC_FIREBASE_PROJECT_ID)
//    FIREBASE_CLIENT_EMAIL        (from service account JSON)
//    FIREBASE_PRIVATE_KEY         (from service account JSON, with \n escaped)
//
//  Fallback: If admin SDK is not configured, API guards
//  will use Airtable-based role lookup instead.
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import type { FirebaseTokenClaims } from '@/types/auth';

// ─── Singleton Init ──────────────────────────────────────────

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebaseAdmin] Missing env vars — admin SDK not available, will use Airtable fallback');
    return null;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return adminApp;
}

function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;

  const app = getAdminApp();
  if (!app) return null;

  adminAuth = getAuth(app);
  return adminAuth;
}

// ─── Token Verification ──────────────────────────────────────

/**
 * Verify a Firebase ID token and extract claims.
 * Returns null if verification fails or admin SDK is not configured.
 */
export async function verifyIdToken(idToken: string): Promise<FirebaseTokenClaims | null> {
  const auth = getAdminAuth();
  if (!auth) return null;

  try {
    const decoded = await auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role as FirebaseTokenClaims['role'],
    };
  } catch (err) {
    console.error('[firebaseAdmin] Token verification failed:', err);
    return null;
  }
}

// ─── Custom Token Creation (C-5: Kakao OAuth) ───────────────

/**
 * Create a Firebase Custom Token for social providers not natively
 * supported by Firebase (e.g., Kakao, Naver, Line).
 *
 * @param uid - Unique ID for the user (e.g., `kakao_123456`)
 * @param claims - Custom claims to embed (e.g., { role: 'patient' })
 * @returns The custom token string, or null if admin SDK unavailable
 */
export async function createCustomToken(
  uid: string,
  claims?: Record<string, string>
): Promise<string | null> {
  const auth = getAdminAuth();
  if (!auth) {
    console.error('[firebaseAdmin] Cannot create custom token — admin SDK not configured');
    return null;
  }

  try {
    const token = await auth.createCustomToken(uid, claims);
    return token;
  } catch (err) {
    console.error('[firebaseAdmin] createCustomToken failed:', err);
    return null;
  }
}

/**
 * Check if Firebase Admin SDK is configured and available.
 */
export function isAdminConfigured(): boolean {
  return getAdminApp() !== null;
}
