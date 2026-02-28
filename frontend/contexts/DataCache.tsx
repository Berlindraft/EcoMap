/**
 * DataCache – pre-fetches and caches common API data so screens load instantly.
 *
 * How it works:
 *   1. On login (profile available) it fires off parallel fetches for reports,
 *      rewards, user reports, and dashboard stats.
 *   2. Downstream screens read from cache first → instant render.
 *   3. Screens can still call `refresh*()` to re-fetch fresh data in the background.
 *   4. Mutations (redeem, report, etc.) can call the relevant refresh to keep cache warm.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  fetchReports,
  fetchUserReports,
  fetchRewards,
  fetchDashboardStats,
  fetchAllUsers,
  fetchProducts,
} from "../services/api";

// ─── Types ─────────────────────────────

interface DataCacheType {
  // Data
  reports: any[];
  userReports: any[];
  rewards: any[];
  dashboardStats: any | null;
  allUsers: any[];
  products: any[];

  // Loading flags
  reportsLoading: boolean;
  rewardsLoading: boolean;
  dashboardLoading: boolean;
  usersLoading: boolean;
  productsLoading: boolean;

  // Refresh helpers (call after mutations or pull-to-refresh)
  refreshReports: () => Promise<void>;
  refreshRewards: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataCacheContext = createContext<DataCacheType | undefined>(undefined);

// ─── Provider ──────────────────────────

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const [reports, setReports] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [reportsLoading, setReportsLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // ── Individual refreshers ────────────

  const refreshReports = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        fetchReports({ limit: 20 }),
        profile?.uid ? fetchUserReports(profile.uid) : Promise.resolve([]),
      ]);
      setReports(all);
      setUserReports(mine);
    } catch (e) {
      console.log("Cache: reports error", e);
    } finally {
      setReportsLoading(false);
    }
  }, [profile?.uid]);

  const refreshRewards = useCallback(async () => {
    try {
      const data = await fetchRewards();
      setRewards(data);
    } catch (e) {
      console.log("Cache: rewards error", e);
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const data = await fetchDashboardStats();
      setDashboardStats(data);
    } catch (e) {
      console.log("Cache: dashboard error", e);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await fetchAllUsers();
      setAllUsers(data);
    } catch (e) {
      console.log("Cache: users error", e);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const isAdmin = (profile?.role || "user") === "admin";
      const data = await fetchProducts(isAdmin ? undefined : profile?.uid);
      setProducts(data);
    } catch (e) {
      console.log("Cache: products error", e);
    } finally {
      setProductsLoading(false);
    }
  }, [profile?.uid, profile?.role]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshReports(),
      refreshRewards(),
      refreshDashboard(),
      refreshUsers(),
      refreshProducts(),
    ]);
  }, [refreshReports, refreshRewards, refreshDashboard, refreshUsers, refreshProducts]);

  // ── Prefetch on login ────────────────

  useEffect(() => {
    if (profile?.uid) {
      // Fire all fetches in parallel — screens will render cached data instantly
      refreshReports();
      refreshRewards();

      // Admin/partner get extra data prefetched
      const role = profile.role || "user";
      if (role === "admin" || role === "partner") {
        refreshDashboard();
        refreshProducts();
      }
      if (role === "admin") {
        refreshUsers();
      }
    }
  }, [profile?.uid]);

  return (
    <DataCacheContext.Provider
      value={{
        reports,
        userReports,
        rewards,
        dashboardStats,
        allUsers,
        products,
        reportsLoading,
        rewardsLoading,
        dashboardLoading,
        usersLoading,
        productsLoading,
        refreshReports,
        refreshRewards,
        refreshDashboard,
        refreshUsers,
        refreshProducts,
        refreshAll,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

// ─── Hook ──────────────────────────────

export function useDataCache(): DataCacheType {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error("useDataCache must be used inside DataCacheProvider");
  return ctx;
}
