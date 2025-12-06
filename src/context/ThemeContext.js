import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#f5f7fa',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#2d3748',
    textSecondary: '#718096',
    border: '#e2e8f0',
    error: '#f56565',
    success: '#48bb78',
    warning: '#ed8936',
    info: '#4299e1',
    accent: '#667eea',
    placeholder: '#a0aec0',
    disabled: '#cbd5e0',
    backdrop: 'rgba(0, 0, 0, 0.3)',
  },
  gradients: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#4299e1', '#667eea'],
    dark: ['#2d3748', '#4a5568'],
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
    small: 4,
    sm: 4,
    medium: 8,
    md: 8,
    large: 12,
    lg: 12,
    xl: 16,
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
    primary: '#4299e1',
    secondary: '#3182ce',
    background: '#0f1419',
    surface: '#1a202c',
    card: '#2d3748',
    text: '#e2e8f0',
    textSecondary: '#a0aec0',
    border: '#2d3748',
    error: '#fc8181',
    success: '#68d391',
    warning: '#f6ad55',
    info: '#63b3ed',
    accent: '#4299e1',
    placeholder: '#4a5568',
    disabled: '#2d3748',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  gradients: {
    primary: ['#1a365d', '#2c5282', '#2b6cb0'],
    secondary: ['#1e3a8a', '#2563eb'],
    dark: ['#0f1419', '#1a202c', '#2d3748'],
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
    small: 4,
    sm: 4,
    medium: 8,
    md: 8,
    large: 12,
    lg: 12,
    xl: 16,
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
