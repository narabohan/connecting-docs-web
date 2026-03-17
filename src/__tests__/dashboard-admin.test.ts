// ═══════════════════════════════════════════════════════════════
//  Admin Dashboard Unit Tests — Phase 2 (G-5)
//
//  Tests:
//  1. isToday — admin system-stats helper
//  2. ReportBrowser — filter by status
//  3. ReportBrowser — search by goal / recommendation
//  4. ReportBrowser — sort by date / goal
//  5. SessionLog — filter by completion
//  6. SessionLog — completion rate calculation
//  7. EmailLog — filter by status + template
//  8. EmailLog — mask email helper
//  9. i18n — dashboard.admin keys exist in all 4 locales
// 10. UserManagement — filter by role + search
//
//  Environment: node (no React rendering — logic-only tests)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

export {};

// ─── Import locale files directly ────────────────────────────
import koLocale from '@/i18n/locales/ko.json';
import enLocale from '@/i18n/locales/en.json';
import jaLocale from '@/i18n/locales/ja.json';
import zhCNLocale from '@/i18n/locales/zh-CN.json';

// ─── Types (mirrors component logic) ────────────────────────

interface AdminReport {
  id: string;
  date: string;
  status: string;
  title: string;
  primaryGoal: string;
  skinType: string;
  topRecommendation: string;
  matchScore: number | null;
}

interface AdminSession {
  id: string;
  runId: string;
  createdAt: string;
  country: string;
  language: string;
  aestheticGoal: string;
  hasDangerFlag: boolean;
  topDevice: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  completed: boolean;
}

interface EmailLogEntry {
  id: string;
  emailId: string;
  recipient: string;
  template: string;
  locale: string;
  status: string;
  sentAt: string;
  error: string;
  retryCount: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  stage: string;
  country: string;
  createdAt: string;
}

type ReportStatusFilter = 'all' | 'completed' | 'pending';
type CompletionFilter = 'all' | 'completed' | 'incomplete';
type EmailStatusFilter = 'all' | 'sent' | 'failed' | 'queued' | 'rate_limited';
type EmailTemplateFilter = 'all' | 'report-ready' | 'plan-ready' | 'plan-approved' | 'welcome';
type RoleFilter = 'all' | 'patient' | 'doctor' | 'admin';

// ─── Pure functions extracted from components ────────────────

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

function filterReports(
  reports: AdminReport[],
  statusFilter: ReportStatusFilter,
  searchQuery: string,
): AdminReport[] {
  let result = [...reports];

  if (statusFilter !== 'all') {
    result = result.filter((r) => r.status === statusFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.primaryGoal.toLowerCase().includes(q) ||
        r.topRecommendation.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q),
    );
  }

  return result;
}

function sortReports(
  reports: AdminReport[],
  field: 'date' | 'goal',
  asc: boolean,
): AdminReport[] {
  const sorted = [...reports];
  sorted.sort((a, b) => {
    let cmp: number;
    if (field === 'goal') {
      cmp = a.primaryGoal.localeCompare(b.primaryGoal);
    } else {
      cmp = (a.date || '').localeCompare(b.date || '');
    }
    return asc ? cmp : -cmp;
  });
  return sorted;
}

function filterSessions(
  sessions: AdminSession[],
  completionFilter: CompletionFilter,
  searchQuery: string,
): AdminSession[] {
  let result = [...sessions];

  if (completionFilter === 'completed') {
    result = result.filter((s) => s.completed);
  } else if (completionFilter === 'incomplete') {
    result = result.filter((s) => !s.completed);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (s) =>
        s.runId.toLowerCase().includes(q) ||
        s.aestheticGoal.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.topDevice.toLowerCase().includes(q),
    );
  }

  return result;
}

function calcCompletionRate(sessions: AdminSession[]): number {
  if (sessions.length === 0) return 0;
  const completed = sessions.filter((s) => s.completed).length;
  return Math.round((completed / sessions.length) * 100);
}

