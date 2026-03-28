import { useState, useEffect, useCallback } from 'react';
import { QREntry, QRSettings, QRCustomization } from '@/lib/types';

const HISTORY_KEY = 'qr_history';
const SETTINGS_KEY = 'qr_settings';

const DEFAULT_SETTINGS: QRSettings = {
  defaultFgColor: '#000000',
  defaultBgColor: '#ffffff',
  defaultSize: 300,
  defaultErrorLevel: 'Q',
};

export const DEFAULT_CUSTOMIZATION: QRCustomization = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  size: 300,
  errorLevel: 'Q',
  cornerStyle: 'square',
  dotStyle: 'squares',
  padding: 4,
  useGradient: false,
  gradientColor2: '#6b21a8'
};

export function useQRStore() {
  // History State
  const [history, setHistory] = useState<QREntry[]>([]);
  // Settings State
  const [settings, setSettings] = useState<QRSettings>(DEFAULT_SETTINGS);

  // Load initial data
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));

      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  // Sync History
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Sync Settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const saveQR = useCallback((entry: Omit<QREntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: QREntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHistory(prev => [newEntry, ...prev]);
    return newEntry.id;
  }, []);

  const updateQR = useCallback((id: string, updates: Partial<QREntry>) => {
    setHistory(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() } 
        : item
    ));
  }, []);

  const deleteQR = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    settings,
    setSettings,
    saveQR,
    updateQR,
    deleteQR,
    clearHistory
  };
}
