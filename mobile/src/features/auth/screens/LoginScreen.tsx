import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AuthHero } from '../components/AuthHero';
import { ServerSettings } from '../components/ServerSettings';
import { loginSchema, LoginForm } from '../schemas';
import { useAuth } from '../store';
import { AppText, Button, FormText, PressableScale, Icon } from '@/shared/components';
import { colors, radius, shadows, spacing } from '@/shared/theme';
import { errorMessage } from '@/shared/utils/errors';
import { useFeedback } from '@/shared/hooks/useFeedback';

export function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuth((s) => s.login);
  const fb = useFeedback();
  const [server, setServer] = useState(false);
  const { control, handleSubmit, formState, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await login(v.identifier, v.password);
      router.replace('/');
    } catch (e) {
      fb.error(errorMessage(e));
    }
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <AuthHero title={t('auth.welcome')} subtitle={t('auth.subtitle')} />
      <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.card}>
        <AppText variant="h1">{t('auth.login')}</AppText>
        <FormText control={control} name="identifier" label={t('auth.identifier')} icon="account-outline" ltr autoCapitalize="none" placeholder="09xx / name@mail.com" />
        <FormText control={control} name="password" label={t('auth.password')} icon="lock-outline" secureTextEntry ltr />
        <Button title={t('auth.login')} onPress={onSubmit} loading={formState.isSubmitting} size="lg" variant="navy" />
        <View style={styles.row}>
          <AppText muted>{t('auth.noAccount')}</AppText>
          <Link href="/register" asChild>
            <PressableScale><AppText color={colors.primaryDark} variant="bodyMedium">{t('auth.register')}</AppText></PressableScale>
          </Link>
        </View>
        {__DEV__ ? (
          <View style={styles.demo}>
            <AppText variant="small" muted>{t('auth.demo')}</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button size="sm" variant="secondary" title={t('auth.coach')} onPress={() => { setValue('identifier', 'coach@demo.ir'); setValue('password', 'Demo1234'); }} />
              <Button size="sm" variant="secondary" title={t('auth.student')} onPress={() => { setValue('identifier', 'ali@demo.ir'); setValue('password', 'Demo1234'); }} />
            </View>
          </View>
        ) : null}
      </Animated.View>
      <PressableScale onPress={() => setServer(true)} style={styles.server}>
        <Icon name="server-network" size={16} color={colors.textMuted} />
        <AppText variant="small" muted>{t('auth.serverSettings')}</AppText>
      </PressableScale>
      <ServerSettings visible={server} onClose={() => setServer(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: -spacing.xxxl, marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, ...shadows.floating },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  demo: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md },
  server: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.xl },
});
