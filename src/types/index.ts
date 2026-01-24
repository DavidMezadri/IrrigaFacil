// Type definitions for the Farm Irrigation Control App

export interface Farm {
  id: string;
  name: string;
  location?: string;
  mqttConfig: MQTTConfig;
  createdAt: string;
  updatedAt: string;
}

export interface MQTTConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  clientId: string;
}

export interface Pump {
  id: string;
  farmId: string;
  name: string;
  description?: string;
  status: DeviceStatus;
  mqttTopic: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  farmId: string;
  name: string;
  description?: string;
  status: DeviceStatus;
  mqttTopic: string;
  area?: number; // in hectares
  createdAt: string;
  updatedAt: string;
}

export interface Sensor {
  id: string;
  farmId: string;
  name: string;
  type: SensorType;
  mqttTopic: string;
  unit: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  sensorId: string;
  value: number;
  timestamp: string;
}

export type DeviceStatus = 'on' | 'off' | 'unknown';

export type SensorType = 
  | 'humidity'
  | 'temperature'
  | 'wind'
  | 'rain'
  | 'soilMoisture'
  | 'pressure'
  | 'custom';

// MQTT Message formats
export interface CommandMessage {
  farmId: string;
  type: 'pump' | 'sector';
  id: string;
  action: 'on' | 'off';
  timestamp: string;
}

export interface SensorDataMessage {
  farmId: string;
  sensorType: SensorType;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: string;
}

// App State
export interface AppState {
  farms: Farm[];
  selectedFarmId: string | null;
  pumps: Pump[];
  sectors: Sector[];
  sensors: Sensor[];
  sensorReadings: { [sensorId: string]: SensorReading[] };
  mqttConnected: boolean;
}

export type AppAction =
  | { type: 'SET_FARMS'; payload: Farm[] }
  | { type: 'ADD_FARM'; payload: Farm }
  | { type: 'UPDATE_FARM'; payload: Farm }
  | { type: 'DELETE_FARM'; payload: string }
  | { type: 'SELECT_FARM'; payload: string | null }
  | { type: 'SET_PUMPS'; payload: Pump[] }
  | { type: 'ADD_PUMP'; payload: Pump }
  | { type: 'UPDATE_PUMP'; payload: Pump }
  | { type: 'DELETE_PUMP'; payload: string }
  | { type: 'UPDATE_PUMP_STATUS'; payload: { id: string; status: DeviceStatus } }
  | { type: 'SET_SECTORS'; payload: Sector[] }
  | { type: 'ADD_SECTOR'; payload: Sector }
  | { type: 'UPDATE_SECTOR'; payload: Sector }
  | { type: 'DELETE_SECTOR'; payload: string }
  | { type: 'UPDATE_SECTOR_STATUS'; payload: { id: string; status: DeviceStatus } }
  | { type: 'SET_SENSORS'; payload: Sensor[] }
  | { type: 'ADD_SENSOR'; payload: Sensor }
  | { type: 'UPDATE_SENSOR'; payload: Sensor }
  | { type: 'DELETE_SENSOR'; payload: string }
  | { type: 'ADD_SENSOR_READING'; payload: { sensorId: string; reading: SensorReading } }
  | { type: 'SET_MQTT_CONNECTED'; payload: boolean };
