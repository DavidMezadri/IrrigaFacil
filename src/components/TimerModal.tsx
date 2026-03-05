import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert
} from 'react-native';
import { theme } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';

interface TimerModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (stopParameter?: string | number) => void;
    deviceName: string;
}

export const TimerModal: React.FC<TimerModalProps> = ({ visible, onClose, onConfirm, deviceName }) => {
    const [mode, setMode] = useState<'none' | 'seconds' | 'clock'>('none');
    const [inputValue, setInputValue] = useState('');
    const [timeValue, setTimeValue] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleConfirm = () => {
        if (mode === 'none') {
            onConfirm(); // Normal run without timer
            return;
        }

        if (mode === 'seconds') {
            const numericValue = parseInt(inputValue, 10);
            if (isNaN(numericValue) || numericValue <= 0) {
                Alert.alert('Valor Inválido', 'Por favor, insira um número maior que zero.');
                return;
            }
            onConfirm(numericValue);
            return;
        }

        if (mode === 'clock') {
            const hours = timeValue.getHours().toString().padStart(2, '0');
            const minutes = timeValue.getMinutes().toString().padStart(2, '0');
            onConfirm(`${hours}:${minutes}`);
            return;
        }
    };

    const resetAndClose = () => {
        setMode('none');
        setInputValue('');
        setTimeValue(new Date());
        setShowTimePicker(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
            <TouchableWithoutFeedback onPress={resetAndClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={styles.modalContainer}
                        >
                            <View style={styles.modalContent}>
                                <View style={styles.header}>
                                    <Text style={styles.title}>Ligar {deviceName}</Text>
                                    <TouchableOpacity onPress={resetAndClose}>
                                        <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.subtitle}>Como deseja ligar o dispositivo?</Text>

                                <View style={styles.optionsContainer}>
                                    <TouchableOpacity
                                        style={[styles.optionCard, mode === 'none' && styles.optionCardSelected]}
                                        onPress={() => setMode('none')}
                                    >
                                        <MaterialCommunityIcons
                                            name="power"
                                            size={24}
                                            color={mode === 'none' ? theme.colors.primary : theme.colors.textSecondary}
                                        />
                                        <Text style={[styles.optionText, mode === 'none' && styles.optionTextSelected]}>
                                            Apenas Ligar
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.optionCard, mode === 'seconds' && styles.optionCardSelected]}
                                        onPress={() => setMode('seconds')}
                                    >
                                        <MaterialCommunityIcons
                                            name="timer-sand"
                                            size={24}
                                            color={mode === 'seconds' ? theme.colors.primary : theme.colors.textSecondary}
                                        />
                                        <Text style={[styles.optionText, mode === 'seconds' && styles.optionTextSelected]}>
                                            Segundos
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.optionCard, mode === 'clock' && styles.optionCardSelected]}
                                        onPress={() => setMode('clock')}
                                    >
                                        <MaterialCommunityIcons
                                            name="clock-outline"
                                            size={24}
                                            color={mode === 'clock' ? theme.colors.primary : theme.colors.textSecondary}
                                        />
                                        <Text style={[styles.optionText, mode === 'clock' && styles.optionTextSelected]}>
                                            Relógio
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {mode === 'seconds' && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>
                                            Tempo em Segundos:
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={inputValue}
                                            onChangeText={setInputValue}
                                            keyboardType="number-pad"
                                            placeholder="Ex: 30"
                                            placeholderTextColor={theme.colors.textMuted}
                                            autoFocus
                                        />
                                    </View>
                                )}

                                {mode === 'clock' && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Hora de Parada (Stop):</Text>

                                        {Platform.OS === 'android' ? (
                                            <TouchableOpacity
                                                style={styles.timeButton}
                                                onPress={() => setShowTimePicker(true)}
                                            >
                                                <Text style={styles.timeButtonText}>
                                                    {timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}

                                        {(showTimePicker || Platform.OS === 'ios') && (
                                            <DateTimePicker
                                                value={timeValue}
                                                mode="time"
                                                is24Hour={true}
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowTimePicker(false);
                                                    if (selectedDate) setTimeValue(selectedDate);
                                                }}
                                            />
                                        )}
                                    </View>
                                )}

                                <View style={styles.footer}>
                                    <Button
                                        title="Cancelar"
                                        variant="secondary"
                                        onPress={resetAndClose}
                                        style={styles.actionButton}
                                    />
                                    <Button
                                        title="Ligar"
                                        variant="primary"
                                        onPress={handleConfirm}
                                        style={styles.actionButton}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    modalContainer: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        ...theme.shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    optionCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
        borderWidth: 2,
        borderColor: theme.colors.backgroundLight,
        borderRadius: theme.borderRadius.sm,
        marginHorizontal: 4,
        backgroundColor: theme.colors.backgroundLight,
    },
    optionCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10', // 10% opacity primary
    },
    optionText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    optionTextSelected: {
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.bold,
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.lg,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
    },
    timeButton: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
    },
    timeButtonText: {
        fontSize: theme.fontSize.lg,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.bold,
    }
});
