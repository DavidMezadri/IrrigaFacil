import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { mqttService } from '../services/mqttService';
import { useApp } from './AppContext';
import { MQTTConfig, Schedule, NodeSyncPayload, LogEntry, LogLevel } from '../types';
import { parseSensorDataMessage, parseCommandResponse } from '../utils/messageFormatter';
import { dbService, LogCategory } from '../services/dbService';

export type SyncStatus = 'idle' | 'pending' | 'done' | 'error';

interface MQTTContextType {
    isConnected: boolean;
    syncStatus: SyncStatus;
    connect: (config: MQTTConfig) => Promise<void>;
    disconnect: () => void;
    publishCommand: (equipType: 'pump' | 'sector', equipament: string, action: 'on' | 'off', topic: string, opts?: { nodeId?: number; stop?: string }) => Promise<void>;
    publishGpioCommand: (
        mqttAction: 'create' | 'update' | 'delete' | 'deleteAll' | 'getAll',
        equipType: 'pump' | 'sector',
        equipament: string,
        topic: string,
        farmName: string,
        opts?: { nodeId?: number; gpioPin?: number; newName?: string }
    ) => Promise<void>;
    publishSchedule: (mqttAction: 'create' | 'update' | 'getAll' | 'deleteAll', schedule: Schedule, topic: string) => Promise<void>;
    publishDeleteSchedule: (scheduleId: string, topic: string) => Promise<void>;
    publishGetAll: () => Promise<void>;
    subscribeToSensor: (topic: string) => Promise<void>;
    subscribeToDeviceStatus: (topic: string) => Promise<void>;
    publishDeleteAllGpios: () => Promise<void>;
    publishDeleteAllSchedules: () => Promise<void>;
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

export const MQTTProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, dispatch } = useApp();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

    useEffect(() => {
        // Register message handler
        mqttService.onMessage('app', (topic, message) => {
            console.log('Processing MQTT message:', topic, message.substring(0, 200));

            // ── parse JSON first (needed for all subsequent checks) ───────────
            let parsed: any = null;
            try {
                parsed = JSON.parse(message);
            } catch { /* not JSON — may be a plain-text log */ }

            const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);

            // ── getAll response — checked BEFORE log topic so it works on any topic ──
            if (parsed?.type === 'response' && parsed?.action === 'getAll') {
                if (!selectedFarm) return;

                const payload = parsed.payload ?? {};

                // Accept partial payloads: gpios-only OR schedules-only
                const partialData: NodeSyncPayload = {};
                if (Array.isArray(payload.gpios)) partialData.gpios = payload.gpios;
                if (Array.isArray(payload.schedules)) partialData.schedules = payload.schedules;

                // Only dispatch if there is something useful (even if empty arrays)
                if (partialData.gpios !== undefined || partialData.schedules !== undefined) {
                    dispatch({
                        type: 'SYNC_FROM_NODE',
                        payload: { farmId: selectedFarm.id, data: partialData },
                    });
                    setSyncStatus('done');
                    setTimeout(() => setSyncStatus('idle'), 3000);
                    console.log('[MQTT] SYNC_FROM_NODE dispatched — gpios:',
                        partialData.gpios?.length ?? 0, 'schedules:', partialData.schedules?.length ?? 0);
                }
                return;
            }

            // ── log topic messages ───────────────────────────────────────────
            if (selectedFarm?.mqttLogTopic && topic === selectedFarm.mqttLogTopic) {
                let level: LogLevel = 'info';
                let text = message;
                let category: LogCategory = 'MQTT';

                if (parsed) {
                    text = parsed.message ?? parsed.msg ?? parsed.log ?? message;

                    if (['info', 'warn', 'error', 'debug'].includes(parsed.level)) {
                        level = parsed.level === 'debug' ? 'info' : parsed.level as LogLevel;
                    }
                    if (['INFO', 'WARN', 'ERROR', 'SUCCESS'].includes(parsed.level)) {
                        level = parsed.level as LogLevel;
                    }

                    if (parsed.category && ['MQTT', 'SYSTEM', 'USER_ACTION', 'AUTOMATION'].includes(parsed.category)) {
                        category = parsed.category as LogCategory;
                    }
                }

                const entry: LogEntry = {
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: new Date().toISOString(),
                    level,
                    message: text,
                    topic,
                };

                // Dispatch to volatile store (AsyncStorage redux simulation)
                dispatch({ type: 'ADD_LOG_ENTRY', payload: entry });

                // Persist to the SQLite structural database for fast queries
                dbService.insertLog(selectedFarm.id, level === 'info' ? 'INFO' : (level === 'warn' ? 'WARN' : (level === 'error' ? 'ERROR' : 'INFO')), category, text)
                    .catch(e => console.error("Falha silenciosa ao gravar log no Sqlite:", e));

                // ── Auto-toggle off UI buttons when timer ends ───────────────
                // Regex matches: "Timer encerrado: sector 'Setor1' desligado (nó 2)"
                const timerEndRegex = /Timer encerrado: (pump|sector) '([^']+)' desligado/;
                const match = text.match(timerEndRegex);

                if (match) {
                    const equipType = match[1]; // 'pump' or 'sector'
                    const equipName = match[2]; // e.g. 'Setor1'

                    if (equipType === 'pump') {
                        const pump = state.pumps.find(p => p.name === equipName && p.farmId === selectedFarm.id);
                        if (pump) {
                            dispatch({ type: 'UPDATE_PUMP_STATUS', payload: { id: pump.id, status: 'off' } });
                            console.log(`[MQTT Auto-parser] Toggled OFF Pump UI: ${equipName}`);
                        }
                    } else if (equipType === 'sector') {
                        const sector = state.sectors.find(s => s.name === equipName && s.farmId === selectedFarm.id);
                        if (sector) {
                            dispatch({ type: 'UPDATE_SECTOR_STATUS', payload: { id: sector.id, status: 'off' } });
                            console.log(`[MQTT Auto-parser] Toggled OFF Sector UI: ${equipName}`);
                        }
                    }
                }

                return;
            }

            // Not JSON and not log topic — nothing to do
            if (!parsed) return;

            // ── sensor data ──────────────────────────────────────────────────
            const sensorData = parseSensorDataMessage(message);
            if (sensorData) {
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

            // ── device status update ─────────────────────────────────────────
            const statusUpdate = parseCommandResponse(message);
            if (statusUpdate) {
                const pump = state.pumps.find((p) => p.id === statusUpdate.id);
                if (pump) {
                    dispatch({ type: 'UPDATE_PUMP_STATUS', payload: { id: statusUpdate.id, status: statusUpdate.status } });
                    return;
                }
                const sector = state.sectors.find((s) => s.id === statusUpdate.id);
                if (sector) {
                    dispatch({ type: 'UPDATE_SECTOR_STATUS', payload: { id: statusUpdate.id, status: statusUpdate.status } });
                }
            }
        });

        return () => {
            mqttService.offMessage('app');
        };
    }, [state.sensors, state.pumps, state.sectors, state.farms, state.selectedFarmId, dispatch]);

    // Bootstrap cleanup task on mount
    useEffect(() => {
        dbService.clearOldLogs(7).catch(e => console.warn("Failed to clear old logs", e));
    }, []);

    // Auto-connect when broker config is available
    useEffect(() => {
        if (state.brokerConfig) {
            connect(state.brokerConfig).catch((error) => {
                console.warn('Auto-connect failed:', error);
            });
        } else {
            disconnect();
        }
    }, [state.brokerConfig]);

    // Auto-reconnect every 5 s when disconnected
    const isReconnectingRef = useRef(false);
    useEffect(() => {
        if (state.mqttConnected || !state.brokerConfig) return;

        const intervalId = setInterval(async () => {
            if (isReconnectingRef.current) return;
            isReconnectingRef.current = true;
            console.log('[MQTT] Attempting auto-reconnect...');
            try {
                await connect(state.brokerConfig!);
            } catch (e) {
                console.warn('[MQTT] Auto-reconnect failed:', e);
            } finally {
                isReconnectingRef.current = false;
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [state.mqttConnected, state.brokerConfig]);

    // Subscribe to farm topic + log topic
    useEffect(() => {
        if (!mqttService.isConnected()) return;
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) return;
        mqttService.subscribe(selectedFarm.mqttTopic).catch((error) => {
            console.error('Error subscribing to farm topic:', error);
        });
        if (selectedFarm.mqttLogTopic) {
            mqttService.subscribe(selectedFarm.mqttLogTopic).catch((error) => {
                console.error('Error subscribing to log topic:', error);
            });
        }
    }, [state.selectedFarmId, state.farms, state.mqttConnected]);

    const connect = async (config: MQTTConfig): Promise<void> => {
        try {
            await mqttService.connect(config, (connected) => {
                dispatch({ type: 'SET_MQTT_CONNECTED', payload: connected });
            });
        } catch (error) {
            console.warn('MQTT connection error:', error);
        }
    };

    const disconnect = (): void => {
        mqttService.disconnect();
        dispatch({ type: 'SET_MQTT_CONNECTED', payload: false });
    };

    /**
     * Publish on/off command to a pump or sector.
     */
    const publishCommand = async (
        equipType: 'pump' | 'sector',
        equipament: string,
        action: 'on' | 'off',
        topic: string,
        opts?: { nodeId?: number; stop?: string }
    ): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');

        const message = {
            farmId: selectedFarm.name,
            type: 'command',
            action: equipType,
            timestamp: getTimestamp(),
            payload: {
                nodeId: opts?.nodeId ?? 1,
                type: '',
                equipament,
                state: action,
                start: '',
                stop: opts?.stop ?? '',
            },
        };
        await mqttService.publish(topic, JSON.stringify(message));

        // Optimistically update status
        const device = equipType === 'pump'
            ? state.pumps.find((p) => p.name === equipament)
            : state.sectors.find((s) => s.name === equipament);
        if (device) {
            if (equipType === 'pump') {
                dispatch({ type: 'UPDATE_PUMP_STATUS', payload: { id: device.id, status: action } });
            } else {
                dispatch({ type: 'UPDATE_SECTOR_STATUS', payload: { id: device.id, status: action } });
            }
        }
    };

    /**
     * Publish GPIO create/update/delete/getAll command.
     */
    const publishGpioCommand = async (
        mqttAction: 'create' | 'update' | 'delete' | 'deleteAll' | 'getAll',
        equipType: 'pump' | 'sector',
        equipament: string,
        topic: string,
        farmName: string,
        opts?: { nodeId?: number; gpioPin?: number; newName?: string }
    ): Promise<void> => {
        const message = {
            farmId: farmName,
            type: 'command',
            action: mqttAction,
            timestamp: getTimestamp(),
            payload: {
                nodeId: opts?.nodeId ?? 1,
                type: equipType,
                equipament,
                state: '',
                start: opts?.gpioPin !== undefined ? String(opts.gpioPin) : '',
                stop: opts?.newName ?? '',
            },
        };
        await mqttService.publish(topic, JSON.stringify(message));
        console.log('[MQTT] GPIO command sent:', JSON.stringify(message, null, 2));
    };

    /**
     * Send getAll for GPIOs and Schedules — triggers node response.
     */
    const publishGetAll = async (): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');
        if (!mqttService.isConnected()) throw new Error('MQTT not connected');

        setSyncStatus('pending');

        const topic = selectedFarm.mqttTopic;
        const farmName = selectedFarm.name;

        // Send GPIO getAll
        const gpioMsg = {
            farmId: farmName,
            type: 'command',
            action: 'getAll',
            timestamp: getTimestamp(),
            payload: { nodeId: 1, type: '', equipament: '', state: '', start: '', stop: '' },
        };
        await mqttService.publish(topic, JSON.stringify(gpioMsg));

        // Send Schedule getAll
        const schedMsg = {
            farmId: farmName,
            type: 'schedule',
            action: 'getAll',
            timestamp: getTimestamp(),
            payload: { scheduleId: '', enabled: true, actions: [{ nodeId: 1, type: '', equipament: '', state: '', start: '', stop: '' }] },
        };
        await mqttService.publish(topic, JSON.stringify(schedMsg));

        console.log('[MQTT] getAll commands sent');

        // Timeout — if no response in 10 s mark as error
        setTimeout(() => {
            setSyncStatus((prev) => (prev === 'pending' ? 'error' : prev));
        }, 10000);
    };

    /**
     * Send deleteAll for GPIOs
     */
    const publishDeleteAllGpios = async (): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');
        if (!mqttService.isConnected()) throw new Error('MQTT not connected');

        const topic = selectedFarm.mqttTopic;
        const farmName = selectedFarm.name;

        const message = {
            farmId: farmName,
            type: 'command',
            action: 'deleteAll',
            timestamp: getTimestamp(),
            payload: {
                nodeId: 1,
                type: '',
                equipament: '',
                state: '',
                start: '',
                stop: ''
            }
        };
        await mqttService.publish(topic, JSON.stringify(message));
        console.log('[MQTT] deleteAll GPIOs sent');
    };

    /**
     * Send deleteAll for Schedules
     */
    const publishDeleteAllSchedules = async (): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');
        if (!mqttService.isConnected()) throw new Error('MQTT not connected');

        const topic = selectedFarm.mqttTopic;
        const farmName = selectedFarm.name;

        const message = {
            farmId: farmName,
            type: 'schedule',
            action: 'deleteAll',
            timestamp: getTimestamp(),
            payload: {
                scheduleId: '',
                enabled: true,
                actions: [
                    {
                        nodeId: 1,
                        type: '',
                        equipament: '',
                        state: '',
                        start: '',
                        stop: ''
                    }
                ]
            }
        };
        await mqttService.publish(topic, JSON.stringify(message));
        console.log('[MQTT] deleteAll Schedules sent');
    };

    /**
     * Format timestamp as DD-MM-YYYYTHH:MM
     */
    const getTimestamp = (): string => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}-${mm}-${yyyy}T${hh}:${min}`;
    };

    /**
     * Publish schedule command (create / update / getAll / deleteAll)
     */
    const publishSchedule = async (
        mqttAction: 'create' | 'update' | 'getAll' | 'deleteAll',
        schedule: Schedule,
        topic: string
    ): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');

        const message = {
            farmId: selectedFarm.name,
            type: 'schedule',
            action: mqttAction,
            timestamp: getTimestamp(),
            payload: {
                scheduleId: schedule.scheduleId,
                enabled: schedule.enabled,
                actions: schedule.actions,
            },
        };
        await mqttService.publish(topic, JSON.stringify(message));
    };

    /**
     * Publish schedule delete command
     */
    const publishDeleteSchedule = async (scheduleId: string, topic: string): Promise<void> => {
        const selectedFarm = state.farms.find((f) => f.id === state.selectedFarmId);
        if (!selectedFarm) throw new Error('No farm selected');

        const message = {
            farmId: selectedFarm.name,
            type: 'schedule',
            action: 'delete',
            timestamp: getTimestamp(),
            payload: { scheduleId },
        };
        await mqttService.publish(topic, JSON.stringify(message));
    };

    const subscribeToSensor = async (topic: string): Promise<void> => {
        await mqttService.subscribe(topic);
    };

    const subscribeToDeviceStatus = async (topic: string): Promise<void> => {
        await mqttService.subscribe(topic);
    };

    return (
        <MQTTContext.Provider
            value={{
                isConnected: state.mqttConnected,
                syncStatus,
                connect,
                disconnect,
                publishCommand,
                publishGpioCommand,
                publishSchedule,
                publishDeleteSchedule,
                publishGetAll,
                publishDeleteAllGpios,
                publishDeleteAllSchedules,
                subscribeToSensor,
                subscribeToDeviceStatus,
            }}
        >
            {children}
        </MQTTContext.Provider>
    );
};

export const useMQTT = (): MQTTContextType => {
    const context = useContext(MQTTContext);
    if (!context) throw new Error('useMQTT must be used within MQTTProvider');
    return context;
};
