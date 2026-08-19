"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Hymn, UsageHistory, HymnWithLastSung, HymnWithRecentHistory } from "@/types";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface AppData {
  hymns: Hymn[];
  usageHistory: UsageHistory[];
}

interface HymnStoreContextType {
  hymns: Hymn[];
  usageHistory: UsageHistory[];
  isLoading: boolean;
  
  // Data actions
  addHymn: (title: string) => { success: boolean; error?: string; message?: string };
  editHymn: (id: string, title: string) => { success: boolean; error?: string; message?: string };
  deleteHymn: (id: string) => { success: boolean; error?: string; message?: string };
  logHymnUsage: (hymnId: string, date: Date) => { success: boolean; error?: string; message?: string };
  removeHymnUsage: (usageId: string) => { success: boolean; error?: string; message?: string };
  
  // Fetch actions
  getHymns: (params: { search?: string; sort?: string; historyFilter?: string; page?: number; limit?: number }) => { data: HymnWithLastSung[]; pagination: { page: number; limit: number; totalCount: number; totalPages: number; hasMore: boolean } };
  getHymnWithHistory: (id: string) => { success: boolean; data?: HymnWithRecentHistory; error?: string };
  
  // Import/Export
  exportData: () => void;
  importData: (jsonData: string) => { success: boolean; error?: string };
}

const LOCAL_STORAGE_KEY = "choirtrack_data";
const MAX_HISTORY_COUNT = 6;

const defaultContext: HymnStoreContextType = {
  hymns: [],
  usageHistory: [],
  isLoading: true,
  addHymn: () => ({ success: false }),
  editHymn: () => ({ success: false }),
  deleteHymn: () => ({ success: false }),
  logHymnUsage: () => ({ success: false }),
  removeHymnUsage: () => ({ success: false }),
  getHymns: () => ({ data: [], pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0, hasMore: false } }),
  getHymnWithHistory: () => ({ success: false }),
  exportData: () => {},
  importData: () => ({ success: false }),
};

const HymnStoreContext = createContext<HymnStoreContextType>(defaultContext);

