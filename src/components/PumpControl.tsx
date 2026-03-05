import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { StatusIndicator } from './StatusIndicator';
import { theme } from '../styles/theme';
import { Pump } from '../types';
import { useMQTT } from '../context/MQTTContext';
import { useApp } from '../context/AppContext';
import { TimerModal } from './TimerModal';

interface PumpControlProps {
    pump: Pump;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const PumpControl: React.FC<PumpControlProps> = ({ pump, onEdit, onDelete }) => {
    const { publishCommand, isConnected } = useMQTT();
    const { getSelectedFarm } = useApp();
    const [loading, setLoading] = useState(false);
    const [isTimerVisible, setIsTimerVisible] = useState(false);
    const selectedFarm = getSelectedFarm();

    const executeCommand = async (action: 'on' | 'off', stopParameter?: string | number) => {
        if (!isConnected) {
            Alert.alert('Erro', 'MQTT não conectado. Verifique a conexão.');
            return;
        }
        if (!selectedFarm) {
            Alert.alert('Erro', 'Nenhuma fazenda selecionada.');
            return;
        }

        setLoading(true);
        try {
            const opts: any = { nodeId: pump.nodeId };
            if (stopParameter !== undefined) {
                opts.stop = stopParameter.toString();
            }
            await publishCommand('pump', pump.name, action, selectedFarm.mqttTopic, opts);
        } catch (error) {
            console.error('Error controlling pump:', error);
            Alert.alert('Erro', 'Falha ao controlar a bomba. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (value: boolean) => {
        if (value) {
            // Turning ON: show timer modal
            setIsTimerVisible(true);
        } else {
            // Turning OFF: execute immediately
            executeCommand('off');
        }
    };

    const handleTimerConfirm = (stopParameter?: string | number) => {
        setIsTimerVisible(false);
        executeCommand('on', stopParameter);
    };

    return (
        <Card style={styles.card}>
            {/* Header: status + info + switch */}
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
                        {pump.nodeId !== undefined && (
                            <Text style={styles.meta}>
                                Node {pump.nodeId}{pump.gpioPin !== undefined ? ` · GPIO ${pump.gpioPin}` : ''}
                            </Text>
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

            {/* Footer: topic + actions */}
            <View style={styles.footer}>
                {selectedFarm && (
                    <Text style={styles.topic} numberOfLines={1}>
                        📡 {selectedFarm.mqttTopic}
                    </Text>
                )}
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                            <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.secondary} />
                            <Text style={styles.editText}>Editar</Text>
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.error} />
                            <Text style={styles.deleteText}>Excluir</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TimerModal
                visible={isTimerVisible}
                onClose={() => setIsTimerVisible(false)}
                onConfirm={handleTimerConfirm}
                deviceName={pump.name}
            />
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
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
    meta: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topic: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        fontFamily: 'monospace',
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.backgroundLight,
    },
    editText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    deleteText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        fontWeight: theme.fontWeight.medium,
    },
});
