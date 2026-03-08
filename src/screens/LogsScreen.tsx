import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { dbService, DayGroup, LogLevel, LogCategory } from '../services/dbService';
import { AccordionHourGroup } from '../components/AccordionHourGroup';
import { theme } from '../styles/theme';

export const LogsScreen: React.FC = () => {
    const { state } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState<DayGroup[]>([]);

    // Filters
    const [levelFilter, setLevelFilter] = useState<LogLevel[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<LogCategory[]>([]);

    const selectedFarm = state.farms.find(f => f.id === state.selectedFarmId);

    const loadLogs = async () => {
        if (!selectedFarm) return;
        setIsLoading(true);
        try {
            const data = await dbService.getLogsGroupedByDayAndHour(
                selectedFarm.id,
                levelFilter.length > 0 ? levelFilter : undefined,
                categoryFilter.length > 0 ? categoryFilter : undefined
            );
            setDays(data);
        } catch (error) {
            console.error("Failed to load logs from db", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load logs every time screen gains focus
    useFocusEffect(
        useCallback(() => {
            loadLogs();
        }, [selectedFarm?.id, levelFilter, categoryFilter])
    );

    const toggleLevelFilter = (level: LogLevel) => {
        setLevelFilter(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const formatDateHeader = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    if (!selectedFarm) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Selecione uma fazenda primeiro</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Logs do Sistema</Text>
                    <Text style={styles.subtitle}>
                        {selectedFarm?.mqttLogTopic
                            ? `📡 Capturando de ${selectedFarm.mqttLogTopic}`
                            : 'Nenhum tópico de logs configurado'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={loadLogs}
                >
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <Text style={styles.filterTitle}>Filtrar por Gravidade:</Text>
                <View style={styles.chipsRow}>
                    {(['ERROR', 'WARN', 'INFO', 'SUCCESS'] as LogLevel[]).map(level => {
                        const isActive = levelFilter.includes(level);
                        return (
                            <TouchableOpacity
                                key={level}
                                onPress={() => toggleLevelFilter(level)}
                                style={[
                                    styles.chip,
                                    isActive && styles.chipActive,
                                    isActive && level === 'ERROR' && { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
                                    isActive && level === 'WARN' && { backgroundColor: '#F5A623', borderColor: '#F5A623' },
                                    isActive && level === 'SUCCESS' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isActive && styles.chipTextActive
                                ]}>{level}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 10, color: theme.colors.textMuted }}>Buscando no banco de dados...</Text>
                </View>
            ) : days.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.colors.textMuted} />
                    <Text style={styles.emptyText}>Nenhum log encontrado.</Text>
                </View>
            ) : (
                <SectionList
                    sections={days.map(d => ({ ...d, data: d.hours }))}
                    keyExtractor={(item, index) => item.hour + index}
                    renderSectionHeader={({ section: { date } }) => (
                        <View style={styles.dateHeader}>
                            <MaterialCommunityIcons name="calendar-month" size={18} color={theme.colors.text} />
                            <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <AccordionHourGroup group={item} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
        backgroundColor: theme.colors.background,
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
    refreshBtn: {
        padding: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    filtersContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    filterTitle: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    chip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    chipActive: {
        backgroundColor: theme.colors.text,
        borderColor: theme.colors.text,
    },
    chipText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textMuted,
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: 100,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    dateHeaderText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    }
});