export function HymnStoreProvider({ children }: { children: React.ReactNode }) {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const loadedHymns = (parsed.hymns || []).map((h: Record<string, string>) => ({
            ...h,
            createdAt: new Date(h.createdAt),
            updatedAt: new Date(h.updatedAt),
          }));
          const loadedHistory = (parsed.usageHistory || []).map((u: Record<string, string>) => ({
            ...u,
            sungDate: new Date(u.sungDate),
            createdAt: new Date(u.createdAt),
          }));
          setHymns(loadedHymns);
          setUsageHistory(loadedHistory);
        }
      } catch (err) {
        console.error("Failed to load data from localStorage", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (isLoading) return;
    try {
      const data: AppData = { hymns, usageHistory };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data to localStorage", err);
    }
  }, [hymns, usageHistory, isLoading]);

  const addHymn = useCallback((title: string) => {
    if (!title.trim()) return { success: false, error: "Title is required." };
    if (hymns.some(h => h.title.toLowerCase() === title.trim().toLowerCase())) {
      return { success: false, error: "A hymn with this title already exists." };
    }
    
    const newHymn: Hymn = {
      id: generateId(),
      title: title.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setHymns(prev => [...prev, newHymn]);
    return { success: true, message: `Hymn "${newHymn.title}" added.` };
  }, [hymns]);

  const editHymn = useCallback((id: string, title: string) => {
    if (!title.trim()) return { success: false, error: "Title is required." };
    if (hymns.some(h => h.id !== id && h.title.toLowerCase() === title.trim().toLowerCase())) {
      return { success: false, error: "A hymn with this title already exists." };
    }
    
    setHymns(prev => prev.map(h => h.id === id ? { ...h, title: title.trim(), updatedAt: new Date() } : h));
    return { success: true, message: `Hymn title updated to "${title.trim()}".` };
  }, [hymns]);

  const deleteHymn = useCallback((id: string) => {
    setHymns(prev => prev.filter(h => h.id !== id));
    setUsageHistory(prev => prev.filter(u => u.hymnId !== id));
    return { success: true, message: "Hymn deleted successfully." };
  }, []);

  const logHymnUsage = useCallback((hymnId: string, date: Date) => {
    const newUsage: UsageHistory = {
      id: generateId(),
      hymnId,
      sungDate: date,
      createdAt: new Date(),
    };
    
    setUsageHistory(prev => {
      const hymnHistory = [...prev.filter(u => u.hymnId === hymnId), newUsage]
        .sort((a, b) => b.sungDate.getTime() - a.sungDate.getTime());
      
      const otherHistory = prev.filter(u => u.hymnId !== hymnId);
      
      if (hymnHistory.length > MAX_HISTORY_COUNT) {
        return [...otherHistory, ...hymnHistory.slice(0, MAX_HISTORY_COUNT)];
      }
      return [...otherHistory, ...hymnHistory];
    });
    
    return { success: true, message: "Usage logged successfully." };
  }, []);

  const removeHymnUsage = useCallback((usageId: string) => {
    setUsageHistory(prev => prev.filter(u => u.id !== usageId));
    return { success: true, message: "Usage record removed." };
  }, []);

  const getHymns = useCallback((params: { search?: string; sort?: string; historyFilter?: string; page?: number; limit?: number }) => {
    const { search, sort, historyFilter = "all", page = 1, limit = 20 } = params;
    
    let result: HymnWithLastSung[] = hymns.map(hymn => {
      const history = usageHistory
        .filter(u => u.hymnId === hymn.id)
        .sort((a, b) => b.sungDate.getTime() - a.sungDate.getTime());
        
      return {
        ...hymn,
        usageHistory: history,
        lastSungDate: history.length > 0 ? history[0].sungDate : null,
      };
    });

    if (search) {
      result = result.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (historyFilter === "with-history") {
      result = result.filter(h => h.lastSungDate !== null);
    } else if (historyFilter === "no-history") {
      result = result.filter(h => h.lastSungDate === null);
    }

    result.sort((a, b) => {
      if (sort === "last-sung-asc") {
        if (a.lastSungDate === null && b.lastSungDate === null) return a.title.localeCompare(b.title);
        if (a.lastSungDate === null) return -1;
        if (b.lastSungDate === null) return 1;
        return a.lastSungDate.getTime() - b.lastSungDate.getTime();
      } else if (sort === "last-sung-desc") {
        if (a.lastSungDate === null && b.lastSungDate === null) return a.title.localeCompare(b.title);
        if (a.lastSungDate === null) return -1;
        if (b.lastSungDate === null) return 1;
        return b.lastSungDate.getTime() - a.lastSungDate.getTime();
      } else if (sort === "title-desc") {
        const aHasHistory = a.lastSungDate !== null;
        const bHasHistory = b.lastSungDate !== null;
        if (!aHasHistory && bHasHistory) return -1;
        if (aHasHistory && !bHasHistory) return 1;
        return b.title.localeCompare(a.title);
      } else {
        const aHasHistory = a.lastSungDate !== null;
        const bHasHistory = b.lastSungDate !== null;
        if (!aHasHistory && bHasHistory) return -1;
        if (aHasHistory && !bHasHistory) return 1;
        return a.title.localeCompare(b.title);
      }
    });

    const totalCount = result.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginated = result.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    };
  }, [hymns, usageHistory]);

  const getHymnWithHistory = useCallback((id: string) => {
    const hymn = hymns.find(h => h.id === id);
    if (!hymn) return { success: false, error: "Hymn not found." };
    
    const history = usageHistory
      .filter(u => u.hymnId === id)
      .sort((a, b) => b.sungDate.getTime() - a.sungDate.getTime())
      .slice(0, MAX_HISTORY_COUNT);
      
    return {
      success: true,
      data: { ...hymn, usageHistory: history }
    };
  }, [hymns, usageHistory]);

  const exportData = useCallback(() => {
    const data = { hymns, usageHistory };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `choirtrack-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [hymns, usageHistory]);

  const importData = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed.hymns) || !Array.isArray(parsed.usageHistory)) {
        return { success: false, error: "Invalid data format." };
      }
      
      const loadedHymns = parsed.hymns.map((h: Record<string, string>) => ({
        ...h,
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
      const loadedHistory = parsed.usageHistory.map((u: Record<string, string>) => ({
        ...u,
        sungDate: new Date(u.sungDate),
        createdAt: new Date(u.createdAt),
      }));
      
      setHymns(loadedHymns);
      setUsageHistory(loadedHistory);
      return { success: true };
    } catch {
      return { success: false, error: "Failed to parse JSON data." };
    }
  }, []);

  const value = {
    hymns,
    usageHistory,
    isLoading,
    addHymn,
    editHymn,
    deleteHymn,
    logHymnUsage,
    removeHymnUsage,
    getHymns,
    getHymnWithHistory,
    exportData,
    importData
  };

  return <HymnStoreContext.Provider value={value}>{children}</HymnStoreContext.Provider>;
}

export function useHymnStore() {
  const context = useContext(HymnStoreContext);
  if (!context) {
    throw new Error("useHymnStore must be used within a HymnStoreProvider");
  }
  return context;
}
