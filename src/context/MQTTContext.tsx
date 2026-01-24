import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { mqttService } from '../services/mqttService';
import { useApp } from './AppContext';
import { MQTTConfig } from '../types';
import { parseSensorDataMessage, parseCommandResponse, createCommandMessage } from '../utils/messageFormatter';

interface MQTTContextType {
    isConnected: boolean;
    connect: (config: MQTTConfig) => Promise<void>;
    disconnect: () => void;
    publishCommand: (type: 'pump' | 'sector', id: string, action: 'on' | 'off', topic: string) => Promise<void>;
    subscribeToSensor: (topic: string) => Promise<void>;
    subscribeToDeviceStatus: (topic: string) => Promise<void>;
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

export const MQTTProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, dispatch } = useApp();

    useEffect(() => {
        // Register message handler
        mqttService.onMessage('app', (topic, message) => {
            console.log('Processing MQTT message:', topic, message);

            // Try to parse as sensor data
            const sensorData = parseSensorDataMessage(message);
            if (sensorData) {
                // Find matching sensor
                const sensor = state.sensors.find(
                    (s) => s.id === sensorData.sensorId && s.farmId === sensorData.farmId
                );

                if (sensor) {
                    dispatch({
                        type: 'ADD_SENSOR_READING',
                        payload: {
                            sensorId: sensor.id,
                            reading: {
                                sensorId: sensor.id,
                                value: sensorData.value,
                                timestamp: sensorData.timestamp,
                            },
                        },
                    });
                }
                return;
            }

            // Try to parse as command response (device status update)
            const statusUpdate = parseCommandResponse(message);
            if (statusUpdate) {
                // Check if it's a pump
                const pump = state.pumps.find((p) => p.id === statusUpdate.id);
                if (pump) {
                    dispatch({
                        type: 'UPDATE_PUMP_STATUS',
                        payload: { id: statusUpdate.id, status: statusUpdate.status },
                    });
                    return;
                }

                // Check if it's a sector
                const sector = state.sectors.find((s) => s.id === statusUpdate.id);
                if (sector) {
                    dispatch({
                        type: 'UPDATE_SECTOR_STATUS',
                        payload: { id: statusUpdate.id, status: statusUpdate.status },
                    });
                    return;
                }
            }
        });

        return () => {
            mqttService.offMessage('app');
        };
    }, [state.sensors, state.pumps, state.sectors, dispatch]);

    // Auto-connect when farm is selected
    useEffect(() => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);

        if (selectedFarm) {
            connect(selectedFarm.mqttConfig).catch((error) => {
                console.error('Auto-connect failed:', error);
            });
        } else {
            disconnect();
        }
    }, [state.selectedFarmId, state.farms]);

    // Subscribe to all sensor topics when sensors change
    useEffect(() => {
        if (!mqttService.isConnected()) return;

        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) return;

        const farmSensors = state.sensors.filter((s) => s.farmId === selectedFarm.id);

        farmSensors.forEach((sensor) => {
            mqttService.subscribe(sensor.mqttTopic).catch((error) => {
                console.error(`Error subscribing to sensor ${sensor.name}:`, error);
            });
        });
    }, [state.sensors, state.selectedFarmId, state.farms]);

    const connect = async (config: MQTTConfig): Promise<void> => {
        try {
            await mqttService.connect(config, (connected) => {
                dispatch({ type: 'SET_MQTT_CONNECTED', payload: connected });
            });
        } catch (error) {
            console.error('MQTT connection error:', error);
            throw error;
        }
    };

    const disconnect = (): void => {
        mqttService.disconnect();
        dispatch({ type: 'SET_MQTT_CONNECTED', payload: false });
    };

    const publishCommand = async (
        type: 'pump' | 'sector',
        id: string,
        action: 'on' | 'off',
        topic: string
    ): Promise<void> => {
        if (!state.selectedFarmId) {
            throw new Error('No farm selected');
        }

        const message = createCommandMessage(state.selectedFarmId, type, id, action);
        await mqttService.publish(topic, JSON.stringify(message));

        // Optimistically update status
        if (type === 'pump') {
            dispatch({ type: 'UPDATE_PUMP_STATUS', payload: { id, status: action } });
        } else {
            dispatch({ type: 'UPDATE_SECTOR_STATUS', payload: { id, status: action } });
        }
    };

    const subscribeToSensor = async (topic: string): Promise<void> => {
        await mqttService.subscribe(topic);
    };

    const subscribeToDeviceStatus = async (topic: string): Promise<void> => {
        await mqttService.subscribe(topic);
    };

    const value: MQTTContextType = {
        isConnected: state.mqttConnected,
        connect,
        disconnect,
        publishCommand,
        subscribeToSensor,
        subscribeToDeviceStatus,
    };

    return <MQTTContext.Provider value={value}>{children}</MQTTContext.Provider>;
};

export const useMQTT = (): MQTTContextType => {
    const context = useContext(MQTTContext);
    if (!context) {
        throw new Error('useMQTT must be used within MQTTProvider');
    }
    return context;
};
