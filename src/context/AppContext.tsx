import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, Farm, Pump, Sector, Sensor, SensorReading } from '../types';
import * as StorageService from '../services/storageService';

// Initial state
const initialState: AppState = {
    farms: [],
    selectedFarmId: null,
    pumps: [],
    sectors: [],
    sensors: [],
    sensorReadings: {},
    mqttConnected: false,
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

        case 'SET_MQTT_CONNECTED':
            return { ...state, mqttConnected: action.payload };

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
                const [farms, pumps, sectors, sensors, selectedFarmId] = await Promise.all([
                    StorageService.loadFarms(),
                    StorageService.loadPumps(),
                    StorageService.loadSectors(),
                    StorageService.loadSensors(),
                    StorageService.loadSelectedFarm(),
                ]);

                dispatch({ type: 'SET_FARMS', payload: farms });
                dispatch({ type: 'SET_PUMPS', payload: pumps });
                dispatch({ type: 'SET_SECTORS', payload: sectors });
                dispatch({ type: 'SET_SENSORS', payload: sensors });
                if (selectedFarmId) {
                    dispatch({ type: 'SELECT_FARM', payload: selectedFarmId });
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
        StorageService.saveSelectedFarm(state.selectedFarmId).catch(console.error);
    }, [state.selectedFarmId]);

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
