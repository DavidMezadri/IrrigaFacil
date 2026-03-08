// Type definitions for the Farm Irrigation Control App

export interface Farm {
  id: string;
  name: string;
  location?: string;
  mqttTopic: string;         // command/data topic
  mqttLogTopic?: string;     // log/debug topic — phone subscribes and keeps messages
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
  nodeId?: number;
  gpioPin?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  farmId: string;
  name: string;
  description?: string;
  status: DeviceStatus;
  area?: number; // in hectares
  nodeId?: number;
  gpioPin?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sensor {
  id: string;
  farmId: string;
  name: string;
  type: SensorType;
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

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;   // ISO string
  level: LogLevel;
  message: string;
  topic?: string;      // origin topic
}

export type SensorType =
  | 'humidity'
  | 'temperature'
  | 'wind'
  | 'rain'
  | 'soilMoisture'
  | 'pressure'
  | 'custom';

// Schedule types
export interface ScheduleAction {
  nodeId: number;
  type: 'pump' | 'sector';
  equipament: string;
  state: 'on' | 'off';
  start: string; // HH:MM
  stop: string;  // HH:MM or seconds as string
}

export interface Schedule {
  scheduleId: string;
  farmId: string;
  enabled: boolean;
  actions: ScheduleAction[];
  createdAt: string;
  updatedAt: string;
}

// MQTT Message formats
export interface CommandMessage {
  farmId: string;
  type: 'pump' | 'sector';
  id: string;
  action: 'on' | 'off';
  timestamp: string;
}

/** Single GPIO entry returned by the node in a getAll response */
export interface NodeGpio {
  nodeId: number;
  type: 'pump' | 'sector';
  equipament: string; // name
  pin: number;        // GPIO pin
}

/** Full payload inside a `type:"response"` / `action:"getAll"` MQTT message */
export interface NodeSyncPayload {
  gpios?: NodeGpio[];
  schedules?: Array<{
    scheduleId: string;
    enabled: boolean;
    actions: Array<{
      nodeId: number;
      type: 'pump' | 'sector';
      equipament: string;
      state: 'on' | 'off';
      start: string;
      stop: string;
    }>;
  }>;
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
  schedules: Schedule[];
  mqttConnected: boolean;
  logEntries: LogEntry[];  // log messages from the log topic
  brokerConfig: MQTTConfig | null;
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
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: Schedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'TOGGLE_SCHEDULE_ENABLED'; payload: { scheduleId: string; enabled: boolean } }
  | { type: 'SYNC_FROM_NODE'; payload: { farmId: string; data: NodeSyncPayload } }
  | { type: 'ADD_LOG_ENTRY'; payload: LogEntry }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_MQTT_CONNECTED'; payload: boolean }
  | { type: 'SET_BROKER_CONFIG'; payload: MQTTConfig | null };
