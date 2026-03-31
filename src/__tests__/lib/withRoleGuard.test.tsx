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

  // ── Test 16: admin role → 정상 렌더 (race condition fix 검증) ──
  it('renders protected content when user has admin role', () => {
    mockUser = {
      uid: 'admin_uid',
      email: 'admin@connectingdocs.ai',
      displayName: 'Admin User',
      role: 'admin',
      provider: 'google',
    };
    mockLoading = false;

    const GuardedPage = withRoleGuard(DummyPage, ['doctor', 'admin']);
    const { getByTestId } = render(React.createElement(GuardedPage));

    expect(mockReplace).not.toHaveBeenCalled();
    expect(getByTestId('protected-content')).toBeTruthy();
  });

  // ── Test 17: doctor role → /dashboard/doctor 접근 가능 ──
  it('renders protected content when user has doctor role', () => {
    mockUser = {
      uid: 'doctor_uid',
      email: 'doctor@clinic.com',
      displayName: 'Dr. Kim',
      role: 'doctor',
      provider: 'google',
    };
    mockLoading = false;

    const GuardedPage = withRoleGuard(DummyPage, ['doctor', 'admin']);
    const { getByTestId } = render(React.createElement(GuardedPage));

    expect(mockReplace).not.toHaveBeenCalled();
    expect(getByTestId('protected-content')).toBeTruthy();
  });

  // ── Test 18: admin-only 페이지에 doctor 접근 시 차단 ──
  it('blocks doctor from admin-only page', () => {
    mockUser = {
      uid: 'doctor_uid',
      email: 'doctor@clinic.com',
      displayName: 'Dr. Kim',
      role: 'doctor',
      provider: 'google',
    };
    mockLoading = false;

    const GuardedPage = withRoleGuard(DummyPage, ['admin']);
    render(React.createElement(GuardedPage));

    expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
  });

  // ── Test 19: loading 상태 → 스피너, 리다이렉트 없음 ──
  it('shows loader and does not redirect while loading', () => {
    mockUser = null;
    mockLoading = true;

    const GuardedPage = withRoleGuard(DummyPage, ['doctor', 'admin']);
    const { getByTestId, queryByTestId } = render(React.createElement(GuardedPage));

    expect(getByTestId('loader')).toBeTruthy();
    expect(queryByTestId('protected-content')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
