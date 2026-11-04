import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme, colors } = useTheme();

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.button, { backgroundColor: colors.surfaceVariant }]}
            activeOpacity={0.7}
        >
            <MaterialCommunityIcons
                name={isDark ? 'weather-sunny' : 'weather-night'}
                size={20}
                color={isDark ? colors.accent : colors.primary}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});