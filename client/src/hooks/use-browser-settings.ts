import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem } from '@shared/schema';

const HISTORY_KEY = 'schoolcord-history';
const PRIVACY_KEY = 'schoolcord-privacy';

export function useBrowserSettings() {
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(PRIVACY_KEY) === 'true';
    }
    return false;
  });

  const [savedHistory, setSavedHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(PRIVACY_KEY, String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    if (!privacyMode) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(savedHistory));
    }
  }, [savedHistory, privacyMode]);

  const addToHistory = useCallback((item: HistoryItem) => {
    if (privacyMode) return;
    
    setSavedHistory(prev => {
      const filtered = prev.filter(h => h.url !== item.url);
      return [item, ...filtered].slice(0, 50);
    });
  }, [privacyMode]);

  const clearHistory = useCallback(() => {
    setSavedHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode(prev => !prev);
  }, []);

  return {
    privacyMode,
    togglePrivacyMode,
    savedHistory,
    addToHistory,
    clearHistory,
  };
}