function filterEmailLogs(
  logs: EmailLogEntry[],
  statusFilter: EmailStatusFilter,
  templateFilter: EmailTemplateFilter,
  searchQuery: string,
): EmailLogEntry[] {
  let result = [...logs];

  if (statusFilter !== 'all') {
    result = result.filter((l) => l.status === statusFilter);
  }

  if (templateFilter !== 'all') {
    result = result.filter((l) => l.template === templateFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (l) =>
        l.recipient.toLowerCase().includes(q) ||
        l.emailId.toLowerCase().includes(q) ||
        l.template.toLowerCase().includes(q),
    );
  }

  return result;
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name}@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function filterUsers(
  users: AdminUser[],
  roleFilter: RoleFilter,
  searchQuery: string,
): AdminUser[] {
  let result = [...users];

  if (roleFilter !== 'all') {
    result = result.filter((u) => u.role === roleFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }

  return result;
}

// ─── Locale type helper ──────────────────────────────────────

interface DashboardAdminKeys {
  dashboard?: {
    admin?: Record<string, string>;
  };
}

// ═══════════════════════════════════════════════════════════════
//  Sample Data
// ═══════════════════════════════════════════════════════════════

const SAMPLE_REPORTS: AdminReport[] = [
  {
    id: 'rec_001',
    date: '2026-03-15T10:00:00.000Z',
    status: 'completed',
    title: 'Report rec_001',
    primaryGoal: 'Skin tightening',
    skinType: 'oily',
    topRecommendation: 'Ultherapy',
    matchScore: 92,
  },
  {
    id: 'rec_002',
    date: '2026-03-16T08:00:00.000Z',
    status: 'pending',
    title: 'Report rec_002',
    primaryGoal: 'Acne treatment',
    skinType: 'combination',
    topRecommendation: 'Chemical Peel',
    matchScore: 85,
  },
  {
    id: 'rec_003',
    date: '2026-03-14T12:00:00.000Z',
    status: 'completed',
    title: 'Report rec_003',
    primaryGoal: 'Anti-aging',
    skinType: 'dry',
    topRecommendation: 'Botox',
    matchScore: null,
  },
];

const SAMPLE_SESSIONS: AdminSession[] = [
  {
    id: 'ses_001', runId: 'v2_1710500000_abc', createdAt: '2026-03-15T10:00:00.000Z',
    country: 'KR', language: 'KO', aestheticGoal: 'Skin tightening',
    hasDangerFlag: false, topDevice: 'Ultherapy', modelUsed: 'claude-opus-4-6',
    inputTokens: 5000, outputTokens: 3000, completed: true,
  },
  {
    id: 'ses_002', runId: 'v2_1710500001_def', createdAt: '2026-03-16T08:00:00.000Z',
    country: 'US', language: 'EN', aestheticGoal: 'Acne scar',
    hasDangerFlag: true, topDevice: 'Fraxel', modelUsed: 'claude-opus-4-6',
    inputTokens: 4500, outputTokens: 2800, completed: true,
  },
  {
    id: 'ses_003', runId: 'v2_1710500002_ghi', createdAt: '2026-03-17T06:00:00.000Z',
    country: 'JP', language: 'JP', aestheticGoal: 'Pigmentation',
    hasDangerFlag: false, topDevice: '', modelUsed: '',
    inputTokens: 2000, outputTokens: 0, completed: false,
  },
];

const SAMPLE_EMAILS: EmailLogEntry[] = [
  { id: 'em_001', emailId: 'email_abc123', recipient: 'john@example.com', template: 'report-ready', locale: 'EN', status: 'sent', sentAt: '2026-03-15T10:00:00.000Z', error: '', retryCount: 0, createdAt: '2026-03-15T10:00:00.000Z' },
  { id: 'em_002', emailId: 'email_def456', recipient: 'kim@example.kr', template: 'plan-approved', locale: 'KO', status: 'failed', sentAt: '', error: 'SMTP timeout', retryCount: 2, createdAt: '2026-03-16T08:00:00.000Z' },
  { id: 'em_003', emailId: 'email_ghi789', recipient: 'tanaka@example.jp', template: 'welcome', locale: 'JP', status: 'sent', sentAt: '2026-03-17T06:00:00.000Z', error: '', retryCount: 0, createdAt: '2026-03-17T06:00:00.000Z' },
  { id: 'em_004', emailId: 'email_jkl012', recipient: 'li@example.cn', template: 'report-ready', locale: 'ZH-CN', status: 'queued', sentAt: '', error: '', retryCount: 0, createdAt: '2026-03-17T09:00:00.000Z' },
];

const SAMPLE_USERS: AdminUser[] = [
  { id: 'usr_001', email: 'patient1@test.com', name: 'Alice Kim', role: 'patient', stage: 'report_viewed', country: 'KR', createdAt: '2026-03-10T00:00:00.000Z' },
  { id: 'usr_002', email: 'doctor1@test.com', name: 'Dr. Park', role: 'doctor', stage: 'active', country: 'KR', createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 'usr_003', email: 'admin@test.com', name: 'Admin Lee', role: 'admin', stage: 'active', country: 'KR', createdAt: '2026-02-15T00:00:00.000Z' },
  { id: 'usr_004', email: 'patient2@test.com', name: 'Bob Jones', role: 'patient', stage: 'survey_started', country: 'US', createdAt: '2026-03-16T00:00:00.000Z' },
];

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

// ─── Test 1: isToday helper ──────────────────────────────────

describe('Admin isToday helper', () => {
  it('should return true for today ISO string', () => {
    expect(isToday(new Date().toISOString())).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isToday(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isToday('')).toBe(false);
  });
});

// ─── Test 2: ReportBrowser — filter by status ────────────────

describe('ReportBrowser — filter by status', () => {
  it('should return all reports when filter is "all"', () => {
    const result = filterReports(SAMPLE_REPORTS, 'all', '');
    expect(result).toHaveLength(3);
  });

  it('should filter by completed status', () => {
    const result = filterReports(SAMPLE_REPORTS, 'completed', '');
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === 'completed')).toBe(true);
  });

  it('should filter by pending status', () => {
    const result = filterReports(SAMPLE_REPORTS, 'pending', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rec_002');
  });

  it('should return empty when no match', () => {
    const result = filterReports([], 'completed', '');
    expect(result).toHaveLength(0);
  });
});

