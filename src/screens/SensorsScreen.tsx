import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { SensorCard } from '../components/SensorCard';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { useMQTT } from '../context/MQTTContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'Sensors'>;

export const SensorsScreen: React.FC<Props> = ({ navigation }) => {
    const { state, getSelectedFarm, getFarmSensors, getLatestSensorReading, dispatch } = useApp();
    const selectedFarm = getSelectedFarm();

    if (!selectedFarm) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Nenhuma fazenda selecionada</Text>
            </View>
        );
    }

    const sensors = getFarmSensors(selectedFarm.id);
    const { isConnected } = useMQTT();

    const handleDelete = (sensorId: string) => {
        Alert.alert('Confirmar Exclusão', 'Deseja excluir este sensor?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: () => dispatch({ type: 'DELETE_SENSOR', payload: sensorId }),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sensores</Text>
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
                data={sensors}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View>
                        <SensorCard sensor={item} latestReading={getLatestSensorReading(item.id)} />
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => navigation.navigate('SensorForm', { sensorId: item.id })}>
                                <Text style={styles.editText}>
                                    <MaterialCommunityIcons name="pencil" size={24} color={theme.colors.text} /> Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Text style={styles.deleteText}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={theme.colors.text} /> Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum sensor cadastrado</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
                <Button title="➕ Adicionar Sensor" onPress={() => navigation.navigate('SensorForm', {})} />
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
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: -theme.spacing.xxl,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
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
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectionText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
    },
});
