import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { BOTTOM_TABS } from '../../navigation/tabConfig';

interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
                                                              state,
                                                              descriptors,
                                                              navigation,
                                                          }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[
                styles.tabBar,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                }
            ]}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const tab = BOTTOM_TABS.find((t) => t.name === route.name);
                    if (!tab) return null;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // ✅ دکمه وسط (داشبورد) با حالت Outlined/Filled
                    if (tab.isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.8}
                                style={styles.centerButtonContainer}
                            >
                                <View
                                    style={[
                                        styles.centerButton,
                                        {
                                            // اگر فوکوس بود پر، اگر نبود توخالی
                                            backgroundColor: isFocused ? colors.primary : 'transparent',
                                            // اگر فوکوس نبود، حاشیه (Border) داشته باشد
                                            borderColor: colors.primary,
                                            borderWidth: isFocused ? 0 : 1,
                                            // سایه فقط وقتی پر است نمایش داده شود
                                            shadowColor: isFocused ? colors.primary : 'transparent',
                                            shadowOpacity: isFocused ? 0.3 : 0,
                                        }
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={isFocused ? tab.iconFocused : tab.icon}
                                        size={32}
                                        // اگر فوکوس بود سفید، اگر نبود به رنگ اصلی
                                        color={isFocused ? '#FFFFFF' : colors.primary}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.centerLabel,
                                        {
                                            // متن هم هماهنگ با آیکون تغییر کند
                                            color: isFocused ? colors.primary : colors.textSecondary
                                        }
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    // ✅ بقیه آیتم‌ها (غیر وسط) - بدون تغییر
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tab}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tabContent}>
                                <MaterialCommunityIcons
                                    name={isFocused ? tab.iconFocused : tab.icon}
                                    size={24}
                                    color={isFocused ? colors.primary : colors.textSecondary}
                                />
                                {isFocused && (
                                    <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
                                )}
                                <Text
                                    style={[
                                        styles.label,
                                        { color: isFocused ? colors.primary : colors.textSecondary },
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.md,
        marginHorizontal: SPACING.lg,
        borderRadius: 30,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        top: -10,
    },
    centerButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
    centerLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        marginTop: 4,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
        marginBottom: 2,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        marginTop: 4,
    },
});