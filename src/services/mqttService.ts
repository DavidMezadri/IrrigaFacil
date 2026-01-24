import mqtt, { MqttClient } from 'mqtt';
import { MQTTConfig } from '../types';

export class MQTTService {
    private client: MqttClient | null = null;
    private config: MQTTConfig | null = null;
    private messageHandlers: Map<string, (topic: string, message: string) => void> = new Map();
    private connectionStatusCallback: ((connected: boolean) => void) | null = null;

    /**
     * Connect to MQTT broker
     */
    connect(config: MQTTConfig, onConnectionChange?: (connected: boolean) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.config = config;
                this.connectionStatusCallback = onConnectionChange || null;

                // Disconnect existing connection if any
                if (this.client) {
                    this.disconnect();
                }

                // Build broker URL - simple format
                const brokerUrl = config.brokerUrl.includes('://')
                    ? config.brokerUrl
                    : `mqtt://${config.brokerUrl}`;

                const fullUrl = `${brokerUrl}:${config.port}`;

                const options: mqtt.IClientOptions = {
                    clientId: config.clientId,
                    clean: true,
                    reconnectPeriod: 0, // Disable auto-reconnect to prevent infinite loop
                    connectTimeout: 10000, // 10 second timeout
                };

                if (config.username) {
                    options.username = config.username;
                }

                if (config.password) {
                    options.password = config.password;
                }

                console.log('Connecting to MQTT broker:', fullUrl);
                console.log('MQTT options:', { ...options, password: options.password ? '***' : undefined });
                this.client = mqtt.connect(fullUrl, options);

                this.client.on('connect', () => {
                    console.log('MQTT connected successfully');
                    if (this.connectionStatusCallback) {
                        this.connectionStatusCallback(true);
                    }
                    resolve();
                });

                this.client.on('error', (error) => {
                    console.error('MQTT connection error:', error);
                    if (this.connectionStatusCallback) {
                        this.connectionStatusCallback(false);
                    }
                    reject(error);
                });

                this.client.on('close', () => {
                    console.log('MQTT connection closed');
                    if (this.connectionStatusCallback) {
                        this.connectionStatusCallback(false);
                    }
                });

                this.client.on('offline', () => {
                    console.log('MQTT client offline');
                    if (this.connectionStatusCallback) {
                        this.connectionStatusCallback(false);
                    }
                });

                this.client.on('reconnect', () => {
                    console.log('MQTT reconnecting...');
                });

                // Timeout if connection doesn't succeed within 10 seconds
                setTimeout(() => {
                    if (this.client && !this.client.connected) {
                        const errorMsg = 'MQTT connection timeout. React Native/Expo requires WebSocket (ws:// or wss://). Direct MQTT (mqtt://) is not supported.';
                        console.error(errorMsg);
                        this.disconnect();
                        reject(new Error(errorMsg));
                    }
                }, 10000);

                // Message handler
                this.client.on('message', (topic, payload) => {
                    const message = payload.toString();
                    console.log('MQTT message received:', topic, message);

                    // Call all registered handlers
                    this.messageHandlers.forEach((handler) => {
                        handler(topic, message);
                    });
                });
            } catch (error) {
                console.error('Error connecting to MQTT:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from MQTT broker
     */
    disconnect(): void {
        if (this.client) {
            console.log('Disconnecting from MQTT broker');
            this.client.end(true);
            this.client = null;
            if (this.connectionStatusCallback) {
                this.connectionStatusCallback(false);
            }
        }
    }

    /**
     * Publish message to topic
     */
    publish(topic: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.client.connected) {
                reject(new Error('MQTT client not connected'));
                return;
            }

            this.client.publish(topic, message, { qos: 1 }, (error) => {
                if (error) {
                    console.error('Error publishing message:', error);
                    reject(error);
                } else {
                    console.log('Message published:', topic, message);
                    resolve();
                }
            });
        });
    }

    /**
     * Subscribe to topic
     */
    subscribe(topic: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.client.connected) {
                reject(new Error('MQTT client not connected'));
                return;
            }

            this.client.subscribe(topic, { qos: 1 }, (error) => {
                if (error) {
                    console.error('Error subscribing to topic:', error);
                    reject(error);
                } else {
                    console.log('Subscribed to topic:', topic);
                    resolve();
                }
            });
        });
    }

    /**
     * Unsubscribe from topic
     */
    unsubscribe(topic: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.client.connected) {
                reject(new Error('MQTT client not connected'));
                return;
            }

            this.client.unsubscribe(topic, (error) => {
                if (error) {
                    console.error('Error unsubscribing from topic:', error);
                    reject(error);
                } else {
                    console.log('Unsubscribed from topic:', topic);
                    resolve();
                }
            });
        });
    }

    /**
     * Register message handler
     */
    onMessage(handlerId: string, handler: (topic: string, message: string) => void): void {
        this.messageHandlers.set(handlerId, handler);
    }

    /**
     * Unregister message handler
     */
    offMessage(handlerId: string): void {
        this.messageHandlers.delete(handlerId);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.client !== null && this.client.connected;
    }

    /**
     * Get current config
     */
    getConfig(): MQTTConfig | null {
        return this.config;
    }
}

// Singleton instance
export const mqttService = new MQTTService();
