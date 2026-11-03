import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../theme';
import {useTheme} from "../../context/ThemeContext";

interface ShotDistributionChartProps {
    winners: number;
    forcedErrors: number;
    unforcedErrors: number;
}

export const ShotDistributionChart: React.FC<ShotDistributionChartProps> = ({
                                                                                winners,
                                                                                forcedErrors,
                                                                                unforcedErrors,
                                                                            }) => {
    const total = winners + forcedErrors + unforcedErrors;
    const { colors } = useTheme();

    if (total === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>داده‌ای برای نمایش نمودار ثبت نشده است</Text>
            </View>
        );
    }

    // فقط داده‌هایی که مقدارشان بزرگتر از صفر است را نمایش می‌دهیم
    const data = [
        { value: winners, color: COLORS.success, label: 'ضربات برنده', text: `${winners}` },
        { value: forcedErrors, color: COLORS.warning, label: 'خطای مجبور شده', text: `${forcedErrors}` },
        { value: unforcedErrors, color: COLORS.error, label: 'خطای غیرمجبور', text: `${unforcedErrors}` },
    ].filter(item => item.value > 0);

    return (
        <View style={[styles.container, SHADOWS.sm,{backgroundColor: colors.surface}]}>
            <Text style={[styles.title,{color: colors.text}]}>توزیع نتایج ضربات نهایی</Text>

            <View style={styles.chartWrapper}>
                <PieChart
                    data={data}
                    donut
                    showGradient
                    sectionAutoFocus
                    radius={85}
                    innerRadius={55}
                    innerCircleColor={COLORS.surface}
                    focusOnPress
                    centerLabelComponent={() => (
                        <View style={styles.centerLabel}>
                            <Text style={styles.centerValue}>{total}</Text>
                            <Text style={styles.centerText}>ضربه نهایی</Text>
                        </View>
                    )}
                />
            </View>

            <View style={styles.legendContainer}>
                {data.map((item, index) => (
                    <View key={index} style={[styles.legendItem,{backgroundColor: colors.surfaceVariant}]}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <View style={styles.legendTextContainer}>
                            <Text style={styles.legendLabel}>{item.label}</Text>
                            <Text style={[styles.legendValue, { color: item.color }]}>{item.text}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    centerLabel: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerValue: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    centerText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    legendContainer: {
        gap: SPACING.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    legendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: SPACING.md,
    },
    legendTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legendLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    legendValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
});