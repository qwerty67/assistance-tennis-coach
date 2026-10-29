import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useAcceptInvitation, useDisconnectCoach, useMyCoaches, usePreviewInvitation, useRespondCoach,
  useSetPrimaryCoach,
} from '@/features/students/api';
import {
  AppText, Avatar, Badge, Button, Card, EmptyState, ErrorView, Header, IconButton, ListRow,
  LoadingView, Screen, SectionHeader, Sheet, TextField,
} from '@/shared/components';
import { colors, palette, spacing } from '@/shared/theme';
import { digits, formatDate } from '@/shared/utils/format';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { confirm } from '@/shared/utils/confirm';
import { useRefresh } from '@/shared/hooks/useRefresh';

export function MyCoachesScreen() {
  const { t } = useTranslation();
  const fb = useFeedback();
  const { data: coaches, isLoading, error, refetch } = useMyCoaches();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const setPrimary = useSetPrimaryCoach();
  const disconnect = useDisconnectCoach();
  const respond = useRespondCoach();
  const acceptInvite = useAcceptInvitation();

  const [addSheet, setAddSheet] = useState(false);
  const [code, setCode] = useState('');
  const [asPrimary, setAsPrimary] = useState(true);

  const preview = usePreviewInvitation(code, addSheet);

  const primaryCoach = coaches?.find((c) => c.is_primary && c.status === 'active');
  const otherCoaches = coaches?.filter((c) => c !== primaryCoach) ?? [];

  const handleSetPrimary = async (coachId: string) => {
    try {
      await setPrimary.mutateAsync(coachId);
      fb.success(t('student.primaryCoachSet'));
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const handleDisconnect = async (coachId: string) => {
    if (!(await confirm(t('student.disconnectCoach'), t('student.disconnectCoachConfirm'), true))) return;
    try {
      await disconnect.mutateAsync(coachId);
      fb.success(t('common.done'));
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const handleRespond = async (coachId: string, accept: boolean) => {
    try {
      await respond.mutateAsync({ coachId, accept });
      fb.success(t('common.saved'));
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const handleConnectWithCode = async () => {
    if (!code.trim()) return;
    try {
      await acceptInvite.mutateAsync({ code: code.trim(), set_as_primary: asPrimary });
      fb.success(t('common.saved'));
      setAddSheet(false);
      setCode('');
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  if (isLoading) return <LoadingView />;
  if (error) return <Screen header={<Header back title={t('student.myCoaches')} />}><ErrorView error={error} onRetry={refetch} /></Screen>;

  return (
    <Screen
      header={<Header back title={t('student.myCoaches')} right={<IconButton icon="plus" onPress={() => setAddSheet(true)} />} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      footer={<Button title={t('student.addCoach')} icon="account-plus-outline" size="lg" onPress={() => setAddSheet(true)} />}
    >
      {/* 1. Primary Active Coach */}
      <SectionHeader title={t('student.activeCoach')} />
      {primaryCoach ? (
        <Card style={{ gap: spacing.md, borderColor: colors.primaryDark, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={primaryCoach.coach_name} size={54} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText variant="h3">{primaryCoach.coach_name}</AppText>
                <Badge label={t('student.activeCoach')} color={colors.primaryDark} bg={colors.primarySoft} />
              </View>
              {primaryCoach.coach_phone ? <AppText variant="small" muted>{digits(primaryCoach.coach_phone)}</AppText> : null}
              {primaryCoach.coach_bio ? <AppText variant="caption" muted numberOfLines={2}>{primaryCoach.coach_bio}</AppText> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
            <AppText variant="caption" muted>{t('student.connectedSince', { date: formatDate(primaryCoach.connected_at) })}</AppText>
            <Button size="sm" variant="danger" title={t('student.disconnectCoach')} onPress={() => handleDisconnect(primaryCoach.coach_id)} />
          </View>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon="account-question-outline"
            title={t('student.activeCoach')}
            description={t('student.notLinkedHint')}
            actionLabel={t('student.addCoach')}
            onAction={() => setAddSheet(true)}
          />
        </Card>
      )}

      {/* 2. Other connected or past coaches */}
      {otherCoaches.length ? (
        <>
          <SectionHeader title={t('student.otherCoaches')} count={otherCoaches.length} />
          {otherCoaches.map((c) => {
            const isPending = c.status === 'pending';
            const isInactive = c.status === 'inactive';
            return (
              <Card key={c.coach_id} style={{ gap: spacing.sm, opacity: isInactive ? 0.75 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Avatar name={c.coach_name} size={44} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AppText variant="bodyMedium">{c.coach_name}</AppText>
                      <Badge
                        label={t(`students.status.${c.status}`)}
                        color={isPending ? colors.info : isInactive ? colors.textMuted : colors.navy}
                        bg={isPending ? colors.infoSoft : colors.surfaceMuted}
                      />
                    </View>
                    {c.coach_phone ? <AppText variant="caption" muted>{digits(c.coach_phone)}</AppText> : null}
                  </View>
                </View>

                {isPending ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                    <Button size="sm" title={t('student.acceptInvite')} icon="check" onPress={() => handleRespond(c.coach_id, true)} style={{ flex: 1 }} />
                    <Button size="sm" variant="outline" title={t('student.rejectInvite')} onPress={() => handleRespond(c.coach_id, false)} style={{ flex: 1 }} />
                  </View>
                ) : !isInactive ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                    <Button size="sm" variant="outline" title={t('student.setAsPrimary')} icon="star-outline" onPress={() => handleSetPrimary(c.coach_id)} style={{ flex: 1 }} />
                    <Button size="sm" variant="danger" title={t('student.disconnectCoach')} onPress={() => handleDisconnect(c.coach_id)} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}

      {/* Sheet for adding coach via code */}
      <Sheet visible={addSheet} onClose={() => setAddSheet(false)} title={t('student.addCoach')}>
        <View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}>
          <TextField
            label={t('student.enterInviteCode')}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder={t('student.inviteCodePlaceholder')}
            autoCapitalize="characters"
            ltr
          />

          {preview.data ? (
            <Card style={{ gap: spacing.sm, backgroundColor: colors.surfaceMuted }}>
              <AppText variant="caption" muted>{t('student.coachDetails')}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={preview.data.coach_name} size={42} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium">{preview.data.coach_name}</AppText>
                  {preview.data.coach_phone ? <AppText variant="caption" muted>{digits(preview.data.coach_phone)}</AppText> : null}
                </View>
              </View>
              {preview.data.coach_bio ? <AppText variant="caption" muted>{preview.data.coach_bio}</AppText> : null}
            </Card>
          ) : preview.isLoading && code.length >= 6 ? (
            <AppText variant="caption" muted align="center">{t('common.details')}...</AppText>
          ) : null}

          <Button
            title={t('student.connectCoach')}
            icon="check"
            onPress={handleConnectWithCode}
            loading={acceptInvite.isPending}
            disabled={!code.trim() || acceptInvite.isPending}
            size="lg"
          />
        </View>
      </Sheet>
    </Screen>
  );
}
