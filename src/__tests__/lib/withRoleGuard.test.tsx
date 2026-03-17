/**
 * @jest-environment jsdom
 */
// ═══════════════════════════════════════════════════════════════
//  withRoleGuard.test.tsx — Phase 1 (C-8)
//  역할 기반 접근 제어 HOC 단위 테스트
//  - 미로그인 시 /login 리다이렉트
//  - role 불일치 시 /unauthorized 리다이렉트
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { render } from '@testing-library/react';

// ─── Mock next/router ───────────────────────────────────────

const mockReplace = jest.fn();
const mockAsPath = '/doctor/waitlist';

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    asPath: mockAsPath,
    pathname: mockAsPath,
    query: {},
    push: jest.fn(),
    back: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    isReady: true,
  }),
}));

// ─── Mock AuthContext ───────────────────────────────────────

interface MockAuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'patient' | 'doctor' | 'admin';
  provider: 'google' | 'demo';
}

let mockUser: MockAuthUser | null = null;
let mockLoading = false;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signInWithGoogle: jest.fn(),
    signInWithGithub: jest.fn(),
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    signOut: jest.fn(),
    openAuthModal: jest.fn(),
    closeAuthModal: jest.fn(),
    isAuthModalOpen: false,
    pendingAction: null,
  }),
}));

// ─── Mock lucide-react ──────────────────────────────────────

jest.mock('lucide-react', () => ({
  Loader2: (props: Record<string, string>) => React.createElement('div', { 'data-testid': 'loader', ...props }),
}));

// ─── Import after mocks ────────────────────────────────────

import { withRoleGuard } from '@/lib/withRoleGuard';

// ─── Test Component ─────────────────────────────────────────

function DummyPage() {
  return React.createElement('div', { 'data-testid': 'protected-content' }, 'Protected Content');
}

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  mockUser = null;
  mockLoading = false;
  mockReplace.mockClear();
});

describe('withRoleGuard', () => {
  // ── Test 14: 미로그인 시 /login 리다이렉트 ──
  it('redirects to /login when user is not authenticated', () => {
    mockUser = null;
    mockLoading = false;

    const GuardedPage = withRoleGuard(DummyPage, ['doctor', 'admin']);
    render(React.createElement(GuardedPage));

    expect(mockReplace).toHaveBeenCalledWith(
      `/login?returnUrl=${encodeURIComponent(mockAsPath)}`
    );
  });

  // ── Test 15: role 불일치 시 /unauthorized 리다이렉트 ──
  it('redirects to /unauthorized when user role does not match', () => {
    mockUser = {
      uid: 'test_uid',
      email: 'patient@example.com',
      displayName: 'Test Patient',
      role: 'patient',
      provider: 'google',
    };
    mockLoading = false;

    const GuardedPage = withRoleGuard(DummyPage, ['doctor', 'admin']);
    render(React.createElement(GuardedPage));

    expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
  });
});
