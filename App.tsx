import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { MQTTProvider } from './src/context/MQTTContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';

export default function App() {
  return (
    <AppProvider>
      <MQTTProvider>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <AppNavigator />
      </MQTTProvider>
    </AppProvider>
  );
}
