import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface StatusIndicatorProps {
    status: 'connected' | 'disconnected' | 'on' | 'off' | 'unknown';
    size?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 12 }) => {
    const getColor = () => {
        switch (status) {
            case 'connected':
            case 'on':
                return theme.colors.success;
            case 'disconnected':
            case 'off':
                return theme.colors.deviceOff;
            case 'unknown':
                return theme.colors.warning;
            default:
                return theme.colors.textMuted;
        }
    };

    return (
        <View
            style={[
                styles.indicator,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: getColor(),
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    indicator: {
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
});
