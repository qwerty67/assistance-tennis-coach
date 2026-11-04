import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/shared/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  background?: string;
  /** Floating elements (FAB) rendered above the content, outside the scroll view. */
  overlay?: ReactNode;
}

/** Page container: safe area, optional header/footer, scroll + pull-to-refresh, keyboard avoiding. */
export function Screen({ children, scroll = true, header, footer, padded = true, refreshing, onRefresh, contentStyle, edges = ['top'], background = colors.background, overlay }: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, { paddingBottom: 120 + bottomInset }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {body}
        {footer ? <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, spacing.lg) }]}>{footer}</View> : null}
        {overlay}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  footer: {
    padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
});
