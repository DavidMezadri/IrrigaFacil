import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { LogEntry, LogLevel } from '../types';
import { theme } from '../styles/theme';

const levelColor: Record<LogLevel, string> = {
    info: theme.colors.text,
    debug: theme.colors.textMuted,
    warn: '#F59E0B',
    error: theme.colors.error,
};

const levelIcon: Record<LogLevel, string> = {
    info: 'information-outline',
    debug: 'bug-outline',
    warn: 'alert-outline',
    error: 'close-circle-outline',
};

const formatTime = (iso: string): string => {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};

const LogRow: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const color = levelColor[entry.level];
    return (
        <View style={styles.row}>
            <MaterialCommunityIcons
                name={levelIcon[entry.level] as any}
                size={16}
                color={color}
                style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
                <Text style={[styles.rowTime, { color: theme.colors.textMuted }]}>
                    {formatTime(entry.timestamp)}
                    {'  '}
                    <Text style={[styles.rowLevel, { color }]}>
                        [{entry.level.toUpperCase()}]
                    </Text>
                </Text>
                <Text style={[styles.rowMessage, { color }]} selectable>
                    {entry.message}
                </Text>
            </View>
        </View>
    );
};

export const LogsScreen: React.FC = () => {
    const { state, dispatch, getSelectedFarm } = useApp();
    const flatListRef = useRef<FlatList>(null);
    const selectedFarm = getSelectedFarm();
    const logs = state.logEntries;

    const handleClear = () => {
        Alert.alert('Limpar Logs', 'Deseja remover todos os logs?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Limpar',
                style: 'destructive',
                onPress: () => dispatch({ type: 'CLEAR_LOGS' }),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Logs do Nó</Text>
                    <Text style={styles.subtitle}>
                        {selectedFarm?.mqttLogTopic
                            ? `📡 ${selectedFarm.mqttLogTopic}`
                            : 'Nenhum tópico de logs configurado'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.count}>{logs.length} mensagens</Text>
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                        <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={theme.colors.error} />
                        <Text style={styles.clearText}>Limpar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Log list */}
            {logs.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="text-box-outline" size={48} color={theme.colors.textMuted} />
                    <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
                    <Text style={styles.emptyHint}>
                        {selectedFarm?.mqttLogTopic
                            ? `Aguardando mensagens em\n${selectedFarm.mqttLogTopic}`
                            : 'Configure o tópico de logs nas\nconfigurações da fazenda.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={logs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <LogRow entry={item} />}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: theme.spacing.sm,
    },
    count: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    clearText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        fontWeight: theme.fontWeight.medium,
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: 32,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: theme.spacing.xs,
    },
    rowIcon: {
        marginTop: 2,
        marginRight: theme.spacing.sm,
    },
    rowBody: {
        flex: 1,
    },
    rowTime: {
        fontSize: 11,
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    rowLevel: {
        fontWeight: theme.fontWeight.bold,
    },
    rowMessage: {
        fontSize: theme.fontSize.sm,
        fontFamily: 'monospace',
        lineHeight: 18,
    },
    separator: {
        height: 1,
        backgroundColor: theme.colors.border,
        opacity: 0.4,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
        gap: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textSecondary,
    },
    emptyHint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});
