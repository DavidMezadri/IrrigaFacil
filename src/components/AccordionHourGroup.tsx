import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HourGroup, DbLogEntry } from '../services/dbService';
import { theme } from '../styles/theme';

interface Props {
    group: HourGroup;
}

export const AccordionHourGroup: React.FC<Props> = ({ group }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return theme.colors.error;
            case 'WARN': return '#F5A623'; // Laranja
            case 'SUCCESS': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return 'close-circle';
            case 'WARN': return 'alert';
            case 'SUCCESS': return 'check-circle';
            default: return 'information';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header (Mantein always visible) */}
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.header}
                onPress={toggleExpand}
            >
                <View style={styles.headerTitle}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={20}
                        color={theme.colors.text}
                    />
                    <Text style={styles.hourText}>{group.hour}</Text>
                </View>

                <View style={styles.badgesContainer}>
                    {group.summary.errors > 0 && (
                        <View style={[styles.badge, styles.badgeError]}>
                            <Text style={styles.badgeText}>{group.summary.errors} Erros</Text>
                        </View>
                    )}
                    {group.summary.warns > 0 && (
                        <View style={[styles.badge, styles.badgeWarn]}>
                            <Text style={[styles.badgeText, { color: '#B37B1C' }]}>{group.summary.warns} Alertas</Text>
                        </View>
                    )}
                    <View style={[styles.badge, styles.badgeNeutral]}>
                        <Text style={[styles.badgeText, { color: theme.colors.textMuted }]}>{group.summary.total} Total</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={theme.colors.textMuted}
                    />
                </View>
            </TouchableOpacity>

            {/* List of items inside the hour */}
            {expanded && (
                <View style={styles.content}>
                    {group.logs.map((log: DbLogEntry) => {
                        const date = new Date(log.timestamp);
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

                        return (
                            <View key={log.id} style={styles.logRow}>
                                <View style={styles.logHeader}>
                                    <View style={styles.logTimeCategory}>
                                        <Text style={styles.logTime}>{timeStr}</Text>
                                        <Text style={styles.logCategory}>{log.category}</Text>
                                    </View>
                                    <View style={styles.logLevelBadge}>
                                        <MaterialCommunityIcons name={getLevelIcon(log.level)} size={14} color={getLevelColor(log.level)} />
                                        <Text style={[styles.logLevelText, { color: getLevelColor(log.level) }]}>{log.level}</Text>
                                    </View>
                                </View>
                                <Text style={styles.logMessage}>{log.message}</Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    hourText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    badgesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    badgeError: {
        backgroundColor: `${theme.colors.error}22`,
    },
    badgeWarn: {
        backgroundColor: '#F5A62322', // rgba
    },
    badgeNeutral: {
        backgroundColor: theme.colors.background,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.error,
    },
    content: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    logRow: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.border,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    logTimeCategory: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    logTime: {
        fontSize: 11,
        fontWeight: 600,
        color: theme.colors.text,
    },
    logCategory: {
        fontSize: 10,
        backgroundColor: theme.colors.background,
        color: theme.colors.textMuted,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    logLevelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logLevelText: {
        fontSize: 10,
        fontWeight: theme.fontWeight.bold,
    },
    logMessage: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        lineHeight: 20,
    }
});
