import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Provider as PaperProvider, 
  MD3LightTheme, 
  MD3DarkTheme 
} from 'react-native-paper';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    accent: '#f43f5e',
    placeholder: '#94a3b8',
    disabled: '#cbd5e1',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    secondary: ['#3b82f6', '#2dd4bf'],
    dark: ['#1e293b', '#334155'],
    accent: ['#f43f5e', '#fb7185'],
    success: ['#10b981', '#34d399'],
  },
  spacing: {
    xs: 4,
    small: 8,
    sm: 8,
    medium: 16,
    md: 16,
    large: 24,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 6,
    sm: 6,
    medium: 12,
    md: 12,
    large: 20,
    lg: 20,
    xl: 28,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#818cf8',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',
    accent: '#fb7185',
    placeholder: '#475569',
    disabled: '#1e293b',
    backdrop: 'rgba(0, 0, 0, 0.8)',
    glass: 'rgba(30, 41, 59, 0.7)',
  },
  gradients: {
    primary: ['#1e1b4b', '#312e81', '#4338ca'],
    secondary: ['#1e3a8a', '#1d4ed8', '#2563eb'],
    dark: ['#0f172a', '#1e293b', '#334155'],
    accent: ['#881337', '#be123c', '#e11d48'],
    surface: ['#1e293b', '#0f172a'],
  },
  spacing: {
    xs: 4,
    small: 8,
    sm: 8,
    medium: 16,
    md: 16,
    large: 24,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 6,
    sm: 6,
    medium: 12,
    md: 12,
    large: 20,
    lg: 20,
    xl: 28,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const paperTheme = isDarkMode
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          error: theme.colors.error,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          error: theme.colors.error,
        },
      };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};
