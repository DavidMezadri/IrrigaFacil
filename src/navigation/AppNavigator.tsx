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
import { BrokerConfigScreen } from '../screens/BrokerConfigScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PumpsScreen } from '../screens/PumpsScreen';
import { PumpFormScreen } from '../screens/PumpFormScreen';
import { SectorsScreen } from '../screens/SectorsScreen';
import { SectorFormScreen } from '../screens/SectorFormScreen';
import { SensorsScreen } from '../screens/SensorsScreen';
import { SensorFormScreen } from '../screens/SensorFormScreen';
import { SchedulesScreen } from '../screens/SchedulesScreen';
import { ScheduleFormScreen } from '../screens/ScheduleFormScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs for dashboard, pumps, sectors, sensors
const MainTabs = () => {
    const { state } = useApp();
    const insets = useSafeAreaInsets();
    const unreadLogs = state.logEntries.length;

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
            <Tab.Screen
                name="Schedules"
                component={SchedulesScreen as any}
                options={{
                    tabBarLabel: 'Schedules',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Logs"
                component={LogsScreen as any}
                options={{
                    tabBarLabel: 'Logs',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="text-box-multiple-outline" size={size} color={color} />
                    ),
                    tabBarBadge: unreadLogs > 0 ? (unreadLogs > 99 ? '99+' : unreadLogs) : undefined,
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
                    name="BrokerConfig"
                    component={BrokerConfigScreen as any}
                    options={{ title: 'Configuração do Broker' }}
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
                <Stack.Screen
                    name="ScheduleForm"
                    component={ScheduleFormScreen as any}
                    options={{ title: 'Schedule' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
