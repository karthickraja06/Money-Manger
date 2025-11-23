/**
 * PHASE 4: Theme Context and Hook
 * Manages app-wide theme settings (light/dark mode)
 * 
 * Usage:
 * const { isDarkMode, toggleTheme, colors } = useTheme();
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  colors: typeof Colors.light | typeof Colors.dark;
  colorScheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

/**
 * PHASE 4: Theme Provider Component
 * Wraps app to provide theme context
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme() || 'light';
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>('active');

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();

    // Listen for app state changes
    if (Platform.OS !== 'web') {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription.remove();
    }
  }, []);

  const loadThemePreference = async () => {
    try {
      console.log('🌙 Loading theme preference...');
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        console.log(`✅ Found saved theme: ${saved}`);
        setIsDarkMode(saved === 'dark');
      } else {
        // Use system preference
        console.log(`✅ Using system preference: ${systemColorScheme}`);
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('❌ Error loading theme preference:', error);
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setAppState(nextAppState);
    if (nextAppState === 'active') {
      // Refresh theme when app comes to foreground
      loadThemePreference();
    }
  };

  const toggleTheme = () => {
    setTheme(!isDarkMode);
  };

  const setTheme = async (isDark: boolean) => {
    try {
      setIsDarkMode(isDark);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      console.log(`✅ Theme changed to: ${isDark ? 'dark' : 'light'}`);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const currentTheme = isDarkMode ?? (systemColorScheme === 'dark');
  const colors = currentTheme ? Colors.dark : Colors.light;
  const colorScheme = currentTheme ? 'dark' : 'light';

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode: currentTheme,
        toggleTheme,
        setTheme,
        colors,
        colorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * PHASE 4: useTheme Hook
 * Use in any component to access theme
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * PHASE 4: Themed View StyleSheet Creator
 * Helper for creating theme-aware styles
 */
export function createThemedStyles(
  lightStyles: Record<string, any>,
  darkStyles: Record<string, any>
) {
  return {
    light: lightStyles,
    dark: darkStyles,
  };
}

/**
 * PHASE 4: Get themed style
 * Returns appropriate style based on current theme
 */
export function getThemedStyle(styles: { light: any; dark: any }, isDarkMode: boolean) {
  return isDarkMode ? styles.dark : styles.light;
}
