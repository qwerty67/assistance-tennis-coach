import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { IconButton } from './Button';
import { colors, radius, spacing } from '@/shared/theme';
import { getDirection } from '@/shared/hooks/useDirection';

interface Props { visible: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }

/** Bottom sheet modal used for quick actions (attendance, pickers, cancel reason...). */
export function Sheet({ visible, onClose, title, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const dir = getDirection();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(220)}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, dir.manual && { direction: 'rtl' }]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.head}>
              <AppText variant="h2" style={{ flex: 1 }}>{title}</AppText>
              <IconButton icon="close" size={34} bg={colors.surfaceMuted} onPress={onClose} />
            </View>
          ) : null}
          <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.sm }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingTop: spacing.md }}>{footer}</View> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
});