// ─── Test 3: ReportBrowser — search ──────────────────────────

describe('ReportBrowser — search', () => {
  it('should search by primaryGoal', () => {
    const result = filterReports(SAMPLE_REPORTS, 'all', 'acne');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rec_002');
  });

  it('should search by topRecommendation', () => {
    const result = filterReports(SAMPLE_REPORTS, 'all', 'botox');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rec_003');
  });

  it('should combine status filter and search', () => {
    const result = filterReports(SAMPLE_REPORTS, 'completed', 'anti');
    expect(result).toHaveLength(1);
    expect(result[0].primaryGoal).toBe('Anti-aging');
  });

  it('should be case insensitive', () => {
    const result = filterReports(SAMPLE_REPORTS, 'all', 'SKIN');
    expect(result).toHaveLength(1);
  });
});

// ─── Test 4: ReportBrowser — sort ────────────────────────────

describe('ReportBrowser — sort', () => {
  it('should sort by date ascending', () => {
    const result = sortReports(SAMPLE_REPORTS, 'date', true);
    expect(result[0].id).toBe('rec_003'); // Mar 14
    expect(result[2].id).toBe('rec_002'); // Mar 16
  });

  it('should sort by date descending', () => {
    const result = sortReports(SAMPLE_REPORTS, 'date', false);
    expect(result[0].id).toBe('rec_002'); // Mar 16
    expect(result[2].id).toBe('rec_003'); // Mar 14
  });

  it('should sort by goal alphabetically', () => {
    const result = sortReports(SAMPLE_REPORTS, 'goal', true);
    expect(result[0].primaryGoal).toBe('Acne treatment');
    expect(result[2].primaryGoal).toBe('Skin tightening');
  });
});

// ─── Test 5: SessionLog — filter by completion ───────────────

describe('SessionLog — filter by completion', () => {
  it('should return all sessions when filter is "all"', () => {
    const result = filterSessions(SAMPLE_SESSIONS, 'all', '');
    expect(result).toHaveLength(3);
  });

  it('should filter completed only', () => {
    const result = filterSessions(SAMPLE_SESSIONS, 'completed', '');
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.completed)).toBe(true);
  });

  it('should filter incomplete only', () => {
    const result = filterSessions(SAMPLE_SESSIONS, 'incomplete', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ses_003');
  });

  it('should search by country', () => {
    const result = filterSessions(SAMPLE_SESSIONS, 'all', 'JP');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ses_003');
  });

  it('should search by aesthetic goal', () => {
    const result = filterSessions(SAMPLE_SESSIONS, 'all', 'scar');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ses_002');
  });
});

// ─── Test 6: SessionLog — completion rate ────────────────────

describe('SessionLog — completion rate', () => {
  it('should calculate rate correctly', () => {
    expect(calcCompletionRate(SAMPLE_SESSIONS)).toBe(67); // 2/3
  });

  it('should return 0 for empty sessions', () => {
    expect(calcCompletionRate([])).toBe(0);
  });

  it('should return 100 when all completed', () => {
    const allCompleted = SAMPLE_SESSIONS.map((s) => ({ ...s, completed: true }));
    expect(calcCompletionRate(allCompleted)).toBe(100);
  });
});

// ─── Test 7: EmailLog — filter by status + template ──────────

