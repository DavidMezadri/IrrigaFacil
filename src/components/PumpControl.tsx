import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { StatusIndicator } from './StatusIndicator';
import { theme } from '../styles/theme';
import { Pump } from '../types';
import { useMQTT } from '../context/MQTTContext';

interface PumpControlProps {
    pump: Pump;
}

export const PumpControl: React.FC<PumpControlProps> = ({ pump }) => {
    const { publishCommand, isConnected } = useMQTT();
    const [loading, setLoading] = useState(false);

    const handleToggle = async (value: boolean) => {
        if (!isConnected) {
            Alert.alert('Erro', 'MQTT não conectado. Verifique a conexão.');
            return;
        }

        setLoading(true);
        try {
            const action = value ? 'on' : 'off';
            await publishCommand('pump', pump.id, action, pump.mqttTopic);
        } catch (error) {
            console.error('Error controlling pump:', error);
            Alert.alert('Erro', 'Falha ao controlar a bomba. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <StatusIndicator status={pump.status} size={16} />
                    <View style={styles.iconWrapper}>
                        <MaterialCommunityIcons name="pump" size={24} color={theme.colors.text} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{pump.name}</Text>
                        {pump.description && (
                            <Text style={styles.description}>{pump.description}</Text>
                        )}
                    </View>
                </View>
                <Switch
                    value={pump.status === 'on'}
                    onValueChange={handleToggle}
                    disabled={loading || !isConnected}
                    trackColor={{
                        false: theme.colors.backgroundLight,
                        true: theme.colors.primary,
                    }}
                    thumbColor={theme.colors.text}
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.topicLabel}>Tópico MQTT:</Text>
                <Text style={styles.topic}>{pump.mqttTopic}</Text>
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconWrapper: {
        marginLeft: theme.spacing.sm,
        marginRight: theme.spacing.xs,
    },
    textContainer: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    name: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    description: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    footer: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    topicLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginBottom: 2,
    },
    topic: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontFamily: 'monospace',
    },
});
