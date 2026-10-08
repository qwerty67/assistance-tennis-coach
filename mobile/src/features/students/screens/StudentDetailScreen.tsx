import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDeleteStudent, useStudent, useStudentAccount, useStudentStatus } from '../api';
import {
  AppText, AttendanceBadge, Avatar, Badge, Button, Card, ChargeBadge, ClassTypeBadge, EmptyState, ErrorView, FinancialBadge,
  Header, IconButton, KeyValue, ListRow, LoadingView, ProgressBar, Screen, SectionHeader, SegmentedControl,
} from '@/shared/components';
import { attendanceColors, colors, financialStatusColors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';
import { confirm } from '@/shared/utils/confirm';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { useRefresh } from '@/shared/hooks/useRefresh';

type Tab = 'overview' | 'attendance' | 'finance' | 'training';

export function StudentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, isLoading, error, refetch } = useStudent(id);
  const account = useStudentAccount(id);
  const status = useStudentStatus(id);
  const del = useDeleteStudent();
  const fb = useFeedback();
  const [tab, setTab] = useState<Tab>('overview');
  const { refreshing, onRefresh } = useRefresh(refetch, account.refetch);

  if (isLoading) return <LoadingView />;
  if (error || !s) return <Screen header={<Header back title="" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const acc = account.data;
  const name = `${s.first_name} ${s.last_name}`;
  const fs = financialStatusColors[acc?.status ?? 'settled'];

  const onDelete = async () => {
    if (!(await confirm(t('students.deleteConfirm'), t('students.deleteHint'), true))) return;
    try {
      await del.mutateAsync(id);
      fb.success(t('common.deleted'));
      router.back();
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={<Header back title={name} right={<IconButton icon="pencil-outline" onPress={() => router.push(`/coach/student/form?id=${id}`)} />} />}
    >
      <Card>
        <View style={styles.profile}>
          <Avatar name={name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="h2">{name}</AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Badge label={t(`students.level.${s.level}`)} color={colors.navy} bg={colors.surfaceMuted} />
              {s.age ? <Badge label={t('students.ageN', { n: digits(s.age) })} color={colors.textMuted} bg={colors.surfaceMuted} /> : null}
              {s.has_account ? <Badge label={t('students.hasApp')} color={colors.info} bg={colors.infoSoft} /> : null}
              {s.status === 'inactive' ? <Badge label={t('students.status.inactive')} color={colors.danger} bg={colors.dangerSoft} /> : null}
            </View>
            {s.phone ? <AppText variant="small" muted>{digits(s.phone)}</AppText> : null}
          </View>
        </View>
        <View style={[styles.balance, { backgroundColor: fs.soft }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="small" color={fs.main}>{t('finance.balance')}</AppText>
            <AppText variant="h2" color={fs.main}>{formatMoney(Math.abs(acc?.debt || acc?.credit || 0))}</AppText>
          </View>
          {acc ? <FinancialBadge status={acc.status} /> : null}
        </View>
        <View style={styles.actions}>
          <Button size="sm" title={t('finance.recordPayment')} icon="cash-plus" onPress={() => router.push(`/coach/payment/new?studentId=${id}`)} style={{ flex: 1 }} />
          <Button size="sm" variant="outline" title={t('terms.new')} icon="calendar-plus" onPress={() => router.push(`/coach/term/new?studentId=${id}`)} style={{ flex: 1 }} />
        </View>
      </Card>

      <SegmentedControl<Tab> value={tab} onChange={setTab} options={[
        { value: 'overview', label: t('students.tabs.overview') },
        { value: 'attendance', label: t('students.tabs.attendance') },
        { value: 'finance', label: t('students.tabs.finance') },
        { value: 'training', label: t('students.tabs.training') },
      ]} />

      {tab === 'overview' ? (
        <>
          <SectionHeader title={t('students.activeTerms')} />
          {s.terms.length ? s.terms.map((term, i) => (
            <Card key={term.term_id} index={i} onPress={() => router.push(`/coach/term/${term.term_id}`)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="bodyMedium" style={{ flex: 1 }}>{term.term_title}</AppText>
                <ClassTypeBadge type={term.class_type} />
              </View>
              <AppText variant="small" muted>{term.class_name}</AppText>
              {term.total_sessions ? (
                <View style={{ gap: 6, marginTop: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="small">{t('students.usedSessions', { u: digits(term.used_sessions), t: digits(term.total_sessions) })}</AppText>
                    <AppText variant="small" color={(term.remaining_sessions ?? 0) <= 2 ? colors.danger : colors.primaryDark}>{t('students.remaining', { n: digits(term.remaining_sessions ?? 0) })}</AppText>
                  </View>
                  <ProgressBar value={term.used_sessions / term.total_sessions} />
                </View>
              ) : null}
            </Card>
          )) : <Card><EmptyState icon="calendar-blank-outline" title={t('students.noTerms')} actionLabel={t('terms.new')} onAction={() => router.push(`/coach/term/new?studentId=${id}`)} /></Card>}

          <SectionHeader title={t('students.coachingProfile')} />
          <Card style={{ gap: spacing.md }}>
            {[['strengths', s.strengths], ['weaknesses', s.weaknesses], ['goals', s.goals], ['coachNotes', s.coach_notes]].map(([k, v]) => (
              <View key={k as string} style={{ gap: 2 }}>
                <AppText variant="small" muted>{t(`students.${k}`)}</AppText>
                <AppText>{(v as string) || '—'}</AppText>
              </View>
            ))}
            {s.start_date ? <KeyValue label={t('students.startDate')} value={formatDate(s.start_date)} /> : null}
          </Card>

          <SectionHeader title={t('students.manage')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow icon={s.status === 'active' ? 'account-off-outline' : 'account-check-outline'} title={s.status === 'active' ? t('students.deactivate') : t('students.activate')}
              onPress={() => status.mutate(s.status !== 'active')} divider />
            <ListRow icon="trash-can-outline" title={t('students.delete')} onPress={onDelete} />
          </Card>
        </>
      ) : null}

      {tab === 'attendance' ? (
        <>
          <View style={styles.statRow}>
            {(['present', 'excused', 'unexcused', 'makeup'] as const).map((k) => (
              <View key={k} style={[styles.stat, { backgroundColor: attendanceColors[k].soft }]}>
                <AppText variant="h2" color={attendanceColors[k].main} align="center">{digits(s.attendance_stats[k] ?? 0)}</AppText>
                <AppText variant="caption" color={attendanceColors[k].main} align="center">{t(`attendance.status.${k}`)}</AppText>
              </View>
            ))}
          </View>
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {s.recent_attendance.length ? s.recent_attendance.map((a, i) => (
              <ListRow key={a.id} title={a.class_name} subtitle={`${formatDate(a.start_at, 'dddd D MMMM')}${a.absence_reason ? ' · ' + t(`attendance.reason.${a.absence_reason}`) : ''}${!a.is_chargeable ? ' · ' + t('attendance.notCharged') : ''}`}
                right={<AttendanceBadge status={a.status} />} onPress={() => router.push(`/coach/session/${a.session_id}`)} chevron={false} divider={i < s.recent_attendance.length - 1} />
            )) : <EmptyState icon="clipboard-text-outline" title={t('attendance.empty')} />}
          </Card>
        </>
      ) : null}

      {tab === 'finance' && acc ? (
        <>
          <Card style={{ gap: 2 }}>
            <KeyValue label={t('finance.totalTuition')} value={formatMoney(acc.total_tuition)} />
            <KeyValue label={t('finance.paid')} value={formatMoney(acc.paid_amount)} color={colors.primaryDark} />
            <KeyValue label={t('finance.remaining')} value={formatMoney(acc.remaining_amount)} color={acc.remaining_amount ? colors.danger : undefined} strong />
            {acc.credit ? <KeyValue label={t('finance.credit')} value={formatMoney(acc.credit)} color={colors.info} /> : null}
            {acc.overdue_amount ? <KeyValue label={t('finance.overdue')} value={formatMoney(acc.overdue_amount)} color={colors.danger} /> : null}
            {acc.number_of_sessions ? <KeyValue label={t('finance.sessions')} value={t('students.usedSessions', { u: digits(acc.used_sessions), t: digits(acc.number_of_sessions) })} /> : null}
          </Card>
          <SectionHeader title={t('finance.charges')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {acc.charges.length ? acc.charges.map((c, i) => (
              <ListRow key={c.id} title={c.description || t(`finance.kind.${c.kind}`)} subtitle={`${formatMoney(c.amount)}${c.due_date ? ' · ' + t('finance.due', { d: formatDate(c.due_date) }) : ''}`}
                right={<ChargeBadge status={c.status} />} divider={i < acc.charges.length - 1} />
            )) : <EmptyState icon="receipt" title={t('finance.noCharges')} />}
          </Card>
          <SectionHeader title={t('finance.payments')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {acc.payments.length ? acc.payments.map((p, i) => (
              <ListRow key={p.id} icon="cash-check" title={formatMoney(p.amount)} subtitle={`${formatDate(p.paid_at)} · ${t(`finance.method.${p.method}`)}${p.description ? ' · ' + p.description : ''}`} divider={i < acc.payments.length - 1} />
            )) : <EmptyState icon="cash-remove" title={t('finance.noPayments')} />}
          </Card>
        </>
      ) : null}

      {tab === 'training' ? (
        <>
          <Button title={t('training.newPlan')} icon="plus" variant="secondary" onPress={() => router.push(`/coach/training/form?studentId=${id}`)} />
          {s.training_plans.length ? s.training_plans.map((p, i) => (
            <Card key={p.id} index={i} onPress={() => router.push(`/coach/training/${p.id}`)}>
              <AppText variant="bodyMedium">{p.title}</AppText>
              <AppText variant="small" muted>{t(`training.planStatus.${p.status}`)}{p.end_date ? ` · ${t('training.until', { d: formatDate(p.end_date) })}` : ''}</AppText>
            </Card>
          )) : <Card><EmptyState icon="clipboard-text-outline" title={t('training.empty')} /></Card>}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  balance: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: spacing.md, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, borderRadius: 14, paddingVertical: spacing.md },
});
