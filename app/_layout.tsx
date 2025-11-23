import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthService } from '@/src/services/auth';
import { useStore } from '@/src/store/appStore';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { FilterProvider } from '@/src/context/FilterContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    // Initialize user on app startup
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Money Manager app...');
        const user = await AuthService.initializeUser();
        setUser(user);
        console.log(`✅ App ready. User ID: ${user.id}`);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [setUser]);

  return (
    <ThemeProvider>
      <FilterProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </FilterProvider>
    </ThemeProvider>
  );
}
