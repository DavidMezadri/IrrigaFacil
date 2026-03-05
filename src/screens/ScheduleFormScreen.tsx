import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useMQTT } from '../context/MQTTContext';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Schedule, ScheduleAction } from '../types';

type Props = NativeStackScreenProps<any, 'ScheduleForm'>;

const emptyAction = (): ScheduleAction => ({
    nodeId: 1,
    type: 'pump',
    equipament: '',
    state: 'on',
    start: '',
    stop: '',
});

export const ScheduleFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const { state, getSelectedFarm, getFarmSchedules, getFarmPumps, getFarmSectors, dispatch } = useApp();
    const { isConnected, publishSchedule } = useMQTT();
    const selectedFarm = getSelectedFarm();
    const scheduleId: string | undefined = route.params?.scheduleId;
    const isEditing = !!scheduleId;

    // ─── form state ────────────────────────────────────────────────────────────
    const [formScheduleId, setFormScheduleId] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [actions, setActions] = useState<ScheduleAction[]>([emptyAction()]);

    const [isSelectingEquip, setIsSelectingEquip] = useState(false);
    const [currentActionIndex, setCurrentActionIndex] = useState<number | null>(null);

    // Load existing schedule when editing
    useEffect(() => {
        if (isEditing && selectedFarm) {
            const existing = getFarmSchedules(selectedFarm.id).find(
                (s) => s.scheduleId === scheduleId
            );
            if (existing) {
                setFormScheduleId(existing.scheduleId);
                setEnabled(existing.enabled);
                setActions(existing.actions.length > 0 ? existing.actions : [emptyAction()]);
            }
        } else {
            // Generate default scheduleId
            setFormScheduleId(`sched_${Date.now()}`);
        }
    }, []);

    if (!selectedFarm) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Nenhuma fazenda selecionada</Text>
            </View>
        );
    }

    const mqttTopic = selectedFarm.mqttTopic;
    const farmPumps = getFarmPumps(selectedFarm.id);
    const farmSectors = getFarmSectors(selectedFarm.id);

    // ─── action helpers ─────────────────────────────────────────────────────────
    const updateAction = <K extends keyof ScheduleAction>(
        index: number,
        field: K,
        value: ScheduleAction[K]
    ) => {
        setActions((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addAction = () => setActions((prev) => [...prev, emptyAction()]);

    const removeAction = (index: number) => {
        if (actions.length === 1) {
            Alert.alert('Atenção', 'Um schedule precisa ter pelo menos 1 action.');
            return;
        }
        setActions((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formScheduleId.trim()) {
            Alert.alert('Erro', 'Informe o ID do schedule.');
            return;
        }
        for (let i = 0; i < actions.length; i++) {
            const a = actions[i];
            if (!a.equipament.trim() || !a.start.trim() || !a.stop.trim()) {
                Alert.alert('Erro', `Action ${i + 1}: preencha Equipamento, Start e Stop.`);
                return;
            }
        }

        const now = new Date().toISOString();
        const schedule: Schedule = {
            scheduleId: formScheduleId.trim(),
            farmId: selectedFarm.id,
            enabled,
            actions,
            createdAt: now,
            updatedAt: now,
        };

        if (isEditing) {
            // Preserve createdAt from existing
            const existing = getFarmSchedules(selectedFarm.id).find(
                (s) => s.scheduleId === scheduleId
            );
            if (existing) schedule.createdAt = existing.createdAt;
            dispatch({ type: 'UPDATE_SCHEDULE', payload: schedule });
        } else {
            dispatch({ type: 'ADD_SCHEDULE', payload: schedule });
        }

        if (isConnected) {
            try {
                await publishSchedule(isEditing ? 'update' : 'create', schedule, mqttTopic);
            } catch (e) {
                console.error('MQTT publish error:', e);
            }
        }

        navigation.goBack();
    };

    // ─── render ─────────────────────────────────────────────────────────────────
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Schedule ID */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Identificação</Text>
                <View style={styles.field}>
                    <Text style={styles.label}>Schedule ID *</Text>
                    <TextInput
                        style={styles.input}
                        value={formScheduleId}
                        onChangeText={setFormScheduleId}
                        placeholder="sched_manha_01"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="none"
                        editable={!isEditing}
                    />
                    {isEditing && (
                        <Text style={styles.hint}>O ID não pode ser alterado após criação.</Text>
                    )}
                </View>

                <View style={styles.fieldRow}>
                    <Text style={styles.label}>Habilitado</Text>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primaryDark }}
                        thumbColor={enabled ? theme.colors.primary : theme.colors.textMuted}
                    />
                </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>

                {actions.map((action, idx) => (
                    <View key={idx} style={styles.actionCard}>
                        <View style={styles.actionCardHeader}>
                            <Text style={styles.actionCardTitle}>Action {idx + 1}</Text>
                            <TouchableOpacity onPress={() => removeAction(idx)}>
                                <MaterialCommunityIcons
                                    name="close-circle-outline"
                                    size={22}
                                    color={theme.colors.error}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* nodeId */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Node ID</Text>
                            <TextInput
                                style={styles.input}
                                value={String(action.nodeId)}
                                onChangeText={(v) =>
                                    updateAction(idx, 'nodeId', Number(v) || 1)
                                }
                                keyboardType="numeric"
                                placeholderTextColor={theme.colors.textMuted}
                            />
                        </View>

                        {/* type: pump / sector */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Tipo</Text>
                            <View style={styles.toggleRow}>
                                {(['pump', 'sector'] as const).map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.toggleBtn,
                                            action.type === t && styles.toggleBtnActive,
                                        ]}
                                        onPress={() => updateAction(idx, 'type', t)}
                                    >
                                        <Text
                                            style={[
                                                styles.toggleBtnText,
                                                action.type === t && styles.toggleBtnTextActive,
                                            ]}
                                        >
                                            {t === 'pump' ? 'Bomba' : 'Setor'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* equipament */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Equipamento *</Text>
                            <TouchableOpacity
                                style={styles.equipmentSelector}
                                onPress={() => {
                                    setCurrentActionIndex(idx);
                                    setIsSelectingEquip(true);
                                }}
                            >
                                <Text style={[
                                    styles.equipmentSelectorText,
                                    !action.equipament && { color: theme.colors.textMuted }
                                ]}>
                                    {action.equipament || (action.type === 'pump' ? 'Selecione uma bomba...' : 'Selecione um setor...')}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* state: on / off */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Estado</Text>
                            <View style={styles.toggleRow}>
                                {(['on', 'off'] as const).map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.toggleBtn,
                                            action.state === s && (s === 'on' ? styles.toggleBtnActive : styles.toggleBtnDanger),
                                        ]}
                                        onPress={() => updateAction(idx, 'state', s)}
                                    >
                                        <Text
                                            style={[
                                                styles.toggleBtnText,
                                                action.state === s && styles.toggleBtnTextActive,
                                            ]}
                                        >
                                            {s === 'on' ? 'Ligar' : 'Desligar'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* start / stop */}
                        <View style={styles.rowFields}>
                            <View style={[styles.field, { flex: 1, marginRight: theme.spacing.sm }]}>
                                <Text style={styles.label}>Start (HH:MM) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={action.start}
                                    onChangeText={(v) => updateAction(idx, 'start', v)}
                                    placeholder="06:00"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Stop (HH:MM ou seg) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={action.stop}
                                    onChangeText={(v) => updateAction(idx, 'stop', v)}
                                    placeholder="06:30 ou 300"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.addActionBtn} onPress={addAction}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.addActionText}>  Adicionar Action</Text>
                </TouchableOpacity>
            </View>

            {/* Save button */}
            <View style={styles.saveSection}>
                <Button title={isEditing ? '💾 Salvar Alterações' : '✅ Criar Schedule'} onPress={handleSave} />
                {!isConnected && (
                    <Text style={styles.offlineHint}>
                        ⚠️  Sem conexão MQTT — schedule será salvo localmente apenas.
                    </Text>
                )}
            </View>

            {/* Equipment Selection Modal */}
            <Modal
                visible={isSelectingEquip}
                transparent
                animationType="fade"
                onRequestClose={() => setIsSelectingEquip(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsSelectingEquip(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Selecione {currentActionIndex !== null && actions[currentActionIndex]?.type === 'pump' ? 'a Bomba' : 'o Setor'}
                        </Text>

                        <FlatList
                            data={
                                currentActionIndex !== null && actions[currentActionIndex]?.type === 'pump'
                                    ? farmPumps
                                    : farmSectors
                            }
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => {
                                        if (currentActionIndex !== null) {
                                            updateAction(currentActionIndex, 'equipament', item.name);
                                        }
                                        setIsSelectingEquip(false);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={currentActionIndex !== null && actions[currentActionIndex]?.type === 'pump' ? 'pump' : 'water-pump'}
                                        size={24}
                                        color={theme.colors.primary}
                                        style={styles.modalOptionIcon}
                                    />
                                    <Text style={styles.modalOptionText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.modalEmptyText}>Nenhum equipamento cadastrado</Text>
                            }
                        />

                        <Button
                            title="Cancelar"
                            variant="secondary"
                            onPress={() => setIsSelectingEquip(false)}
                            style={styles.modalCancelBtn}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingBottom: 60,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    field: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    hint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.backgroundLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
    },
    equipmentSelector: {
        backgroundColor: theme.colors.backgroundLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 50,
    },
    equipmentSelectorText: {
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
        flex: 1,
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    rowFields: {
        flexDirection: 'row',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    toggleBtnDanger: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },
    toggleBtnText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        fontWeight: theme.fontWeight.medium,
    },
    toggleBtnTextActive: {
        color: theme.colors.text,
    },
    actionCard: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    actionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    actionCardTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.secondary,
    },
    addActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary,
    },
    addActionText: {
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
        fontSize: theme.fontSize.md,
    },
    saveSection: {
        marginTop: theme.spacing.md,
    },
    offlineHint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.warning,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 80,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    modalContent: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        maxHeight: '80%',
        ...theme.shadows.lg,
    },
    modalTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalOptionIcon: {
        marginRight: theme.spacing.md,
    },
    modalOptionText: {
        fontSize: theme.fontSize.lg,
        color: theme.colors.text,
    },
    modalEmptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        padding: theme.spacing.xl,
    },
    modalCancelBtn: {
        marginTop: theme.spacing.lg,
    }
});
