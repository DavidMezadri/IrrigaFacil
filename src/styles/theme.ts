// Theme configuration with modern, vibrant colors

export const theme = {
    colors: {
        // Primary colors - vibrant blue/green for agriculture theme
        primary: '#10B981', // Emerald green
        primaryDark: '#059669',
        primaryLight: '#34D399',

        // Secondary colors
        secondary: '#3B82F6', // Bright blue
        secondaryDark: '#2563EB',
        secondaryLight: '#60A5FA',

        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Device status
        deviceOn: '#10B981',
        deviceOff: '#6B7280',
        deviceUnknown: '#F59E0B',

        // Background colors (dark mode)
        background: '#0F172A', // Dark slate
        backgroundLight: '#1E293B',
        backgroundCard: '#1E293B',

        // Text colors
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',

        // Border and divider
        border: '#334155',
        divider: '#334155',

        // Sensor type colors
        sensorHumidity: '#3B82F6',
        sensorTemperature: '#EF4444',
        sensorWind: '#8B5CF6',
        sensorRain: '#06B6D4',
        sensorSoilMoisture: '#84CC16',
        sensorPressure: '#F59E0B',
        sensorCustom: '#6B7280',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
        xxl: 32,
        xxxl: 40,
    },

    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 1.0,
            elevation: 1,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,
            elevation: 8,
        },
    },
};

export type Theme = typeof theme;
