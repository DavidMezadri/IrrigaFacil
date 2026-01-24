import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { StatusIndicator } from './StatusIndicator';
import { theme } from '../styles/theme';
import { Sector } from '../types';
import { useMQTT } from '../context/MQTTContext';

interface SectorControlProps {
    sector: Sector;
}

export const SectorControl: React.FC<SectorControlProps> = ({ sector }) => {
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
            await publishCommand('sector', sector.id, action, sector.mqttTopic);
        } catch (error) {
            console.error('Error controlling sector:', error);
            Alert.alert('Erro', 'Falha ao controlar o setor. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <StatusIndicator status={sector.status} size={16} />
                    <View style={styles.iconWrapper}>
                        <MaterialCommunityIcons name="faucet" size={24} color={theme.colors.text} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{sector.name}</Text>
                        {sector.description && (
                            <Text style={styles.description}>{sector.description}</Text>
                        )}
                        {sector.area && (
                            <Text style={styles.area}>{sector.area} hectares</Text>
                        )}
                    </View>
                </View>
                <Switch
                    value={sector.status === 'on'}
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
                <Text style={styles.topic}>{sector.mqttTopic}</Text>
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
    area: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
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
