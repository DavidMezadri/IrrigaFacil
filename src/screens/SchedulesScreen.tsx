import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useMQTT } from '../context/MQTTContext';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { theme } from '../styles/theme';
import { Schedule } from '../types';

type Props = NativeStackScreenProps<any, 'Schedules'>;

export const SchedulesScreen: React.FC<Props> = ({ navigation }) => {
    const { state, getSelectedFarm, getFarmSchedules, dispatch } = useApp();
    const { isConnected, publishSchedule, publishDeleteSchedule } = useMQTT();
    const selectedFarm = getSelectedFarm();

    if (!selectedFarm) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Nenhuma fazenda selecionada</Text>
            </View>
        );
    }

    const schedules = getFarmSchedules(selectedFarm.id);
    const mqttTopic = selectedFarm.mqttTopic;

    const handleToggleEnabled = async (schedule: Schedule) => {
        const updated: Schedule = {
            ...schedule,
            enabled: !schedule.enabled,
            updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'TOGGLE_SCHEDULE_ENABLED', payload: { scheduleId: schedule.scheduleId, enabled: updated.enabled } });
        if (isConnected) {
            try {
                await publishSchedule('update', updated, mqttTopic);
            } catch (e) {
                console.error('MQTT publish error:', e);
            }
        }
    };

    const handleDelete = (schedule: Schedule) => {
        Alert.alert('Confirmar Exclusão', `Deseja excluir o schedule "${schedule.scheduleId}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    dispatch({ type: 'DELETE_SCHEDULE', payload: schedule.scheduleId });
                    if (isConnected) {
                        try {
                            await publishDeleteSchedule(schedule.scheduleId, mqttTopic);
                        } catch (e) {
                            console.error('MQTT publish error:', e);
                        }
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: Schedule }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <MaterialCommunityIcons
                        name="calendar-clock"
                        size={20}
                        color={item.enabled ? theme.colors.primary : theme.colors.textMuted}
                        style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>{item.scheduleId}</Text>
                </View>
                <Switch
                    value={item.enabled}
                    onValueChange={() => handleToggleEnabled(item)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryDark }}
                    thumbColor={item.enabled ? theme.colors.primary : theme.colors.textMuted}
                />
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.actionsCount}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.colors.warning} />
                    {'  '}{item.actions.length} {item.actions.length === 1 ? 'action' : 'actions'}
                </Text>
                {item.actions.map((action, idx) => (
                    <View key={idx} style={styles.actionRow}>
                        <MaterialCommunityIcons
                            name={action.type === 'pump' ? 'pump' : 'faucet'}
                            size={14}
                            color={theme.colors.secondary}
                        />
                        <Text style={styles.actionText}>
                            {' '}{action.equipament} · {action.start} → {action.stop}
                            {isNaN(Number(action.stop)) ? '' : 's'}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ScheduleForm', { scheduleId: item.scheduleId })}
                >
                    <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.secondary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.secondary }]}> Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.error} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error }]}> Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Schedules</Text>
                <View style={styles.headerRight}>
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
                data={schedules}
                keyExtractor={(item) => item.scheduleId}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="calendar-blank" size={64} color={theme.colors.border} />
                        <Text style={styles.emptyText}>Nenhum schedule cadastrado</Text>
                        <Text style={styles.emptySubText}>Crie um schedule para automatizar sua irrigação</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
                <Button title="➕ Novo Schedule" onPress={() => navigation.navigate('ScheduleForm', {})} />
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
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
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        marginRight: theme.spacing.sm,
    },
    cardTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        flex: 1,
    },
    cardBody: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    actionsCount: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    actionText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.sm,
        gap: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
    },
    actionButtonText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        fontWeight: theme.fontWeight.semibold,
        marginTop: theme.spacing.md,
    },
    emptySubText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
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
});
