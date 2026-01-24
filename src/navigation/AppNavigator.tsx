import React from 'react';
import { Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';

// Screens
import { FarmListScreen } from '../screens/FarmListScreen';
import { FarmFormScreen } from '../screens/FarmFormScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PumpsScreen } from '../screens/PumpsScreen';
import { PumpFormScreen } from '../screens/PumpFormScreen';
import { SectorsScreen } from '../screens/SectorsScreen';
import { SectorFormScreen } from '../screens/SectorFormScreen';
import { SensorsScreen } from '../screens/SensorsScreen';
import { SensorFormScreen } from '../screens/SensorFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs for dashboard, pumps, sectors, sensors
const MainTabs = () => {
    const insets = useSafeAreaInsets();

    // Base height (60) + safe area inset (or 12 if 0/undefined) + extra padding (8)
    const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
    const tabBarHeight = 60 + bottomPadding;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.backgroundCard,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                    height: tabBarHeight,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen as any}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Pumps"
                component={PumpsScreen as any}
                options={{
                    tabBarLabel: 'Bombas',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="pump" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sectors"
                component={SectorsScreen as any}
                options={{
                    tabBarLabel: 'Setores',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="faucet" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sensors"
                component={SensorsScreen as any}
                options={{
                    tabBarLabel: 'Sensores',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="chart-box" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.backgroundCard,
                    },
                    headerTintColor: theme.colors.text,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    headerShadowVisible: true,
                    contentStyle: {
                        backgroundColor: theme.colors.background,
                    },
                }}
            >
                <Stack.Screen
                    name="FarmList"
                    component={FarmListScreen as any}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="FarmForm"
                    component={FarmFormScreen as any}
                    options={{ title: 'Fazenda' }}
                />
                <Stack.Screen
                    name="Main"
                    component={MainTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="PumpForm"
                    component={PumpFormScreen as any}
                    options={{ title: 'Bomba' }}
                />
                <Stack.Screen
                    name="SectorForm"
                    component={SectorFormScreen as any}
                    options={{ title: 'Setor' }}
                />
                <Stack.Screen
                    name="SensorForm"
                    component={SensorFormScreen as any}
                    options={{ title: 'Sensor' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
