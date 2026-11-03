import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../context/ThemeContext'; // ✅ اضافه شد
import { SPACING, TYPOGRAPHY, RADIUS } from '../../theme'; // COLORS حذف شد

interface MarkdownReportProps {
    content: string;
}

export const MarkdownReport: React.FC<MarkdownReportProps> = ({ content }) => {
    const { colors } = useTheme(); // ✅ دریافت تم داینامیک

    if (!content || content.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>محتوایی برای نمایش وجود ندارد</Text>
            </View>
        );
    }

    // ✅ استایل‌های داینامیک بر اساس تم
    const markdownStyles = {
        body: {
            color: colors.text,
            fontSize: TYPOGRAPHY.fontSize.md,
            lineHeight: TYPOGRAPHY.fontSize.md * 1.9,
            textAlign: 'right',
        },
        heading1: {
            fontSize: TYPOGRAPHY.fontSize.xxl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: colors.primary,
            marginTop: SPACING.lg,
            marginBottom: SPACING.md,
            borderBottomWidth: 2,
            borderBottomColor: colors.primaryLight,
            paddingBottom: SPACING.sm,
            textAlign: 'right',
        },
        heading2: {
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: colors.text,
            marginTop: SPACING.xl,
            marginBottom: SPACING.md,
            textAlign: 'right',
        },
        heading3: {
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: colors.primary,
            marginTop: SPACING.lg,
            marginBottom: SPACING.sm,
            textAlign: 'right',
        },
        paragraph: {
            fontSize: TYPOGRAPHY.fontSize.md,
            color: colors.text,
            lineHeight: TYPOGRAPHY.fontSize.md * 1.9,
            marginBottom: SPACING.md,
            textAlign: 'right',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
        },
        strong: {
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: colors.text,
            backgroundColor: colors.primaryLight + '50',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 6,
        },
        hr: {
            backgroundColor: colors.border,
            height: 1,
            marginVertical: SPACING.xl,
        },
        list_item: {
            flexDirection: 'row-reverse',
            marginBottom: SPACING.sm,
            alignItems: 'flex-start',
        },
        bullet_list: {
            marginBottom: SPACING.md,
            paddingRight: SPACING.md,
            paddingLeft: 0,
        },
        blockquote: {
            backgroundColor: colors.primaryLight,
            borderRightWidth: 4,
            borderRightColor: colors.primary,
            borderLeftWidth: 0,
            padding: SPACING.md,
            marginVertical: SPACING.md,
            borderRadius: RADIUS.md,
        },
    };

    return (
        <View style={styles.container}>
            <Markdown style={markdownStyles}>{content}</Markdown>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        textAlign: 'center',
    },
});