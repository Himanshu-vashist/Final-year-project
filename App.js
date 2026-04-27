import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { SearchProvider } from './src/context/SearchContext';
import { EventProvider } from './src/context/EventContext';

export default function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <EventProvider>
          <StatusBar barStyle="light-content" />
          <AppNavigator />
        </EventProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}