describe('EmailLog — filter by status and template', () => {
  it('should filter by sent status', () => {
    const result = filterEmailLogs(SAMPLE_EMAILS, 'sent', 'all', '');
    expect(result).toHaveLength(2);
  });

  it('should filter by failed status', () => {
    const result = filterEmailLogs(SAMPLE_EMAILS, 'failed', 'all', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('em_002');
  });

  it('should filter by template', () => {
    const result = filterEmailLogs(SAMPLE_EMAILS, 'all', 'report-ready', '');
    expect(result).toHaveLength(2);
  });

  it('should combine status and template filters', () => {
    const result = filterEmailLogs(SAMPLE_EMAILS, 'sent', 'report-ready', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('em_001');
  });

  it('should search by recipient', () => {
    const result = filterEmailLogs(SAMPLE_EMAILS, 'all', 'all', 'tanaka');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('em_003');
  });
});

// ─── Test 8: EmailLog — mask email ───────────────────────────

describe('EmailLog — maskEmail helper', () => {
  it('should mask normal email', () => {
    expect(maskEmail('john@example.com')).toBe('jo***@example.com');
  });

  it('should not mask very short name', () => {
    expect(maskEmail('ab@example.com')).toBe('ab@example.com');
  });

  it('should handle single char name', () => {
    expect(maskEmail('a@example.com')).toBe('a@example.com');
  });

  it('should return as-is for invalid email', () => {
    expect(maskEmail('nope')).toBe('nope');
  });

  it('should mask long email names', () => {
    expect(maskEmail('longusername@domain.org')).toBe('lo***@domain.org');
  });
});

// ─── Test 9: i18n — dashboard.admin keys in all locales ──────

describe('i18n — dashboard.admin keys', () => {
  const REQUIRED_ADMIN_KEYS = [
    'title',
    'overview',
    'users',
    'reports',
    'sessions',
    'emails',
    'settings',
    'sign_out',
    'stat_total_users',
    'stat_today_signups',
    'stat_total_reports',
    'stat_today_reports',
    'stat_total_plans',
    'stat_approval_rate',
    'stat_email_success',
    'stat_active_sessions',
    'refresh',
    'search_users',
    'search_reports',
    'search_sessions',
    'search_emails',
    'filter_all',
    'filter_completed',
    'filter_pending',
    'filter_incomplete',
    'role_patient',
    'role_doctor',
    'role_admin',
    'change_role',
    'change_role_confirm',
    'no_data',
    'report_preview',
    'session_completed',
    'session_in_progress',
    'danger_flag',
  ];

  const locales: Record<string, DashboardAdminKeys> = {
    ko: koLocale,
    en: enLocale,
    ja: jaLocale,
    'zh-CN': zhCNLocale,
  };

  for (const [langCode, locale] of Object.entries(locales)) {
    it(`should have all dashboard.admin keys in ${langCode} locale`, () => {
      const adminKeys = locale.dashboard?.admin;
      expect(adminKeys).toBeDefined();
      for (const key of REQUIRED_ADMIN_KEYS) {
        expect(adminKeys?.[key]).toBeDefined();
        expect(typeof adminKeys?.[key]).toBe('string');
        expect((adminKeys?.[key] ?? '').length).toBeGreaterThan(0);
      }
    });
  }
});

// ─── Test 10: UserManagement — filter by role + search ───────

describe('UserManagement — filter by role and search', () => {
  it('should return all users when filter is "all"', () => {
    const result = filterUsers(SAMPLE_USERS, 'all', '');
    expect(result).toHaveLength(4);
  });

  it('should filter by patient role', () => {
    const result = filterUsers(SAMPLE_USERS, 'patient', '');
    expect(result).toHaveLength(2);
  });

  it('should filter by doctor role', () => {
    const result = filterUsers(SAMPLE_USERS, 'doctor', '');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dr. Park');
  });

  it('should filter by admin role', () => {
    const result = filterUsers(SAMPLE_USERS, 'admin', '');
    expect(result).toHaveLength(1);
  });

  it('should search by name', () => {
    const result = filterUsers(SAMPLE_USERS, 'all', 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('usr_001');
  });

  it('should search by email', () => {
    const result = filterUsers(SAMPLE_USERS, 'all', 'doctor1');
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('doctor');
  });

  it('should combine role filter and search', () => {
    const result = filterUsers(SAMPLE_USERS, 'patient', 'bob');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob Jones');
  });

  it('should return empty for no match', () => {
    const result = filterUsers(SAMPLE_USERS, 'all', 'nonexistent');
    expect(result).toHaveLength(0);
  });
});
