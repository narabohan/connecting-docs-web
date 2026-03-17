// ═══════════════════════════════════════════════════════════════
//  UserManagement — Phase 2 (G-5)
//  관리자 사용자 관리 테이블: 검색 + 필터 + 역할 변경
//  G-3 PatientQueue 패턴 복사 → 사용자 목록으로 확장
//
//  Features:
//  - 검색: 이름/이메일 텍스트 검색
//  - 필터: 역할별 (all, patient, doctor, admin)
//  - 정렬: 가입일순, 이름순
//  - 역할 변경: 드롭다운 + 확인 모달
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Users,
  Inbox,
  Shield,
  AlertCircle,
  X,
  Check,
  Loader2,
} from 'lucide-react';

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

type RoleFilter = 'all' | 'patient' | 'doctor' | 'admin';
type SortField = 'date' | 'name';

interface UserManagementProps {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  onRoleChange: (userId: string, newRole: string) => Promise<boolean>;
}

// ─── Role Config ────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  patient: { label: 'Patient', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  doctor: { label: 'Doctor', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  admin: { label: 'Admin', color: 'text-violet-400', bg: 'bg-violet-500/15' },
};

const FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Admin' },
];

// ─── Role Badge ─────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.patient;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── Format Date ────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Confirm Modal ──────────────────────────────────────────

interface ConfirmModalProps {
  userName: string;
  currentRole: string;
  newRole: string;
  updating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ userName, currentRole, newRole, updating, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            Change User Role
          </h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-300">
          Change <span className="text-white font-medium">{userName || 'this user'}</span> from{' '}
          <RoleBadge role={currentRole} /> to <RoleBadge role={newRole} />?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={updating}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{updating ? 'Updating...' : 'Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export function UserManagement({ users, loading, error, onRoleChange }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Confirm modal state
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    userName: string;
    currentRole: string;
    newRole: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Filter + sort
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [users, roleFilter, searchQuery, sortField, sortAsc]);

  // Role change handlers
  const handleRoleSelect = useCallback(
    (userId: string, userName: string, currentRole: string, newRole: string) => {
      if (newRole === currentRole) return;
      setPendingChange({ userId, userName, currentRole, newRole });
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingChange) return;
    setUpdating(true);
    const ok = await onRoleChange(pendingChange.userId, pendingChange.newRole);
    setUpdating(false);
    if (ok) {
      setPendingChange(null);
    }
  }, [pendingChange, onRoleChange]);

  const handleCancel = useCallback(() => {
    setPendingChange(null);
  }, []);

  return (
    <>
      <section className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">User Management</h2>
            <span className="text-xs text-gray-500">
              {filteredUsers.length === users.length
                ? `${users.length} users`
                : `${filteredUsers.length} of ${users.length}`}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${roleFilter === opt.value
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                }
              `}
            >
              {opt.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSortField(sortField === 'date' ? 'name' : 'date')}
              className="px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sort: {sortField === 'date' ? 'Date' : 'Name'}
            </button>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
            <Inbox className="w-10 h-10 text-gray-600" />
            <p className="text-sm">No users found</p>
            {roleFilter !== 'all' && (
              <button
                onClick={() => setRoleFilter('all')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">User</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Role</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Stage</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Country</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Joined</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {user.name || '(no name)'}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {user.email || '(no email)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {user.stage || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {user.country || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleSelect(user.id, user.name, user.role, e.target.value)
                          }
                          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <div key={user.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white truncate block">
                        {user.name || '(no name)'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {user.email || '(no email)'}
                      </span>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {formatDate(user.createdAt)} · {user.country || '—'}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleSelect(user.id, user.name, user.role, e.target.value)
                      }
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Confirm Modal */}
      {pendingChange && (
        <ConfirmModal
          userName={pendingChange.userName}
          currentRole={pendingChange.currentRole}
          newRole={pendingChange.newRole}
          updating={updating}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
