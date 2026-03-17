// ═══════════════════════════════════════════════════════════════
//  /dashboard/admin/users — Phase 2 (G-5)
//  관리자 사용자 관리 페이지
//
//  withRoleGuard('admin') — admin 전용
//  Fetches users from /api/admin/users
//  Role change via PATCH /api/admin/users/[userId]
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboardLayout } from '@/components/dashboard/admin/AdminDashboardLayout';
import { UserManagement } from '@/components/dashboard/admin/UserManagement';

// ─── Types ───────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  stage: string;
  firebaseUid: string;
  country: string;
  language: string;
  createdAt: string;
  lastActivityAt: string;
}

interface UsersApiResponse {
  ok: boolean;
  users?: AdminUser[];
  error?: string;
}

interface RoleUpdateResponse {
  ok: boolean;
  error?: string;
}

// ─── Page Component ──────────────────────────────────────────

function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        let token = '';
        if (typeof window !== 'undefined') {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            token = await currentUser.getIdToken();
          }
        }

        const res = await fetch('/api/admin/users', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = (await res.json()) as UsersApiResponse;
        if (cancelled) return;

        if (data.ok && data.users) {
          setUsers(data.users);
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, [user]);

  // Role change handler
  const handleRoleChange = useCallback(
    async (userId: string, newRole: string): Promise<boolean> => {
      try {
        let token = '';
        if (typeof window !== 'undefined') {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            token = await currentUser.getIdToken();
          }
        }

        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role: newRole }),
        });

        const data = (await res.json()) as RoleUpdateResponse;

        if (data.ok) {
          // Update local state
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
          );
          return true;
        }

        setError(data.error ?? 'Failed to update role');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        return false;
      }
    },
    [],
  );

  return (
    <>
      <Head>
        <title>User Management — ConnectingDocs Admin</title>
      </Head>

      <AdminDashboardLayout title="User Management">
        <UserManagement
          users={users}
          loading={loading}
          error={error}
          onRoleChange={handleRoleChange}
        />
      </AdminDashboardLayout>
    </>
  );
}

export default withRoleGuard(AdminUsersPage, ['admin']);
