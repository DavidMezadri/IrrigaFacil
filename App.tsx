import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { MQTTProvider } from './src/context/MQTTContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider>
      <MQTTProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </MQTTProvider>
    </AppProvider>
  );
}
