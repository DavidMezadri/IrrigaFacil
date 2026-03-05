import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useMQTT } from '../context/MQTTContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Sector } from '../types';
import { generateId } from '../utils/messageFormatter';

type Props = NativeStackScreenProps<any, 'SectorForm'>;

export const SectorFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, dispatch, getSelectedFarm } = useApp();
    const { isConnected, publishGpioCommand } = useMQTT();
    const { sectorId } = route.params || {};
    const isEditing = !!sectorId;
    const selectedFarm = getSelectedFarm();

    const existingSector = isEditing ? state.sectors.find((s) => s.id === sectorId) : null;

    const [name, setName] = useState(existingSector?.name || '');
    const [description, setDescription] = useState(existingSector?.description || '');
    const [area, setArea] = useState(existingSector?.area?.toString() || '');
    const [nodeId, setNodeId] = useState(String(existingSector?.nodeId ?? 1));
    const [gpioPin, setGpioPin] = useState(String(existingSector?.gpioPin ?? ''));

    const handleSave = async () => {
        if (!selectedFarm) {
            Alert.alert('Erro', 'Nenhuma fazenda selecionada');
            return;
        }
        if (!name.trim()) {
            Alert.alert('Erro', 'Preencha o nome do setor');
            return;
        }
        if (!isEditing && !gpioPin.trim()) {
            Alert.alert('Erro', 'Informe o pino GPIO para criar o setor');
            return;
        }

        const sector: Sector = {
            id: isEditing ? sectorId : generateId(),
            farmId: selectedFarm.id,
            name: name.trim(),
            description: description.trim() || undefined,
            area: area ? parseFloat(area) : undefined,
            status: existingSector?.status || 'unknown',
            nodeId: Number(nodeId) || 1,
            gpioPin: gpioPin.trim() ? Number(gpioPin) : undefined,
            createdAt: existingSector?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_SECTOR', payload: sector });
        } else {
            dispatch({ type: 'ADD_SECTOR', payload: sector });
        }

        // Publish MQTT GPIO command using the farm topic
        if (isConnected) {
            try {
                const topic = selectedFarm.mqttTopic;
                const farmName = selectedFarm.name;
                if (isEditing) {
                    await publishGpioCommand('update', 'sector', existingSector!.name, topic, farmName, {
                        nodeId: sector.nodeId,
                        gpioPin: sector.gpioPin,
                        newName: sector.name !== existingSector?.name ? sector.name : undefined,
                    });
                } else {
                    await publishGpioCommand('create', 'sector', sector.name, topic, farmName, {
                        nodeId: sector.nodeId,
                        gpioPin: sector.gpioPin,
                    });
                }
            } catch (e) {
                console.error('MQTT GPIO publish error:', e);
                Alert.alert('Aviso MQTT', `Setor salvo localmente, mas falhou ao enviar para o broker: ${e}`);
            }
        }

        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{isEditing ? 'Editar Setor' : 'Novo Setor'}</Text>

            <Text style={styles.label}>Nome *</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Setor Norte"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Área de plantio de milho"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Área (hectares)</Text>
            <TextInput
                style={styles.input}
                value={area}
                onChangeText={setArea}
                placeholder="Ex: 10.5"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Node ID</Text>
            <TextInput
                style={styles.input}
                value={nodeId}
                onChangeText={setNodeId}
                placeholder="1"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Pino GPIO {!isEditing && '*'}</Text>
            <TextInput
                style={styles.input}
                value={gpioPin}
                onChangeText={setGpioPin}
                placeholder="Ex: 12"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
            />

            {selectedFarm && (
                <Text style={styles.topicInfo}>📡 Tópico MQTT da fazenda: {selectedFarm.mqttTopic}</Text>
            )}

            {!isConnected && (
                <Text style={styles.offlineHint}>⚠️  Sem conexão MQTT — salvo localmente apenas.</Text>
            )}

            <View style={styles.buttonContainer}>
                <Button title={isEditing ? 'Salvar' : 'Criar'} onPress={handleSave} />
                <Button title="Cancelar" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelButton} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.lg },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.backgroundLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
    topicInfo: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.lg,
        fontFamily: 'monospace',
    },
    offlineHint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.warning,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    buttonContainer: { marginTop: theme.spacing.xl },
    cancelButton: { marginTop: theme.spacing.md },
});
