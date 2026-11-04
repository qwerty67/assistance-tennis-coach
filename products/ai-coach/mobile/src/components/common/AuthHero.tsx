import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, spacing, fonts } from '../../theme';

interface AuthHeroProps {
    title: string;
    subtitle: string;
    badgeIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    badgeLabel?: string;
}

/**
 * Navy hero with court lines - Tennis Platform Unified Identity
 */
export function AuthHero({
    title,
    subtitle,
    badgeIcon = 'tennis-ball',
    badgeLabel,
}: AuthHeroProps) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[palette.navy900, palette.navy700]}
            style={[styles.hero, { paddingTop: Math.max(insets.top, 24) + spacing.xl }]}
        >
            <View style={styles.court} pointerEvents="none">
                <View style={styles.lineH} />
                <View style={styles.lineV} />
                <View style={[styles.lineH, { top: '78%' }]} />
            </View>

            <View style={styles.headerRow}>
                <View style={styles.logo}>
                    <MaterialCommunityIcons name={badgeIcon} size={32} color={palette.navy800} />
                </View>
                {badgeLabel && (
                    <View style={styles.badge}>
                        <MaterialCommunityIcons name="robot" size={14} color="#7C5CFF" />
                        <Text style={styles.badgeText}>{badgeLabel}</Text>
                    </View>
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    hero: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl + spacing.xl,
        gap: spacing.lg,
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: palette.lime400,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(124, 92, 255, 0.18)',
        borderColor: 'rgba(124, 92, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 999,
    },
    badgeText: {
        color: '#ECE7FF',
        fontSize: 12,
        fontFamily: fonts.bold,
    },
    court: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.12,
    },
    lineH: {
        position: 'absolute',
        top: '40%',
        left: -20,
        right: -20,
        height: 2,
        backgroundColor: '#FFFFFF',
    },
    lineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '62%',
        width: 2,
        backgroundColor: '#FFFFFF',
    },
    textContainer: {
        gap: 4,
    },
    title: {
        fontSize: 26,
        fontFamily: fonts.black,
        color: '#FFFFFF',
        textAlign: 'right',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: 'rgba(255, 255, 255, 0.76)',
        textAlign: 'right',
    },
});
export default AuthHero;
