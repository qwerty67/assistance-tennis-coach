import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@tennis-platform/design-system';
import { colors, palette, radius, shadows, spacing } from '@tennis-platform/design-system';
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
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);

    return (
        <View style={[styles.container, { paddingBottom: bottomInset }]}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
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

                    const displayLabel = tab.labelFa || tab.label;

                    // Center button (Dashboard / Tennis Ball)
                    if (tab.isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.85}
                                style={styles.centerButtonContainer}
                            >
                                <View
                                    style={[
                                        styles.centerButton,
                                        {
                                            backgroundColor: isFocused ? palette.navy900 : palette.navy800,
                                            borderColor: isFocused ? palette.lime400 : palette.navy700,
                                        },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={isFocused ? tab.iconFocused : tab.icon}
                                        size={26}
                                        color={palette.lime400}
                                    />
                                </View>
                                <AppText
                                    variant="caption"
                                    color={isFocused ? palette.navy800 : colors.textSubtle}
                                    style={{
                                        fontWeight: isFocused ? '700' : '500',
                                        marginTop: 2,
                                    }}
                                >
                                    {displayLabel}
                                </AppText>
                            </TouchableOpacity>
                        );
                    }

                    // Regular tabs
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tab}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tabContent}>
                                <View
                                    style={[
                                        styles.iconPill,
                                        isFocused && { backgroundColor: palette.lime100 },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={isFocused ? tab.iconFocused : tab.icon}
                                        size={22}
                                        color={isFocused ? palette.navy800 : colors.textSubtle}
                                    />
                                </View>
                                <AppText
                                    variant="caption"
                                    color={isFocused ? palette.navy800 : colors.textSubtle}
                                    style={{
                                        fontWeight: isFocused ? '700' : '500',
                                        fontSize: 10,
                                    }}
                                >
                                    {displayLabel}
                                </AppText>
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
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        paddingHorizontal: spacing.xs,
        paddingVertical: 6,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.floating,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    iconPill: {
        width: 44,
        height: 28,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        top: -14,
    },
    centerButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#0B1F3A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default CustomTabBar;
