import { useEffect, useMemo, useState } from 'react';
import { SettingsContext } from './settings';

const STORAGE_KEY = 'qasasSettings';

const DEFAULT_SETTINGS = {
  theme: 'system',
  arabicScript: 'madina',
};

function readStoredSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.arabicScript = settings.arabicScript;
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setTheme: (theme) => setSettings((prev) => ({ ...prev, theme })),
      setArabicScript: (arabicScript) =>
        setSettings((prev) => ({ ...prev, arabicScript })),
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
