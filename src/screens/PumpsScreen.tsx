import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { PumpControl } from '../components/PumpControl';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { useMQTT } from '../context/MQTTContext';
import { Pump } from '../types';

type Props = NativeStackScreenProps<any, 'Pumps'>;

export const PumpsScreen: React.FC<Props> = ({ navigation }) => {
    const { state, getSelectedFarm, getFarmPumps, dispatch } = useApp();
    const selectedFarm = getSelectedFarm();
    const { isConnected, publishGpioCommand } = useMQTT();

    if (!selectedFarm) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Nenhuma fazenda selecionada</Text>
            </View>
        );
    }

    const pumps = getFarmPumps(selectedFarm.id);

    const handleDelete = (pump: Pump) => {
        Alert.alert('Confirmar Exclusão', 'Deseja excluir esta bomba?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    dispatch({ type: 'DELETE_PUMP', payload: pump.id });
                    if (isConnected && selectedFarm) {
                        const topic = selectedFarm.mqttTopic;
                        try {
                            await publishGpioCommand('delete', 'pump', pump.name, topic, selectedFarm.name, {
                                nodeId: pump.nodeId,
                            });
                        } catch (e) {
                            console.error('MQTT GPIO delete error:', e);
                        }
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Bombas</Text>
                <View style={styles.connectionInfo}>
                    <Text style={styles.subtitle}>{selectedFarm.name}</Text>
                    <View style={styles.connectionStatus}>
                        <StatusIndicator status={isConnected ? 'connected' : 'disconnected'} />
                        <Text style={styles.connectionText}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={pumps}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PumpControl
                        pump={item}
                        onEdit={() => navigation.navigate('PumpForm', { pumpId: item.id })}
                        onDelete={() => handleDelete(item)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhuma bomba cadastrada</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
                <Button
                    title="➕ Adicionar Bomba"
                    onPress={() => {
                        if (!isConnected) {
                            Alert.alert('Sem conexão', 'Conecte ao broker MQTT antes de adicionar uma bomba.');
                            return;
                        }
                        navigation.navigate('PumpForm', {});
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    emptyContainer: {
        padding: theme.spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    connectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    syncBtn: {
        marginRight: theme.spacing.xs,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectionText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
});
