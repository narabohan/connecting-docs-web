// ═══════════════════════════════════════════════════════════════
//  usePatientQueue — Phase 2 (G-3)
//  환자 대기열 데이터 + 필터/정렬 로직
//
//  useDoctorStats의 plans 데이터를 소비하여
//  클라이언트 사이드 필터링/정렬 수행
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import type { PlanSummary } from '@/hooks/useDoctorStats';
import type { PlanStatus } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

export type SortField = 'date' | 'status';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = PlanStatus | 'all';

export interface QueueFilters {
  statusFilter: StatusFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
}

export interface UsePatientQueueReturn {
  filteredPlans: PlanSummary[];
  filters: QueueFilters;
  setStatusFilter: (filter: StatusFilter) => void;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

// ─── Status Order (for sorting) ──────────────────────────────

const STATUS_SORT_ORDER: Record<PlanStatus, number> = {
  draft: 0,
  doctor_review: 1,
  approved: 2,
  sent: 3,
};

// ─── Default Filters ─────────────────────────────────────────

const DEFAULT_FILTERS: QueueFilters = {
  statusFilter: 'all',
  sortField: 'date',
  sortDirection: 'desc',
  searchQuery: '',
};

// ─── Hook ────────────────────────────────────────────────────

export function usePatientQueue(plans: PlanSummary[]): UsePatientQueueReturn {
  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_FILTERS);

  const setStatusFilter = useCallback((statusFilter: StatusFilter) => {
    setFilters((prev) => ({ ...prev, statusFilter }));
  }, []);

  const setSortField = useCallback((sortField: SortField) => {
    setFilters((prev) => ({ ...prev, sortField }));
  }, []);

  const toggleSortDirection = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter((p) => p.status === filters.statusFilter);
    }

    // Search filter (planId, patientId, patientGoal)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.planId.toLowerCase().includes(q) ||
          p.patientId.toLowerCase().includes(q) ||
          p.patientGoal.toLowerCase().includes(q) ||
          p.patientCountry.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (filters.sortField === 'status') {
        cmp = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
      }
      return filters.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [plans, filters]);

  return {
    filteredPlans,
    filters,
    setStatusFilter,
    setSortField,
    toggleSortDirection,
    setSearchQuery,
    resetFilters,
    totalCount: plans.length,
    filteredCount: filteredPlans.length,
  };
}
