// ═══════════════════════════════════════════════════════════════
//  Local Report Store — Phase 1 (C-4)
//  localStorage 기반 리포트 ID 관리 (Layer 1 of 3-Layer 안전망)
//  참조: MASTER_PLAN_V4.md §16.2
//
//  역할: 비인증 유저가 브라우저를 닫아도 리포트에 다시 접근할 수 있도록
//  최근 리포트 ID를 localStorage에 보관 (최대 10개, FIFO)
// ═══════════════════════════════════════════════════════════════

// ─── Constants ───────────────────────────────────────────────

const STORAGE_KEY = 'cdocs_report_ids';
const MAX_STORED = 10;

// ─── Types ───────────────────────────────────────────────────

interface StoredReportEntry {
  reportId: string;
  savedAt: string;     // ISO date
  emailCaptured: boolean;
}

// ─── Internal Helpers ────────────────────────────────────────

function readEntries(): StoredReportEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredReportEntry[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('[local-report-store] Failed to read localStorage');
    return [];
  }
}

function writeEntries(entries: StoredReportEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('[local-report-store] Failed to write localStorage:', err);
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Save a report ID to localStorage.
 * If already exists, moves it to the front (most recent).
 * FIFO eviction when exceeding MAX_STORED.
 */
export function saveReportId(reportId: string): void {
  const entries = readEntries();

  // Remove existing entry if present (to re-add at front)
  const filtered = entries.filter((e) => e.reportId !== reportId);

  // Add to front (most recent first)
  filtered.unshift({
    reportId,
    savedAt: new Date().toISOString(),
    emailCaptured: false,
  });

  // Trim to max
  writeEntries(filtered.slice(0, MAX_STORED));
}

/**
 * Get all stored report IDs (most recent first).
 */
export function getReportIds(): string[] {
  return readEntries().map((e) => e.reportId);
}

/**
 * Get full entries with metadata.
 */
export function getReportEntries(): StoredReportEntry[] {
  return readEntries();
}

/**
 * Check if a specific report ID is stored.
 */
export function hasReport(reportId: string): boolean {
  return readEntries().some((e) => e.reportId === reportId);
}

/**
 * Mark a report as having had email captured.
 * Used to avoid showing EmailCaptureModal again.
 */
export function markEmailCaptured(reportId: string): void {
  const entries = readEntries();
  const entry = entries.find((e) => e.reportId === reportId);
  if (entry) {
    entry.emailCaptured = true;
    writeEntries(entries);
  }
}

/**
 * Check if email has been captured for a specific report.
 */
export function isEmailCaptured(reportId: string): boolean {
  const entry = readEntries().find((e) => e.reportId === reportId);
  return entry?.emailCaptured ?? false;
}

/**
 * Get the count of stored reports.
 */
export function getStoredCount(): number {
  return readEntries().length;
}
