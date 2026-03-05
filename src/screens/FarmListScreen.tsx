import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { theme } from '../styles/theme';
import { useMQTT } from '../context/MQTTContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RootStackParamList = {
    FarmList: undefined;
    FarmForm: { farmId?: string };
    BrokerConfig: undefined;
    Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'FarmList'>;

export const FarmListScreen: React.FC<Props> = ({ navigation }) => {
    const { state, dispatch } = useApp();
    const { isConnected } = useMQTT();

    const handleSelectFarm = (farmId: string) => {
        dispatch({ type: 'SELECT_FARM', payload: farmId });
        navigation.navigate('Main');
    };

    const handleAddFarm = () => {
        navigation.navigate('FarmForm', {});
    };

    const handleEditFarm = (farmId: string) => {
        navigation.navigate('FarmForm', { farmId });
    };

    const handleDeleteFarm = (farmId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta fazenda? Todos os dados associados serão removidos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                        // Delete associated data
                        const pumpsToDelete = state.pumps.filter(p => p.farmId === farmId);
                        const sectorsToDelete = state.sectors.filter(s => s.farmId === farmId);
                        const sensorsToDelete = state.sensors.filter(s => s.farmId === farmId);

                        pumpsToDelete.forEach(p => dispatch({ type: 'DELETE_PUMP', payload: p.id }));
                        sectorsToDelete.forEach(s => dispatch({ type: 'DELETE_SECTOR', payload: s.id }));
                        sensorsToDelete.forEach(s => dispatch({ type: 'DELETE_SENSOR', payload: s.id }));

                        dispatch({ type: 'DELETE_FARM', payload: farmId });
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Minhas Fazendas</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('BrokerConfig')}>
                        <MaterialCommunityIcons name="cog" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
                {state.selectedFarmId && (
                    <View style={styles.connectionStatus}>
                        <StatusIndicator status={isConnected ? 'connected' : 'disconnected'} />
                        <Text style={styles.connectionText}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </Text>
                    </View>
                )}
            </View>

            <FlatList
                data={state.farms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card>
                        <TouchableOpacity onPress={() => handleSelectFarm(item.id)}>
                            <View style={styles.farmCard}>
                                <View style={styles.farmInfo}>
                                    <Text style={styles.farmName}>{item.name}</Text>
                                    {item.location && (
                                        <Text style={styles.farmLocation}><MaterialCommunityIcons name="google-maps" size={24} color={theme.colors.text} /> {item.location}</Text>
                                    )}
                                </View>
                                {state.selectedFarmId === item.id && (
                                    <View style={styles.selectedBadge}>
                                        <Text style={styles.selectedText}>Selecionada</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditFarm(item.id)}
                            >
                                <Text style={styles.actionText}>
                                    <MaterialCommunityIcons name="pencil" size={24} color={theme.colors.text} /> Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteFarm(item.id)}
                            >
                                <Text style={[styles.actionText, styles.deleteText]}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={theme.colors.text} /> Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhuma fazenda cadastrada</Text>
                        <Text style={styles.emptySubtext}>
                            Adicione sua primeira fazenda para começar
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
                <Button title="Adicionar Fazenda" onPress={handleAddFarm} variant="primary">
                    <MaterialCommunityIcons name="plus" size={24} color={theme.colors.text} />
                    <Text style={styles.selectedText}>Adicionar Fazenda</Text>
                </Button>
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
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
    farmCard: {
        marginBottom: theme.spacing.md,
    },
    farmInfo: {
        marginBottom: theme.spacing.sm,
    },
    farmName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    farmLocation: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    selectedBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: theme.spacing.sm,
    },
    selectedText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    actionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    deleteText: {
        color: theme.colors.error,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
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
