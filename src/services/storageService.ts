import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm, Pump, Sector, Sensor } from '../types';

const STORAGE_KEYS = {
    FARMS: '@IrrigaFacil:farms',
    PUMPS: '@IrrigaFacil:pumps',
    SECTORS: '@IrrigaFacil:sectors',
    SENSORS: '@IrrigaFacil:sensors',
    SELECTED_FARM: '@IrrigaFacil:selectedFarm',
};

// Farm operations
export const saveFarms = async (farms: Farm[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    } catch (error) {
        console.error('Error saving farms:', error);
        throw error;
    }
};

export const loadFarms = async (): Promise<Farm[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FARMS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading farms:', error);
        return [];
    }
};

// Pump operations
export const savePumps = async (pumps: Pump[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.PUMPS, JSON.stringify(pumps));
    } catch (error) {
        console.error('Error saving pumps:', error);
        throw error;
    }
};

export const loadPumps = async (): Promise<Pump[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.PUMPS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading pumps:', error);
        return [];
    }
};

// Sector operations
export const saveSectors = async (sectors: Sector[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
    } catch (error) {
        console.error('Error saving sectors:', error);
        throw error;
    }
};

export const loadSectors = async (): Promise<Sector[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SECTORS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading sectors:', error);
        return [];
    }
};

// Sensor operations
export const saveSensors = async (sensors: Sensor[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SENSORS, JSON.stringify(sensors));
    } catch (error) {
        console.error('Error saving sensors:', error);
        throw error;
    }
};

export const loadSensors = async (): Promise<Sensor[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SENSORS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading sensors:', error);
        return [];
    }
};

// Selected farm
export const saveSelectedFarm = async (farmId: string | null): Promise<void> => {
    try {
        if (farmId) {
            await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_FARM, farmId);
        } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_FARM);
        }
    } catch (error) {
        console.error('Error saving selected farm:', error);
        throw error;
    }
};

export const loadSelectedFarm = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FARM);
    } catch (error) {
        console.error('Error loading selected farm:', error);
        return null;
    }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
};
