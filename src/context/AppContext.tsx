import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, Farm, Pump, Sector, Sensor, SensorReading, Schedule } from '../types';
import * as StorageService from '../services/storageService';
import { generateId } from '../utils/messageFormatter';

// Initial state
const initialState: AppState = {
    farms: [],
    selectedFarmId: null,
    pumps: [],
    sectors: [],
    sensors: [],
    sensorReadings: {},
    schedules: [],
    mqttConnected: false,
    logEntries: [],
    brokerConfig: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_FARMS':
            return { ...state, farms: action.payload };

        case 'ADD_FARM':
            return { ...state, farms: [...state.farms, action.payload] };

        case 'UPDATE_FARM':
            return {
                ...state,
                farms: state.farms.map((farm) =>
                    farm.id === action.payload.id ? action.payload : farm
                ),
            };

        case 'DELETE_FARM':
            return {
                ...state,
                farms: state.farms.filter((farm) => farm.id !== action.payload),
                selectedFarmId: state.selectedFarmId === action.payload ? null : state.selectedFarmId,
            };

        case 'SELECT_FARM':
            return { ...state, selectedFarmId: action.payload };

        case 'SET_PUMPS':
            return { ...state, pumps: action.payload };

        case 'ADD_PUMP':
            return { ...state, pumps: [...state.pumps, action.payload] };

        case 'UPDATE_PUMP':
            return {
                ...state,
                pumps: state.pumps.map((pump) =>
                    pump.id === action.payload.id ? action.payload : pump
                ),
            };

        case 'DELETE_PUMP':
            return {
                ...state,
                pumps: state.pumps.filter((pump) => pump.id !== action.payload),
            };

        case 'UPDATE_PUMP_STATUS':
            return {
                ...state,
                pumps: state.pumps.map((pump) =>
                    pump.id === action.payload.id
                        ? { ...pump, status: action.payload.status, updatedAt: new Date().toISOString() }
                        : pump
                ),
            };

        case 'SET_SECTORS':
            return { ...state, sectors: action.payload };

        case 'ADD_SECTOR':
            return { ...state, sectors: [...state.sectors, action.payload] };

        case 'UPDATE_SECTOR':
            return {
                ...state,
                sectors: state.sectors.map((sector) =>
                    sector.id === action.payload.id ? action.payload : sector
                ),
            };

        case 'DELETE_SECTOR':
            return {
                ...state,
                sectors: state.sectors.filter((sector) => sector.id !== action.payload),
            };

        case 'UPDATE_SECTOR_STATUS':
            return {
                ...state,
                sectors: state.sectors.map((sector) =>
                    sector.id === action.payload.id
                        ? { ...sector, status: action.payload.status, updatedAt: new Date().toISOString() }
                        : sector
                ),
            };

        case 'SET_SENSORS':
            return { ...state, sensors: action.payload };

        case 'ADD_SENSOR':
            return { ...state, sensors: [...state.sensors, action.payload] };

        case 'UPDATE_SENSOR':
            return {
                ...state,
                sensors: state.sensors.map((sensor) =>
                    sensor.id === action.payload.id ? action.payload : sensor
                ),
            };

        case 'DELETE_SENSOR':
            return {
                ...state,
                sensors: state.sensors.filter((sensor) => sensor.id !== action.payload),
            };

        case 'ADD_SENSOR_READING':
            const { sensorId, reading } = action.payload;
            const existingReadings = state.sensorReadings[sensorId] || [];
            // Keep last 100 readings per sensor
            const updatedReadings = [...existingReadings, reading].slice(-100);

            return {
                ...state,
                sensorReadings: {
                    ...state.sensorReadings,
                    [sensorId]: updatedReadings,
                },
            };

        case 'SET_SCHEDULES':
            return { ...state, schedules: action.payload };

        case 'ADD_SCHEDULE':
            return { ...state, schedules: [...state.schedules, action.payload] };

        case 'UPDATE_SCHEDULE':
            return {
                ...state,
                schedules: state.schedules.map((s) =>
                    s.scheduleId === action.payload.scheduleId ? action.payload : s
                ),
            };

        case 'DELETE_SCHEDULE':
            return {
                ...state,
                schedules: state.schedules.filter((s) => s.scheduleId !== action.payload),
            };

        case 'TOGGLE_SCHEDULE_ENABLED':
            return {
                ...state,
                schedules: state.schedules.map((s) =>
                    s.scheduleId === action.payload.scheduleId
                        ? { ...s, enabled: action.payload.enabled, updatedAt: new Date().toISOString() }
                        : s
                ),
            };

        case 'SYNC_FROM_NODE': {
            const { farmId, data } = action.payload;
            const now = new Date().toISOString();

            // Upsert pumps & sectors from node gpios
            let pumps = [...state.pumps];
            let sectors = [...state.sectors];

            for (const gpio of data.gpios) {
                if (gpio.type === 'pump') {
                    const existing = pumps.find((p) => p.name === gpio.equipament && p.farmId === farmId);
                    if (existing) {
                        pumps = pumps.map((p) =>
                            p.id === existing.id ? { ...p, nodeId: gpio.nodeId, gpioPin: gpio.pin, updatedAt: now } : p
                        );
                    } else {
                        pumps = [...pumps, {
                            id: generateId(),
                            farmId,
                            name: gpio.equipament,
                            status: 'unknown' as const,
                            nodeId: gpio.nodeId,
                            gpioPin: gpio.pin,
                            createdAt: now,
                            updatedAt: now,
                        }];
                    }
                } else if (gpio.type === 'sector') {
                    const existing = sectors.find((s) => s.name === gpio.equipament && s.farmId === farmId);
                    if (existing) {
                        sectors = sectors.map((s) =>
                            s.id === existing.id ? { ...s, nodeId: gpio.nodeId, gpioPin: gpio.pin, updatedAt: now } : s
                        );
                    } else {
                        sectors = [...sectors, {
                            id: generateId(),
                            farmId,
                            name: gpio.equipament,
                            status: 'unknown' as const,
                            nodeId: gpio.nodeId,
                            gpioPin: gpio.pin,
                            createdAt: now,
                            updatedAt: now,
                        }];
                    }
                }
            }

            // Upsert schedules from node
            let schedules = [...state.schedules];
            for (const ns of data.schedules) {
                const existing = schedules.find((s) => s.scheduleId === ns.scheduleId);
                if (existing) {
                    schedules = schedules.map((s) =>
                        s.scheduleId === ns.scheduleId
                            ? { ...s, enabled: ns.enabled, actions: ns.actions, updatedAt: now }
                            : s
                    );
                } else {
                    schedules = [...schedules, {
                        scheduleId: ns.scheduleId,
                        farmId,
                        enabled: ns.enabled,
                        actions: ns.actions,
                        createdAt: now,
                        updatedAt: now,
                    }];
                }
            }

            return { ...state, pumps, sectors, schedules };
        }

        case 'ADD_LOG_ENTRY':
            // Keep last 500 messages
            return {
                ...state,
                logEntries: [...state.logEntries, action.payload].slice(-500),
            };

        case 'CLEAR_LOGS':
            return { ...state, logEntries: [] };

        case 'SET_MQTT_CONNECTED':
            return { ...state, mqttConnected: action.payload };

        case 'SET_BROKER_CONFIG':
            return { ...state, brokerConfig: action.payload };

        default:
            return state;
    }
};

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;

    // Helper functions
    getSelectedFarm: () => Farm | null;
    getFarmPumps: (farmId: string) => Pump[];
    getFarmSectors: (farmId: string) => Sector[];
    getFarmSensors: (farmId: string) => Sensor[];
    getFarmSchedules: (farmId: string) => Schedule[];
    getSensorReadings: (sensorId: string) => SensorReading[];
    getLatestSensorReading: (sensorId: string) => SensorReading | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Load data from storage on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [farms, pumps, sectors, sensors, schedules, selectedFarmId, brokerConfig] = await Promise.all([
                    StorageService.loadFarms(),
                    StorageService.loadPumps(),
                    StorageService.loadSectors(),
                    StorageService.loadSensors(),
                    StorageService.loadSchedules(),
                    StorageService.loadSelectedFarm(),
                    StorageService.loadBrokerConfig(),
                ]);

                dispatch({ type: 'SET_FARMS', payload: farms });
                dispatch({ type: 'SET_PUMPS', payload: pumps });
                dispatch({ type: 'SET_SECTORS', payload: sectors });
                dispatch({ type: 'SET_SENSORS', payload: sensors });
                dispatch({ type: 'SET_SCHEDULES', payload: schedules });
                if (selectedFarmId) {
                    dispatch({ type: 'SELECT_FARM', payload: selectedFarmId });
                }
                if (brokerConfig) {
                    dispatch({ type: 'SET_BROKER_CONFIG', payload: brokerConfig });
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, []);

    // Save data to storage when it changes
    useEffect(() => {
        StorageService.saveFarms(state.farms).catch(console.error);
    }, [state.farms]);

    useEffect(() => {
        StorageService.savePumps(state.pumps).catch(console.error);
    }, [state.pumps]);

    useEffect(() => {
        StorageService.saveSectors(state.sectors).catch(console.error);
    }, [state.sectors]);

    useEffect(() => {
        StorageService.saveSensors(state.sensors).catch(console.error);
    }, [state.sensors]);

    useEffect(() => {
        StorageService.saveSchedules(state.schedules).catch(console.error);
    }, [state.schedules]);

    useEffect(() => {
        StorageService.saveSelectedFarm(state.selectedFarmId).catch(console.error);
    }, [state.selectedFarmId]);

    useEffect(() => {
        if (state.brokerConfig) {
            StorageService.saveBrokerConfig(state.brokerConfig).catch(console.error);
        }
    }, [state.brokerConfig]);

    // Helper functions
    const getSelectedFarm = (): Farm | null => {
        if (!state.selectedFarmId) return null;
        return state.farms.find((farm) => farm.id === state.selectedFarmId) || null;
    };

    const getFarmPumps = (farmId: string): Pump[] => {
        return state.pumps.filter((pump) => pump.farmId === farmId);
    };

    const getFarmSectors = (farmId: string): Sector[] => {
        return state.sectors.filter((sector) => sector.farmId === farmId);
    };

    const getFarmSensors = (farmId: string): Sensor[] => {
        return state.sensors.filter((sensor) => sensor.farmId === farmId);
    };

    const getFarmSchedules = (farmId: string): Schedule[] => {
        return state.schedules.filter((s) => s.farmId === farmId);
    };

    const getSensorReadings = (sensorId: string): SensorReading[] => {
        return state.sensorReadings[sensorId] || [];
    };

    const getLatestSensorReading = (sensorId: string): SensorReading | null => {
        const readings = state.sensorReadings[sensorId];
        if (!readings || readings.length === 0) return null;
        return readings[readings.length - 1];
    };

    const value: AppContextType = {
        state,
        dispatch,
        getSelectedFarm,
        getFarmPumps,
        getFarmSectors,
        getFarmSensors,
        getFarmSchedules,
        getSensorReadings,
        getLatestSensorReading,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook
export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};
