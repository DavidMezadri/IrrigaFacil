import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Text, View, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useMQTT, SyncStatus } from '../context/MQTTContext';

interface SyncButtonProps {
    style?: object;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ style }) => {
    const { publishGetAll, syncStatus, isConnected } = useMQTT();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

    // Spin while pending
    useEffect(() => {
        if (syncStatus === 'pending') {
            spinAnim.setValue(0);
            spinLoop.current = Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                })
            );
            spinLoop.current.start();
        } else {
            spinLoop.current?.stop();
            spinLoop.current = null;
            spinAnim.setValue(0);
        }
    }, [syncStatus]);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handlePress = async () => {
        if (!isConnected) {
            Alert.alert('Sem conexão', 'Conecte-se ao broker MQTT antes de sincronizar.');
            return;
        }
        try {
            await publishGetAll();
        } catch (e) {
            Alert.alert('Erro', `Falha ao enviar getAll: ${e}`);
        }
    };

    const getIcon = (status: SyncStatus) => {
        if (status === 'done') return 'check-circle-outline';
        if (status === 'error') return 'alert-circle-outline';
        return 'sync';
    };

    const getColor = (status: SyncStatus) => {
        if (status === 'done') return theme.colors.success ?? '#4CAF50';
        if (status === 'error') return theme.colors.error;
        if (status === 'pending') return theme.colors.primary;
        return theme.colors.text;
    };

    return (
        <TouchableOpacity
            style={[styles.btn, style]}
            onPress={handlePress}
            disabled={syncStatus === 'pending'}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ rotate: syncStatus === 'pending' ? rotate : '0deg' }] }}>
                <MaterialCommunityIcons
                    name={getIcon(syncStatus)}
                    size={28}
                    color={getColor(syncStatus)}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    btn: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
});
