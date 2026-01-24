import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { theme } from '../styles/theme';
import { Sensor, SensorReading } from '../types';
import { getSensorTypeName, formatSensorValue } from '../utils/messageFormatter';

interface SensorCardProps {
    sensor: Sensor;
    latestReading: SensorReading | null;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensor, latestReading }) => {
    const getSensorColor = () => {
        switch (sensor.type) {
            case 'humidity':
                return theme.colors.sensorHumidity;
            case 'temperature':
                return theme.colors.sensorTemperature;
            case 'wind':
                return theme.colors.sensorWind;
            case 'rain':
                return theme.colors.sensorRain;
            case 'soilMoisture':
                return theme.colors.sensorSoilMoisture;
            case 'pressure':
                return theme.colors.sensorPressure;
            default:
                return theme.colors.sensorCustom;
        }
    };

    const getTimeAgo = (timestamp: string): string => {
        const now = new Date();
        const readingTime = new Date(timestamp);
        const diffMs = now.getTime() - readingTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}m atrás`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d atrás`;
    };

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getSensorColor() }]}>
                    <MaterialCommunityIcons
                        name={
                            sensor.type === 'humidity' ? 'water-percent' :
                                sensor.type === 'temperature' ? 'thermometer' :
                                    sensor.type === 'wind' ? 'weather-windy' :
                                        sensor.type === 'rain' ? 'weather-pouring' :
                                            sensor.type === 'soilMoisture' ? 'sprout' :
                                                sensor.type === 'pressure' ? 'gauge' : 'access-point'
                        }
                        size={24}
                        color="#FFF"
                    />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.sensorName}>{sensor.name}</Text>
                    <Text style={styles.sensorType}>{getSensorTypeName(sensor.type)}</Text>
                </View>
            </View>

            {latestReading ? (
                <View style={styles.readingContainer}>
                    <Text style={styles.value}>
                        {formatSensorValue(latestReading.value, sensor.unit)}
                    </Text>
                    <Text style={styles.timestamp}>
                        {getTimeAgo(latestReading.timestamp)}
                    </Text>
                </View>
            ) : (
                <View style={styles.readingContainer}>
                    <Text style={styles.noData}>Sem dados</Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    headerText: {
        flex: 1,
    },
    sensorName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    sensorType: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    readingContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    value: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: 4,
    },
    timestamp: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
    },
    noData: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        fontStyle: 'italic',
    },
});
