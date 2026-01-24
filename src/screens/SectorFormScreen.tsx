import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Sector } from '../types';
import { generateId } from '../utils/messageFormatter';

type Props = NativeStackScreenProps<any, 'SectorForm'>;

export const SectorFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, dispatch, getSelectedFarm } = useApp();
    const { sectorId } = route.params || {};
    const isEditing = !!sectorId;
    const selectedFarm = getSelectedFarm();

    const existingSector = isEditing ? state.sectors.find((s) => s.id === sectorId) : null;

    const [name, setName] = useState(existingSector?.name || '');
    const [description, setDescription] = useState(existingSector?.description || '');
    const [area, setArea] = useState(existingSector?.area?.toString() || '');
    const [mqttTopic, setMqttTopic] = useState(existingSector?.mqttTopic || '');

    const handleSave = () => {
        if (!selectedFarm) {
            Alert.alert('Erro', 'Nenhuma fazenda selecionada');
            return;
        }

        if (!name.trim() || !mqttTopic.trim()) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        const sector: Sector = {
            id: isEditing ? sectorId : generateId(),
            farmId: selectedFarm.id,
            name: name.trim(),
            description: description.trim() || undefined,
            area: area ? parseFloat(area) : undefined,
            status: existingSector?.status || 'unknown',
            mqttTopic: mqttTopic.trim(),
            createdAt: existingSector?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_SECTOR', payload: sector });
        } else {
            dispatch({ type: 'ADD_SECTOR', payload: sector });
        }

        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

            <Text style={styles.label}>Tópico MQTT *</Text>
            <TextInput
                style={styles.input}
                value={mqttTopic}
                onChangeText={setMqttTopic}
                placeholder="Ex: fazenda1/setor/1/comando"
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
    buttonContainer: {
        marginTop: theme.spacing.xl,
    },
    cancelButton: {
        marginTop: theme.spacing.md,
    },
});
