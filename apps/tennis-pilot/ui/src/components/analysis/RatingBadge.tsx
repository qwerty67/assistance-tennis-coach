import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';

interface RatingBadgeProps {
    rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    size?: 'sm' | 'md' | 'lg';
}

const RATING_CONFIG = {
    excellent: {
        color: '#00C853',
        bgColor: '#E8F8EE',
        icon: 'star',
        label: 'Excellent',
    },
    good: {
        color: '#0066FF',
        bgColor: '#E6F0FF',
        icon: 'thumb-up',
        label: 'Good',
    },
    average: {
        color: '#FFB300',
        bgColor: '#FFF8E1',
        icon: 'star-half',
        label: 'Average',
    },
    below_average: {
        color: '#FF6B35',
        bgColor: '#FFF0E8',
        icon: 'trending-down',
        label: 'Below Avg',
    },
    poor: {
        color: '#FF3B30',
        bgColor: '#FFEBEE',
        icon: 'alert-circle',
        label: 'Poor',
    },
};

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, size = 'md' }) => {
    const config = RATING_CONFIG[rating];

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return styles.sm;
            case 'lg':
                return styles.lg;
            default:
                return styles.md;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: config.bgColor }, getSizeStyle()]}>
            <MaterialCommunityIcons
                name={config.icon}
                size={size === 'lg' ? 20 : size === 'sm' ? 14 : 16}
                color={config.color}
            />
            <Text style={[styles.text, { color: config.color }, getSizeStyle()]}>
                {config.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.md,
    },
    sm: {
        paddingVertical: SPACING.xs,
    },
    md: {
        paddingVertical: SPACING.sm,
    },
    lg: {
        paddingVertical: SPACING.md,
    },
    text: {
        marginLeft: SPACING.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});