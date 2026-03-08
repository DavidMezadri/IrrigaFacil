import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useMQTT } from '../context/MQTTContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Pump } from '../types';
import { generateId } from '../utils/messageFormatter';

type Props = NativeStackScreenProps<any, 'PumpForm'>;

export const PumpFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, dispatch, getSelectedFarm } = useApp();
    const { isConnected, publishGpioCommand } = useMQTT();
    const { pumpId } = route.params || {};
    const isEditing = !!pumpId;
    const selectedFarm = getSelectedFarm();

    const existingPump = isEditing ? state.pumps.find((p) => p.id === pumpId) : null;

    const [name, setName] = useState(existingPump?.name || '');
    const [description, setDescription] = useState(existingPump?.description || '');
    const [nodeId, setNodeId] = useState(String(existingPump?.nodeId ?? 1));
    const [gpioPin, setGpioPin] = useState(String(existingPump?.gpioPin ?? ''));

    const handleSave = async () => {
        if (!isConnected) {
            Alert.alert('Sem conexão', 'Conecte ao broker MQTT antes de criar ou editar uma bomba.');
            return;
        }
        if (!selectedFarm) {
            Alert.alert('Erro', 'Nenhuma fazenda selecionada');
            return;
        }
        if (!name.trim()) {
            Alert.alert('Erro', 'Preencha o nome da bomba');
            return;
        }
        if (!isEditing && !gpioPin.trim()) {
            Alert.alert('Erro', 'Informe o pino GPIO para criar a bomba');
            return;
        }

        const pump: Pump = {
            id: isEditing ? pumpId : generateId(),
            farmId: selectedFarm.id,
            name: name.trim(),
            description: description.trim() || undefined,
            status: existingPump?.status || 'unknown',
            nodeId: Number(nodeId) || 1,
            gpioPin: gpioPin.trim() ? Number(gpioPin) : undefined,
            createdAt: existingPump?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_PUMP', payload: pump });
        } else {
            dispatch({ type: 'ADD_PUMP', payload: pump });
        }

        // Publish MQTT GPIO command using the farm topic
        if (isConnected) {
            try {
                const topic = selectedFarm.mqttTopic;
                const farmName = selectedFarm.name;
                if (isEditing) {
                    await publishGpioCommand('update', 'pump', existingPump!.name, topic, farmName, {
                        nodeId: pump.nodeId,
                        gpioPin: pump.gpioPin,
                        newName: pump.name !== existingPump?.name ? pump.name : undefined,
                    });
                } else {
                    await publishGpioCommand('create', 'pump', pump.name, topic, farmName, {
                        nodeId: pump.nodeId,
                        gpioPin: pump.gpioPin,
                    });
                }
            } catch (e) {
                console.error('MQTT GPIO publish error:', e);
                Alert.alert('Aviso MQTT', `Bomba salva localmente, mas falhou ao enviar para o broker: ${e}`);
            }
        }

        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{isEditing ? 'Editar Bomba' : 'Nova Bomba'}</Text>

            <Text style={styles.label}>Nome *</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Bomba Principal"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Bomba do setor norte"
                placeholderTextColor={theme.colors.textMuted}
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
                placeholder="Ex: 18"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
            />

            {selectedFarm && (
                <Text style={styles.topicInfo}>📡 Tópico MQTT da fazenda: {selectedFarm.mqttTopic}</Text>
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
