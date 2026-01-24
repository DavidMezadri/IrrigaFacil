import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Sensor, SensorType } from '../types';
import { generateId, getSensorTypeName, getDefaultUnit } from '../utils/messageFormatter';

type Props = NativeStackScreenProps<any, 'SensorForm'>;

export const SensorFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, dispatch, getSelectedFarm } = useApp();
    const { sensorId } = route.params || {};
    const isEditing = !!sensorId;
    const selectedFarm = getSelectedFarm();

    const existingSensor = isEditing ? state.sensors.find((s) => s.id === sensorId) : null;

    const [name, setName] = useState(existingSensor?.name || '');
    const [type, setType] = useState<SensorType>(existingSensor?.type || 'humidity');
    const [unit, setUnit] = useState(existingSensor?.unit || '%');
    const [description, setDescription] = useState(existingSensor?.description || '');
    const [mqttTopic, setMqttTopic] = useState(existingSensor?.mqttTopic || '');

    const handleTypeChange = (newType: SensorType) => {
        setType(newType);
        setUnit(getDefaultUnit(newType));
    };

    const handleSave = () => {
        if (!selectedFarm) {
            Alert.alert('Erro', 'Nenhuma fazenda selecionada');
            return;
        }

        if (!name.trim() || !mqttTopic.trim() || !unit.trim()) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        const sensor: Sensor = {
            id: isEditing ? sensorId : generateId(),
            farmId: selectedFarm.id,
            name: name.trim(),
            type,
            unit: unit.trim(),
            description: description.trim() || undefined,
            mqttTopic: mqttTopic.trim(),
            createdAt: existingSensor?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_SENSOR', payload: sensor });
        } else {
            dispatch({ type: 'ADD_SENSOR', payload: sensor });
        }

        navigation.goBack();
    };

    const sensorTypes: SensorType[] = ['humidity', 'temperature', 'wind', 'rain', 'soilMoisture', 'pressure', 'custom'];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{isEditing ? 'Editar Sensor' : 'Novo Sensor'}</Text>

            <Text style={styles.label}>Nome *</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Sensor de Umidade 1"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={type}
                    onValueChange={(value) => handleTypeChange(value as SensorType)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                >
                    {sensorTypes.map((t) => (
                        <Picker.Item key={t} label={getSensorTypeName(t)} value={t} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Unidade *</Text>
            <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="Ex: %, °C, km/h"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Sensor instalado no setor norte"
                placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Tópico MQTT *</Text>
            <TextInput
                style={styles.input}
                value={mqttTopic}
                onChangeText={setMqttTopic}
                placeholder="Ex: fazenda1/sensor/umidade/1/dados"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
            />

            <View style={styles.buttonContainer}>
                <Button title={isEditing ? 'Salvar' : 'Criar'} onPress={handleSave} />
                <Button title="Cancelar" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelButton} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
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
    pickerContainer: {
        backgroundColor: theme.colors.backgroundLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
    },
    picker: {
        color: theme.colors.text,
    },
    buttonContainer: {
        marginTop: theme.spacing.xl,
    },
    cancelButton: {
        marginTop: theme.spacing.md,
    },
});
