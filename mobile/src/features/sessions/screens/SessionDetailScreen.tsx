import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCancelSession, useDeleteSession, useRestoreSession, useSession, useUpdateSession } from '../api';
import { AttendanceDraft, AttendanceRow } from '@/features/attendance/components/AttendanceRow';
import { useBulkAttendance } from '@/features/attendance/api';
import {
  AppText, Badge, Button, Card, ClassTypeBadge, DateField, ErrorView, Header, KeyValue, ListRow, LoadingView, Screen, SectionHeader, Sheet, TextField, TimeField,
} from '@/shared/components';
import { classTypeColors, colors, radius, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney, formatTime } from '@/shared/utils/format';
import { combineDateTime, toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { confirm } from '@/shared/utils/confirm';

/** Session detail – coach: attendance, cancel, reschedule, makeup. Student (readonly): info only. */
export function SessionDetailScreen({ readonly = false }: { readonly?: boolean }) {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, isLoading, error, refetch } = useSession(id);
  const bulk = useBulkAttendance();
  const cancel = useCancelSession(id);
  const restore = useRestoreSession(id);
  const update = useUpdateSession(id);
  const del = useDeleteSession();
  const fb = useFeedback();
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [sheet, setSheet] = useState<'cancel' | 'reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [rDate, setRDate] = useState('');
  const [rStart, setRStart] = useState('');
  const [rEnd, setREnd] = useState('');

  useEffect(() => {
    if (!s) return;
    const next: Record<string, AttendanceDraft> = {};
    s.students.forEach((st) => { next[st.student_id] = { status: st.attendance_status, reason: st.absence_reason, chargeable: null }; });
    setDrafts(next);
    setRDate(toISODate(dayjs(s.start_at)));
    setRStart(dayjs(s.start_at).format('HH:mm'));
    setREnd(dayjs(s.end_at).format('HH:mm'));
  }, [s]);

  const allMarked = useMemo(() => !!s && s.students.every((st) => drafts[st.student_id]?.status), [s, drafts]);
  if (isLoading) return <LoadingView />;
  if (error || !s) return <Screen header={<Header back title="" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const tc = classTypeColors[s.class_type];
  const cancelled = s.status === 'cancelled';

  const markAll = () => {
    const next = { ...drafts };
    s.students.forEach((st) => { next[st.student_id] = { status: 'present', reason: null, chargeable: null }; });
    setDrafts(next);
  };

  const saveAttendance = async () => {
    try {
      const records = s.students.filter((st) => drafts[st.student_id]?.status).map((st) => {
        const d = drafts[st.student_id];
        return { student_id: st.student_id, status: d.status!, absence_reason: d.reason, is_chargeable: d.chargeable };
      });
      const res = await bulk.mutateAsync({ sessionId: s.id, records });
      if ((res as { queued?: boolean })?.queued) fb.info(t('attendance.queued'));
      else fb.success(t('attendance.saved'), true);
      refetch();
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const doCancel = async () => {
    try {
      const r = await cancel.mutateAsync(reason || undefined);
      setSheet(null);
      fb.success(t('sessions.cancelled'));
      if (r.makeup_suggestion && (await confirm(t('sessions.makeupTitle'), r.makeup_suggestion))) {
        router.push(`/coach/session/form?mode=makeup&id=${s.id}`);
      }
    } catch (e) { fb.error(errorMessage(e)); }
  };

  const doReschedule = async () => {
    try {
      await update.mutateAsync({ start_at: combineDateTime(rDate, rStart), end_at: combineDateTime(rDate, rEnd), reason: reason || undefined, version: s.version });
      setSheet(null);
      fb.success(t('sessions.rescheduled'));
    } catch (e) { fb.error(errorMessage(e)); }
  };

  return (
    <Screen onRefresh={refetch} header={<Header back title={s.class_name} subtitle={s.term_title ?? undefined} />}
      footer={!readonly && !cancelled && s.students.length ? (
        <Button title={s.attendance_done ? t('attendance.update') : t('attendance.save')} icon="clipboard-check-outline" size="lg" disabled={!allMarked} loading={bulk.isPending} onPress={saveAttendance} />
      ) : undefined}>
      <Card style={{ gap: spacing.sm, borderTopWidth: 4, borderTopColor: tc.main }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ClassTypeBadge type={s.class_type} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {s.is_makeup ? <Badge label={t('sessions.makeup')} color={colors.info} bg={colors.infoSoft} /> : null}
            <Badge label={t(`sessions.status.${s.status}`)} color={cancelled ? colors.danger : s.status === 'completed' ? colors.success : colors.navy} bg={cancelled ? colors.dangerSoft : s.status === 'completed' ? colors.successSoft : colors.surfaceMuted} />
          </View>
        </View>
        <AppText variant="display">{`${formatTime(s.start_at)} – ${formatTime(s.end_at)}`}</AppText>
        <AppText variant="bodyMedium" muted>{formatDate(s.start_at, 'dddd D MMMM YYYY')}</AppText>
        {s.sequence_number ? <KeyValue label={t('sessions.number')} value={s.total_sessions ? `${digits(s.sequence_number)} / ${digits(s.total_sessions)}` : digits(s.sequence_number)} /> : null}
        <KeyValue label={t('classes.duration')} value={`${digits(s.duration_minutes)} ${t('common.minutes')}`} />
        {s.location ? <KeyValue label={t('classes.location')} value={s.location} /> : null}
        {!readonly ? (
          <>
            <KeyValue label={t('classes.sessionPrice')} value={formatMoney(s.session_price)} />
            <KeyValue label={t('classes.courtCost')} value={formatMoney(s.court_cost)} />
            <KeyValue label={t('classes.coachIncome')} value={formatMoney(s.coach_income)} color={colors.primaryDark} />
          </>
        ) : null}
        {s.cancel_reason ? <KeyValue label={t('sessions.cancelReason')} value={s.cancel_reason} /> : null}
        {s.notes ? <AppText variant="small" muted>{s.notes}</AppText> : null}
      </Card>

      {!readonly ? (
        <>
          <SectionHeader title={t('attendance.title')} count={s.students.length} action={!cancelled ? t('attendance.allPresent') : undefined} onAction={markAll} />
          {s.students.map((st) => (
            <AttendanceRow key={st.student_id} student={st} readonly={cancelled} draft={drafts[st.student_id] ?? { status: null, reason: null, chargeable: null }}
              onChange={(d) => setDrafts({ ...drafts, [st.student_id]: d })} />
          ))}
          {s.attendance_done ? <AppText variant="small" color={colors.success} align="center">{t('attendance.done')}</AppText> : null}

          <SectionHeader title={t('sessions.actions')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {!cancelled ? (
              <>
                <ListRow icon="calendar-clock" title={t('sessions.reschedule')} onPress={() => { setReason(''); setSheet('reschedule'); }} divider />
                <ListRow icon="calendar-remove-outline" title={t('sessions.cancel')} onPress={() => { setReason(''); setSheet('cancel'); }} divider />
              </>
            ) : (
              <>
                <ListRow icon="calendar-refresh-outline" title={t('sessions.createMakeup')} subtitle={t('sessions.makeupHint')} onPress={() => router.push(`/coach/session/form?mode=makeup&id=${s.id}`)} divider />
                <ListRow icon="restore" title={t('sessions.restore')} onPress={() => restore.mutate()} divider />
              </>
            )}
            <ListRow icon="trash-can-outline" title={t('sessions.delete')} onPress={async () => {
              if (!(await confirm(t('sessions.deleteConfirm'), undefined, true))) return;
              try { await del.mutateAsync(s.id); router.back(); } catch (e) { fb.error(errorMessage(e)); }
            }} />
          </Card>
        </>
      ) : (
        <>
          <SectionHeader title={t('attendance.myStatus')} />
          {s.students.map((st) => (
            <AttendanceRow key={st.student_id} student={st} readonly draft={{ status: st.attendance_status, reason: st.absence_reason, chargeable: st.is_chargeable }} onChange={() => {}} />
          ))}
        </>
      )}

      {s.history.length ? (
        <>
          <SectionHeader title={t('sessions.history')} />
          <Card style={{ gap: spacing.sm }}>
            {s.history.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.textSubtle, marginTop: 7 }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="small">{t(`sessions.change.${h.change_type}`, { defaultValue: h.change_type })}
                    {h.old_start_at && h.new_start_at ? `: ${formatDate(h.old_start_at, 'D MMM HH:mm')} ← ${formatDate(h.new_start_at, 'D MMM HH:mm')}` : ''}</AppText>
                  <AppText variant="caption" muted>{`${formatDate(h.created_at, 'D MMMM HH:mm')}${h.reason ? ' · ' + h.reason : ''}`}</AppText>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Sheet visible={sheet === 'cancel'} onClose={() => setSheet(null)} title={t('sessions.cancel')}
        footer={<Button variant="danger" title={t('sessions.confirmCancel')} loading={cancel.isPending} onPress={doCancel} />}>
        <AppText variant="small" muted>{t('sessions.cancelHint')}</AppText>
        <TextField label={t('sessions.cancelReason')} value={reason} onChangeText={setReason} placeholder={t('sessions.cancelPlaceholder')} />
      </Sheet>
      <Sheet visible={sheet === 'reschedule'} onClose={() => setSheet(null)} title={t('sessions.reschedule')}
        footer={<Button title={t('common.save')} loading={update.isPending} onPress={doReschedule} />}>
        <DateField label={t('common.date')} value={rDate} onChange={setRDate} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}><TimeField label={t('sessions.start')} value={rStart} onChange={setRStart} /></View>
          <View style={{ flex: 1 }}><TimeField label={t('sessions.end')} value={rEnd} onChange={setREnd} /></View>
        </View>
        <TextField label={`${t('sessions.changeReason')} (${t('common.optional')})`} value={reason} onChangeText={setReason} />
      </Sheet>
    </Screen>
  );
}
