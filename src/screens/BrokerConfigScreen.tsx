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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MQTTConfig } from '../types';

type RootStackParamList = {
    BrokerConfig: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'BrokerConfig'>;

export const BrokerConfigScreen: React.FC<Props> = ({ navigation }) => {
    const { state, dispatch } = useApp();

    const existingConfig = state.brokerConfig;

    const [brokerUrl, setBrokerUrl] = useState(existingConfig?.brokerUrl || '');
    const [port, setPort] = useState(existingConfig?.port.toString() || '8080');
    const [username, setUsername] = useState(existingConfig?.username || '');
    const [password, setPassword] = useState(existingConfig?.password || '');

    const handleSave = () => {
        if (!brokerUrl.trim()) {
            Alert.alert('Erro', 'Por favor, informe a URL do broker MQTT.');
            return;
        }

        const portNumber = parseInt(port, 10);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
            Alert.alert('Erro', 'Por favor, informe uma porta válida (1-65535).');
            return;
        }

        const config: MQTTConfig = {
            brokerUrl: brokerUrl.trim(),
            port: portNumber,
            username: username.trim() || undefined,
            password: password.trim() || undefined,
            clientId: existingConfig?.clientId || `IrrigaFacil_${Date.now()}`,
        };

        dispatch({ type: 'SET_BROKER_CONFIG', payload: config });
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.title}>
                    Configurações do Broker
                </Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Configuração Rápida (Recomendado)</Text>
                    <View style={styles.quickConfigContainer}>
                        <TouchableOpacity
                            style={styles.quickConfigButton}
                            onPress={() => {
                                setBrokerUrl('ws://broker.hivemq.com/mqtt');
                                setPort('8000');
                                Alert.alert('Configurado', 'Configuração do HiveMQ (WebSocket) aplicada!');
                            }}
                        >
                            <Text style={styles.quickConfigText}>HiveMQ Cloud (WS)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickConfigButton, { marginLeft: 10 }]}
                            onPress={() => {
                                setBrokerUrl('ws://test.mosquitto.org/mqtt');
                                setPort('8080');
                                Alert.alert('Configurado', 'Configuração do Mosquitto (WebSocket) aplicada!');
                            }}
                        >
                            <Text style={styles.quickConfigText}>Mosquitto (WS)</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>URL do Broker *</Text>
                    <TextInput
                        style={styles.input}
                        value={brokerUrl}
                        onChangeText={setBrokerUrl}
                        placeholder="Ex: ws://broker.hivemq.com"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Porta *</Text>
                    <TextInput
                        style={styles.input}
                        value={port}
                        onChangeText={setPort}
                        placeholder="8000 (WebSocket)"
                        placeholderTextColor={theme.colors.textMuted}
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Usuário (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Usuário MQTT"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Senha (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Senha MQTT"
                        placeholderTextColor={theme.colors.textMuted}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.helpBox}>
                    <Text style={styles.helpTitle}>
                        <MaterialCommunityIcons name="lightbulb-outline" size={24} color={theme.colors.text} /> Importante (React Native)</Text>
                    <Text style={styles.helpText}>
                        Este aplicativo usa WebSockets. Não use portas MQTT padrão (1883). O caminho `/mqtt` no final da URL geralmente é obrigatório.{'\n'}
                        • HiveMQ: ws://broker.hivemq.com/mqtt (Porta 8000){'\n'}
                        • Mosquitto: ws://test.mosquitto.org/mqtt (Porta 8080)
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Salvar"
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
        </KeyboardAvoidingView>
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
    quickConfigContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
    quickConfigButton: {
        flex: 1,
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    quickConfigText: {
        color: '#FFFFFF',
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
    },
    helpBox: {
        backgroundColor: theme.colors.backgroundLight,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.info,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing.lg,
    },
    helpTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    helpText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    buttonContainer: {
        marginTop: theme.spacing.lg,
    },
    cancelButton: {
        marginTop: theme.spacing.md,
    },
});
