import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Farm } from '../types';
import { generateId } from '../utils/messageFormatter';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RootStackParamList = {
    FarmList: undefined;
    FarmForm: { farmId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'FarmForm'>;

export const FarmFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, dispatch } = useApp();
    const { farmId } = route.params;
    const isEditing = !!farmId;

    const existingFarm = isEditing
        ? state.farms.find((f) => f.id === farmId)
        : null;

    const [name, setName] = useState(existingFarm?.name || '');
    const [location, setLocation] = useState(existingFarm?.location || '');
    const [mqttTopic, setMqttTopic] = useState(existingFarm?.mqttTopic || '');
    const [mqttLogTopic, setMqttLogTopic] = useState(existingFarm?.mqttLogTopic || '');

    const handleSave = () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Erro', 'Por favor, informe o nome da fazenda.');
            return;
        }

        if (!mqttTopic.trim()) {
            Alert.alert('Erro', 'Por favor, informe o tópico MQTT da fazenda.');
            return;
        }

        const farm: Farm = {
            id: isEditing ? farmId : generateId(),
            name: name.trim(),
            location: location.trim() || undefined,
            mqttTopic: mqttTopic.trim(),
            mqttLogTopic: mqttLogTopic.trim() || undefined,
            createdAt: existingFarm?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_FARM', payload: farm });
        } else {
            dispatch({ type: 'ADD_FARM', payload: farm });
        }

        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.title}>
                    {isEditing ? 'Editar Fazenda' : 'Nova Fazenda'}
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Gerais</Text>

                    <Text style={styles.label}>Nome da Fazenda *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Fazenda São João"
                        placeholderTextColor={theme.colors.textMuted}
                    />

                    <Text style={styles.label}>Localização</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Ex: São Paulo, SP"
                        placeholderTextColor={theme.colors.textMuted}
                    />
                    <Text style={styles.label}>Tópico MQTT *</Text>
                    <TextInput
                        style={styles.input}
                        value={mqttTopic}
                        onChangeText={setMqttTopic}
                        placeholder="Ex: user/device_id"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Tópico de Logs (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={mqttLogTopic}
                        onChangeText={setMqttLogTopic}
                        placeholder="Ex: user/device_id/logs"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title={isEditing ? 'Salvar Alterações' : 'Criar Fazenda'}
                        onPress={handleSave}
                        variant="primary"
                    />
                    <Button
                        title="Cancelar"
                        onPress={() => navigation.goBack()}
                        variant="secondary"
                        style={styles.cancelButton}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
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
        marginTop: theme.spacing.lg,
    },
    cancelButton: {
        marginTop: theme.spacing.md,
    },
});
