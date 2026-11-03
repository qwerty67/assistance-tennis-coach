import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChangePassword, useCoachSettings, useSaveSettings } from '../api';
import { useCurrentSubscription } from '@/features/subscription/api';
import { useAuth } from '@/features/auth/store';
import { ServerSettings } from '@/features/auth/components/ServerSettings';
import { AppText, Avatar, Badge, Button, Card, Chips, Header, ListRow, Screen, SectionHeader, Sheet, TextField } from '@/shared/components';
import { colors, palette, spacing } from '@/shared/theme';
import { digits, formatDate } from '@/shared/utils/format';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { confirm } from '@/shared/utils/confirm';
import i18n from '@/shared/i18n';
import type { AttendanceStatus } from '@/shared/types/api';

const RULES: AttendanceStatus[] = ['present', 'absent', 'excused', 'unexcused', 'makeup', 'cancelled'];

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const coach = user?.role === 'coach';
  const settings = useCoachSettings();
  const currentSub = useCurrentSubscription(coach);
  const saveSettings = useSaveSettings();
  const changePw = useChangePassword();
  const fb = useFeedback();
  const [pwSheet, setPwSheet] = useState(false);
  const [server, setServer] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [rules, setRules] = useState<Record<string, boolean>>({});

  useEffect(() => { if (settings.data) setRules(settings.data.charge_rules); }, [settings.data]);
  const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`;

  return (
    <Screen header={<Header back title={t('profile.title')} />}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={name} size={60} />
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{name}</AppText>
          <AppText variant="small" muted>{t(`auth.${user?.role ?? 'coach'}`)}</AppText>
          <AppText variant="small" muted>{user?.email}</AppText>
          <AppText variant="small" muted>{digits(user?.phone ?? '')}</AppText>
        </View>
      </Card>

      {coach ? (
        <>
          <SectionHeader title={t('subscription.currentPlan')} />
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="h3">
                  {currentSub.data?.is_active ? currentSub.data.title : t('subscription.noActiveSubscription')}
                </AppText>
                <AppText variant="caption" muted>
                  {currentSub.data?.is_active
                    ? t('subscription.activeUntil', { date: currentSub.data.expires_at ? formatDate(currentSub.data.expires_at) : '-' })
                    : t('subscription.expired')}
                </AppText>
              </View>
              {currentSub.data?.is_active ? (
                <Badge
                  label={t('subscription.daysRemaining', { n: digits(currentSub.data.days_left ?? 0) })}
                  color={colors.primaryDark}
                  bg={colors.primarySoft}
                />
              ) : (
                <Badge label={t('subscription.expired')} color={palette.red500} bg={palette.red100} />
              )}
            </View>
            <Button
              title={currentSub.data?.is_active ? t('subscription.upgradePlan') : t('subscription.extendOrUpgrade')}
              variant="outline"
              size="sm"
              icon="medal-outline"
              onPress={() => router.push('/coach/subscription')}
            />
          </Card>

          <SectionHeader title={t('profile.tools')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow icon="clipboard-text-outline" title={t('training.title')} onPress={() => router.push('/coach/training')} divider />
            <ListRow icon="calendar-refresh-outline" title={t('makeups.title')} onPress={() => router.push('/coach/makeups')} divider />
            <ListRow icon="bell-outline" title={t('notifications.title')} onPress={() => router.push('/notifications')} />
          </Card>

          <SectionHeader title={t('profile.chargeRules')} />
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="small" muted>{t('profile.chargeRulesHint')}</AppText>
            {RULES.map((r) => (
              <View key={r} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText>{t(`attendance.status.${r}`)}</AppText>
                <Switch value={!!rules[r]} onValueChange={(v) => setRules({ ...rules, [r]: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
              </View>
            ))}
            <Chips size="sm" label={t('profile.reminderHours')} value={settings.data?.reminder_hours ?? 3}
              onChange={(h) => saveSettings.mutate({ reminder_hours: h })} options={[1, 2, 3, 6, 12, 24].map((h) => ({ value: h, label: t('profile.hoursN', { n: digits(h) }) }))} />
            <Button title={t('common.save')} size="sm" loading={saveSettings.isPending} onPress={async () => {
              try { await saveSettings.mutateAsync({ charge_rules: rules as Record<AttendanceStatus, boolean> }); fb.success(t('common.saved')); } catch (e) { fb.error(errorMessage(e)); }
            }} />
          </Card>
        </>
      ) : (
        <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
          <ListRow icon="account-tie-outline" title={t('student.myCoaches')} onPress={() => router.push('/student/coaches')} divider />
          <ListRow icon="bell-outline" title={t('notifications.title')} onPress={() => router.push('/notifications')} />
        </Card>
      )}

      <SectionHeader title={t('profile.app')} />
      <Card style={{ gap: spacing.md }}>
        <Chips size="sm" label={t('profile.language')} value={i18n.language} onChange={(l) => i18n.changeLanguage(l)} options={[{ value: 'fa', label: 'فارسی' }, { value: 'en', label: 'English' }]} />
        <ListRow icon="lock-reset" title={t('profile.changePassword')} onPress={() => setPwSheet(true)} divider />
        <ListRow icon="server-network" title={t('auth.serverSettings')} onPress={() => setServer(true)} divider />
        <ListRow icon="logout" title={t('profile.logout')} onPress={async () => {
          if (await confirm(t('profile.logout'), t('profile.logoutConfirm'), true)) logout();
        }} />
      </Card>
      <AppText variant="caption" muted align="center">{t('profile.version', { v: '1.0.0' })}</AppText>

      <Sheet visible={pwSheet} onClose={() => setPwSheet(false)} title={t('profile.changePassword')}>
        <View style={{ gap: spacing.md }}>
          <TextField label={t('profile.currentPassword')} value={cur} onChangeText={setCur} secureTextEntry ltr />
          <TextField label={t('profile.newPassword')} value={next} onChangeText={setNext} secureTextEntry ltr hint={t('validation.passwordRule')} />
          <Button title={t('common.save')} loading={changePw.isPending} onPress={async () => {
            try {
              await changePw.mutateAsync({ current_password: cur, new_password: next });
              fb.success(t('profile.passwordChanged'));
              setPwSheet(false); setCur(''); setNext('');
            } catch (e) { fb.error(errorMessage(e)); }
          }} />
        </View>
      </Sheet>

      <ServerSettings visible={server} onClose={() => setServer(false)} />
    </Screen>
  );
}
