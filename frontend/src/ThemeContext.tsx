import React, { createContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from './services/settingsService';

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (settings) {
      if (settings.dark_mode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    } else {
      // Default to light mode if no settings found (e.g. not logged in)
      document.body.classList.remove('dark');
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};
