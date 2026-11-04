import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useDeleteTerm, useMonthlyCharges, useTerm, useUpdateShare } from '../api';
import { useSessions } from '@/features/sessions/api';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import {
  AppText, Avatar, Button, Card, ClassTypeBadge, ErrorView, FinancialBadge, Header, KeyValue, ListRow, LoadingView, MoneyField, ProgressBar, Screen, SectionHeader, Sheet,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney, formatRelativeDay } from '@/shared/utils/format';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { confirm } from '@/shared/utils/confirm';
import type { TermMember } from '@/shared/types/api';

export function TermDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: term, isLoading, error, refetch } = useTerm(id);
  const sessions = useSessions({ class_id: term?.class_id }, !!term);
  const share = useUpdateShare(id);
  const monthly = useMonthlyCharges(id);
  const del = useDeleteTerm();
  const fb = useFeedback();
  const [editing, setEditing] = useState<TermMember | null>(null);
  const [value, setValue] = useState<number | null>(null);

  if (isLoading) return <LoadingView />;
  if (error || !term) return <Screen header={<Header back title="" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const list = (sessions.data ?? []).filter((s) => s.term_id === term.id);

  return (
    <Screen onRefresh={refetch} header={<Header back title={term.title} subtitle={term.class_name} />}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ClassTypeBadge type={term.class_type} />
          <AppText variant="small" muted>{t(`terms.type.${term.term_type}`)}</AppText>
        </View>
        {term.total_sessions ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="small">{t('students.usedSessions', { u: digits(term.sessions_completed), t: digits(term.total_sessions) })}</AppText>
              <AppText variant="small" muted>{t('terms.cancelledN', { n: digits(term.sessions_cancelled) })}</AppText>
            </View>
            <ProgressBar value={term.sessions_completed / term.total_sessions} />
          </>
        ) : null}
        <KeyValue label={t('terms.startDate')} value={formatDate(term.start_date)} />
        {term.end_date ? <KeyValue label={t('terms.endDate')} value={formatDate(term.end_date)} /> : null}
        <KeyValue label={t('classes.sessionPrice')} value={formatMoney(term.session_price)} />
        <KeyValue label={t('classes.courtCost')} value={formatMoney(term.court_cost)} />
        <KeyValue label={t('classes.coachIncome')} value={formatMoney(term.coach_income)} color={colors.primaryDark} />
        {term.monthly_fee ? <KeyValue label={t('classes.monthlyFee')} value={formatMoney(term.monthly_fee)} /> : null}
        <KeyValue label={t('classes.billingMode')} value={t(`classes.billing.${term.billing_mode}`)} />
        <KeyValue label={t('terms.paymentPlan')} value={t(`terms.plan.${term.payment_plan}`)} />
        <KeyValue label={t('terms.totalPrice')} value={formatMoney(term.total_price)} strong />
      </Card>

      {term.makeup_needed ? (
        <Card tone="warning" onPress={() => router.push('/coach/makeups')}>
          <AppText variant="bodyMedium" color={colors.warning}>{t('terms.makeupNeeded', { n: digits(term.makeup_needed) })}</AppText>
          {term.makeup_suggestion ? <AppText variant="small">{term.makeup_suggestion}</AppText> : null}
        </Card>
      ) : null}

      <SectionHeader title={t('terms.members')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {term.members.map((m, i) => (
          <ListRow key={m.student_id} left={<Avatar name={m.full_name} size={38} />} title={m.full_name}
            subtitle={`${t('terms.sharePerSession')}: ${formatMoney(m.share_per_session)}${m.share_overridden ? ' ✎' : ''}${m.remaining_sessions != null ? ' · ' + t('students.remaining', { n: digits(m.remaining_sessions) }) : ''}`}
            right={<FinancialBadge status={m.financial_status} />}
            onPress={() => { setEditing(m); setValue(m.share_per_session); }} divider={i < term.members.length - 1} />
        ))}
      </Card>
      <AppText variant="caption" muted>{t('terms.shareEditHint')}</AppText>

      {term.term_type === 'monthly' ? (
        <Button variant="secondary" icon="receipt" title={t('terms.issueMonthly')} loading={monthly.isPending} onPress={async () => {
          try {
            const r = await monthly.mutateAsync(dayjs().format('YYYY-MM'));
            fb.success(t('terms.issued', { n: digits(r.created) }));
          } catch (e) { fb.error(errorMessage(e)); }
        }} />
      ) : null}

      <SectionHeader title={t('terms.sessions')} count={list.length} action={t('sessions.add')} onAction={() => router.push(`/coach/session/form?classId=${term.class_id}&termId=${term.id}`)} />
      {list.map((s, i) => <SessionCard key={s.id} session={s} index={i} showDate={formatRelativeDay(s.start_at)} onPress={() => router.push(`/coach/session/${s.id}`)} />)}

      <Button variant="danger" icon="trash-can-outline" title={t('terms.delete')} onPress={async () => {
        if (!(await confirm(t('terms.deleteConfirm'), t('terms.deleteHint'), true))) return;
        try { await del.mutateAsync(id); router.back(); } catch (e) { fb.error(errorMessage(e)); }
      }} />

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.full_name}
        footer={<Button title={t('common.save')} loading={share.isPending} onPress={async () => {
          if (!editing || value == null) return;
          try { await share.mutateAsync({ sid: editing.student_id, share: value }); fb.success(t('common.saved')); setEditing(null); } catch (e) { fb.error(errorMessage(e)); }
        }} />}>
        <MoneyField label={t('terms.sharePerSession')} value={value} onChange={setValue} />
        <AppText variant="small" muted>{t('terms.shareEditHint')}</AppText>
      </Sheet>
    </Screen>
  );
}
