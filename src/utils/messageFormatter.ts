import { CommandMessage, SensorDataMessage, SensorType } from '../types';

/**
 * Create a command message for controlling pumps or sectors
 */
export const createCommandMessage = (
    farmId: string,
    type: 'pump' | 'sector',
    id: string,
    action: 'on' | 'off'
): CommandMessage => {
    return {
        farmId,
        type,
        id,
        action,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Parse incoming sensor data message
 */
export const parseSensorDataMessage = (
    message: string
): SensorDataMessage | null => {
    try {
        const data = JSON.parse(message);

        // Validate required fields
        if (
            !data.farmId ||
            !data.sensorType ||
            !data.sensorId ||
            data.value === undefined ||
            !data.unit ||
            !data.timestamp
        ) {
            console.warn('Invalid sensor data message format:', data);
            return null;
        }

        return data as SensorDataMessage;
    } catch (error) {
        console.error('Error parsing sensor data message:', error);
        return null;
    }
};

/**
 * Parse incoming command response/status message
 */
export const parseCommandResponse = (
    message: string
): { id: string; status: 'on' | 'off' } | null => {
    try {
        const data = JSON.parse(message);

        if (!data.id || !data.status) {
            console.warn('Invalid command response format:', data);
            return null;
        }

        return {
            id: data.id,
            status: data.status,
        };
    } catch (error) {
        console.error('Error parsing command response:', error);
        return null;
    }
};

/**
 * Convert sensor type to display name
 */
export const getSensorTypeName = (type: SensorType): string => {
    const names: Record<SensorType, string> = {
        humidity: 'Umidade do Ar',
        temperature: 'Temperatura',
        wind: 'Vento',
        rain: 'Chuva',
        soilMoisture: 'Umidade do Solo',
        pressure: 'Pressão Atmosférica',
        custom: 'Personalizado',
    };

    return names[type] || type;
};

/**
 * Get default unit for sensor type
 */
export const getDefaultUnit = (type: SensorType): string => {
    const units: Record<SensorType, string> = {
        humidity: '%',
        temperature: '°C',
        wind: 'km/h',
        rain: 'mm',
        soilMoisture: '%',
        pressure: 'hPa',
        custom: '',
    };

    return units[type] || '';
};

/**
 * Format sensor value for display
 */
export const formatSensorValue = (value: number, unit: string): string => {
    return `${value.toFixed(1)} ${unit}`;
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
