import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { IconButton } from './Button';
import { colors, spacing } from '@/shared/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  large?: boolean;
}

export function Header({ title, subtitle, back, right, large }: Props) {
  return (
    <View style={styles.row}>
      {back ? (
        <IconButton icon="arrow-right" bg={colors.surface} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="back" />
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant={large ? 'h1' : 'h2'} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  right: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
