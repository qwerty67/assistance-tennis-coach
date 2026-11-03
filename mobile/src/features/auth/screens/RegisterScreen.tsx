import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AuthHero } from '../components/AuthHero';
import { registerSchema, RegisterForm } from '../schemas';
import { useAuth } from '../store';
import { AppText, Button, FormChips, FormText, PressableScale } from '@/shared/components';
import { colors, radius, shadows, spacing } from '@/shared/theme';
import { errorMessage } from '@/shared/utils/errors';
import { useFeedback } from '@/shared/hooks/useFeedback';

export function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuth((s) => s.register);
  const fb = useFeedback();
  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', password: '', role: 'coach' },
  });
  const onSubmit = handleSubmit(async (v) => {
    try {
      const newUser = await register(registerSchema.parse(v));
      fb.success(t('auth.registered'));
      if (newUser.role === 'coach') {
        router.replace('/coach/subscription');
      } else {
        router.replace('/');
      }
    } catch (e) {
      fb.error(errorMessage(e));
    }
  });
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHero title={t('auth.createAccount')} subtitle={t('auth.registerSubtitle')} />
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.card}>
          <FormChips control={control} name="role" label={t('auth.role')} options={[
            { value: 'coach', label: t('auth.coach'), icon: 'whistle-outline' },
            { value: 'student', label: t('auth.student'), icon: 'account-school-outline' },
          ]} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><FormText control={control} name="first_name" label={t('auth.firstName')} /></View>
            <View style={{ flex: 1 }}><FormText control={control} name="last_name" label={t('auth.lastName')} /></View>
          </View>
          <FormText control={control} name="email" label={t('auth.email')} icon="email-outline" ltr autoCapitalize="none" keyboardType="email-address" />
          <FormText control={control} name="phone" label={t('auth.phone')} icon="phone-outline" ltr keyboardType="phone-pad" placeholder="09121234567" />
          <FormText control={control} name="password" label={t('auth.password')} icon="lock-outline" secureTextEntry ltr hint={t('validation.passwordRule')} />
          <Button title={t('auth.register')} onPress={onSubmit} loading={formState.isSubmitting} size="lg" variant="navy" />
          <View style={styles.row}>
            <AppText muted>{t('auth.haveAccount')}</AppText>
            <Link href="/login" asChild>
              <PressableScale><AppText color={colors.primaryDark} variant="bodyMedium">{t('auth.login')}</AppText></PressableScale>
            </Link>
          </View>
        </Animated.View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 60 },
  card: { marginTop: -spacing.xxxl, marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, ...shadows.floating },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
});
