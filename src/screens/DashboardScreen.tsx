import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useMQTT } from '../context/MQTTContext';
import { Card } from '../components/Card';
import { StatusIndicator } from '../components/StatusIndicator';
import { SensorCard } from '../components/SensorCard';
import { PumpControl } from '../components/PumpControl';
import { SectorControl } from '../components/SectorControl';
import { theme } from '../styles/theme';
import { SyncButton } from '../components/SyncButton';

type RootStackParamList = {
    Dashboard: undefined;
    Pumps: undefined;
    Sectors: undefined;
    Sensors: undefined;
    FarmList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { state, getSelectedFarm, getFarmPumps, getFarmSectors, getFarmSensors, getLatestSensorReading } = useApp();
    const { isConnected } = useMQTT();

    const selectedFarm = getSelectedFarm();

    if (!selectedFarm) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma fazenda selecionada</Text>
                    <Text style={styles.emptySubtext}>
                        Selecione uma fazenda para visualizar o dashboard
                    </Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => navigation.navigate('FarmList')}
                    >
                        <Text style={styles.selectButtonText}>Selecionar Fazenda</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const pumps = getFarmPumps(selectedFarm.id);
    const sectors = getFarmSectors(selectedFarm.id);
    const sensors = getFarmSensors(selectedFarm.id);

    const activePumps = pumps.filter(p => p.status === 'on').length;
    const activeSectors = sectors.filter(s => s.status === 'on').length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.farmName}>{selectedFarm.name}</Text>
                    {selectedFarm.location && (
                        <Text style={styles.farmLocation}>📍 {selectedFarm.location}</Text>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.connectionStatus}>
                        <StatusIndicator status={isConnected ? 'connected' : 'disconnected'} size={12} />
                        <Text style={styles.connectionText}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </Text>
                    </View>
                    <SyncButton />
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{pumps.length}</Text>
                        <Text style={styles.statLabel}>Bombas</Text>
                        <Text style={styles.statSubtext}>{activePumps} ativas</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{sectors.length}</Text>
                        <Text style={styles.statLabel}>Setores</Text>
                        <Text style={styles.statSubtext}>{activeSectors} ativos</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{sensors.length}</Text>
                        <Text style={styles.statLabel}>Sensores</Text>
                        <Text style={styles.statSubtext}>monitorando</Text>
                    </Card>
                </View>

                {/* Sensors Section */}
                {sensors.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sensores</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Sensors')}>
                                <Text style={styles.seeAllText}>Ver todos →</Text>
                            </TouchableOpacity>
                        </View>
                        {sensors.slice(0, 3).map((sensor) => (
                            <SensorCard
                                key={sensor.id}
                                sensor={sensor}
                                latestReading={getLatestSensorReading(sensor.id)}
                            />
                        ))}
                    </View>
                )}

                {/* Pumps Section */}
                {pumps.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bombas</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Pumps')}>
                                <Text style={styles.seeAllText}>Ver todas →</Text>
                            </TouchableOpacity>
                        </View>
                        {pumps.slice(0, 2).map((pump) => (
                            <PumpControl key={pump.id} pump={pump} />
                        ))}
                    </View>
                )}

                {/* Sectors Section */}
                {sectors.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Setores</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Sectors')}>
                                <Text style={styles.seeAllText}>Ver todos →</Text>
                            </TouchableOpacity>
                        </View>
                        {sectors.slice(0, 2).map((sector) => (
                            <SectorControl key={sector.id} sector={sector} />
                        ))}
                    </View>
                )}

                {/* Empty state */}
                {pumps.length === 0 && sectors.length === 0 && sensors.length === 0 && (
                    <View style={styles.emptyDashboard}>
                        <Text style={styles.emptyDashboardText}>
                            Adicione bombas, setores e sensores para começar a monitorar sua fazenda
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    farmName: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    farmLocation: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    connectionText: {
        marginLeft: 6,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    statCard: {
        flex: 1,
        marginHorizontal: theme.spacing.xs,
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },
    statValue: {
        fontSize: theme.fontSize.xxxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },
    statLabel: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    statSubtext: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    seeAllText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    selectButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    selectButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    emptyDashboard: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyDashboardText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },
});
