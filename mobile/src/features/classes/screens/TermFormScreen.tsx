import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useClasses, useCreateTerm } from '../api';
import { StudentPicker } from '../components/StudentPicker';
import { useStudents } from '@/features/students/api';
import {
  AppText, Button, Card, Chips, DateField, Header, IconButton, KeyValue, MoneyField, NumberField, Screen, SectionHeader, TextField, TimeField, Avatar, ListRow,
} from '@/shared/components';
import { classTypeColors, colors, radius, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';
import { ApiWeekday, EVEN_DAYS, ODD_DAYS, PERSIAN_WEEK, toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import type { BillingMode, PaymentPlan, SlotInput, TermType } from '@/shared/types/api';

interface DaySlot { weekday: ApiWeekday; start: string; end: string }
interface DateSlot { date: string; start: string; end: string }

const addMinutes = (hhmm: string, mins: number) => dayjs(`2000-01-01T${hhmm}`).add(mins, 'minute').format('HH:mm');

/**
 * Term wizard – the core coach workflow: pick class → students → pricing → payment plan → schedule.
 * Everything is previewed live (price per student, total, generated sessions) before saving.
 */
export function TermFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ classId?: string; studentId?: string }>();
  const classes = useClasses({ is_active: true });
  const students = useStudents({ status: 'active' });
  const create = useCreateTerm();
  const fb = useFeedback();

  const [classId, setClassId] = useState(params.classId ?? '');
  const cls = classes.data?.find((c) => c.id === classId);
  const [members, setMembers] = useState<string[]>(params.studentId ? [params.studentId] : []);
  const [picker, setPicker] = useState(false);
  const [termType, setTermType] = useState<TermType>('fixed_sessions');
  const [count, setCount] = useState<number | null>(10);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [court, setCourt] = useState<number | null>(null);
  const [monthly, setMonthly] = useState<number | null>(null);
  const [billing, setBilling] = useState<BillingMode>('per_student');
  const [payer, setPayer] = useState<string | null>(null);
  const [plan, setPlan] = useState<PaymentPlan>('upfront');
  const [installments, setInstallments] = useState<number | null>(2);
  const [days, setDays] = useState<DaySlot[]>([]);
  const [dates, setDates] = useState<DateSlot[]>([]);
  const [defaultStart, setDefaultStart] = useState('17:00');

  // When class changes, preload its pricing & members (coach can still override everything).
  useEffect(() => {
    if (!cls) return;
    setPrice(cls.session_price);
    setCourt(cls.court_cost);
    setMonthly(cls.monthly_fee || null);
    setBilling(cls.billing_mode);
    if (!params.studentId && cls.members.length) setMembers(cls.members.map((m) => m.student_id));
    if (cls.class_type === 'group' || cls.class_type === 'academy') { setTermType('monthly'); setPlan('manual'); }
  }, [cls?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const duration = cls?.duration_minutes ?? 60;
  const toggleDay = (w: ApiWeekday) =>
    setDays((cur) => (cur.some((x) => x.weekday === w) ? cur.filter((x) => x.weekday !== w) : [...cur, { weekday: w, start: defaultStart, end: addMinutes(defaultStart, duration) }]));
  const preset = (ws: ApiWeekday[]) => setDays(ws.map((w) => ({ weekday: w, start: defaultStart, end: addMinutes(defaultStart, duration) })));
  const setAllTimes = (start: string) => {
    setDefaultStart(start);
    setDays((cur) => cur.map((x) => ({ ...x, start, end: addMinutes(start, duration) })));
  };

  const n = Math.max(members.length, 1);
  const p = price ?? 0;
  const preview = useMemo(() => {
    const share = billing === 'split' ? Math.round(p / n) : p;
    const sessions = termType === 'monthly' ? null : count ?? dates.length;
    const perStudentTotal = termType === 'monthly' ? monthly ?? 0 : share * (sessions ?? 0);
    const total = billing === 'per_student' ? perStudentTotal * n : termType === 'monthly' ? perStudentTotal * n : p * (sessions ?? 0);
    return { share, sessions, perStudentTotal, total };
  }, [p, n, billing, termType, count, dates.length, monthly]);

  const weekdayLabels = t('calendar.weekdaysShort', { returnObjects: true }) as string[];
  const memberNames = (students.data ?? []).filter((s) => members.includes(s.id));
  const autoTitle = cls ? `${cls.name} · ${formatDate(startDate, 'MMMM')}` : '';

  const submit = async () => {
    if (!cls) return fb.error(t('terms.pickClass'));
    if (!members.length) return fb.error(t('terms.pickStudents'));
    const isCustom = termType === 'custom';
    const slots: SlotInput[] = isCustom
      ? dates.map((x) => ({ on_date: x.date, start_time: x.start, end_time: x.end }))
      : days.map((x) => ({ weekday: x.weekday, start_time: x.start, end_time: x.end }));
    try {
      const term = await create.mutateAsync({
        class_id: cls.id,
        title: title.trim() || autoTitle,
        term_type: termType,
        total_sessions: termType === 'fixed_sessions' ? count : isCustom ? dates.length : null,
        start_date: startDate,
        end_date: termType === 'monthly' ? endDate ?? toISODate(dayjs(startDate).add(1, 'month').subtract(1, 'day')) : null,
        session_price: p,
        court_cost: court ?? 0,
        monthly_fee: monthly ?? 0,
        billing_mode: billing,
        payer_student_id: billing === 'lump' ? payer ?? members[0] : null,
        payment_plan: plan,
        installments_count: plan === 'installments' ? installments ?? 2 : 1,
        members: members.map((student_id) => ({ student_id })),
        schedule: slots.length ? { schedule_type: isCustom ? 'custom' : 'recurring', slots } : null,
      });
      fb.success(t('terms.createdHint', { n: digits(term.sessions_scheduled) }), true);
      router.replace(`/coach/term/${term.id}`);
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  return (
    <Screen header={<Header back title={t('terms.new')} />} footer={<Button title={t('terms.create')} icon="check" size="lg" onPress={submit} loading={create.isPending} />}>
      <SectionHeader title={t('terms.step.class')} />
      <Chips scroll value={classId} onChange={setClassId} options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name, color: classTypeColors[c.class_type].main }))} />
      {!classes.data?.length && !classes.isLoading ? <Button variant="outline" title={t('classes.add')} onPress={() => router.push('/coach/class/form')} /> : null}

      {cls ? (
        <>
          <SectionHeader title={t('terms.step.students')} count={members.length} action={t('common.edit')} onAction={() => setPicker(true)} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {memberNames.map((s, i) => (
              <ListRow key={s.id} left={<Avatar name={`${s.first_name} ${s.last_name}`} size={34} />} title={`${s.first_name} ${s.last_name}`} divider={i < memberNames.length - 1}
                right={<IconButton icon="close" size={32} onPress={() => setMembers(members.filter((x) => x !== s.id))} />} />
            ))}
            <ListRow icon="account-plus-outline" title={t('classes.addMember')} onPress={() => setPicker(true)} />
          </Card>
          {members.length > cls.capacity_max ? <AppText variant="small" color={colors.danger}>{t('errors.class_full')}</AppText> : null}

          <SectionHeader title={t('terms.step.type')} />
          <Card style={{ gap: spacing.lg }}>
            <Chips value={termType} onChange={setTermType} options={[
              { value: 'fixed_sessions', label: t('terms.type.fixed_sessions'), icon: 'counter' },
              { value: 'monthly', label: t('terms.type.monthly'), icon: 'calendar-month' },
              { value: 'custom', label: t('terms.type.custom'), icon: 'calendar-edit' },
            ]} />
            {termType === 'fixed_sessions' ? (
              <>
                <Chips size="sm" value={count ?? 0} onChange={(v) => setCount(v)} options={[8, 10, 12, 16, 20].map((x) => ({ value: x, label: t('terms.nSessions', { n: digits(x) }) }))} />
                <NumberField label={t('terms.sessionCount')} value={count} onChange={setCount} />
              </>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><DateField label={t('terms.startDate')} value={startDate} onChange={setStartDate} /></View>
              {termType === 'monthly' ? <View style={{ flex: 1 }}><DateField label={t('terms.endDate')} value={endDate} onChange={setEndDate} placeholder={t('terms.oneMonth')} /></View> : null}
            </View>
            <TextField label={`${t('terms.titleLabel')} (${t('common.optional')})`} value={title} onChangeText={setTitle} placeholder={autoTitle} />
          </Card>

          <SectionHeader title={t('terms.step.pricing')} />
          <Card style={{ gap: spacing.lg }}>
            <MoneyField label={cls.class_type === 'semi_private' ? t('classes.totalSessionPrice') : t('classes.sessionPrice')} value={price} onChange={setPrice} />
            <MoneyField label={t('classes.courtCost')} value={court} onChange={setCourt} />
            {termType === 'monthly' ? <MoneyField label={t('classes.monthlyFee')} value={monthly} onChange={setMonthly} hint={t('classes.monthlyFeeHint')} /> : null}
            <Chips size="sm" label={t('classes.billingMode')} value={billing} onChange={setBilling} options={(['per_student', 'split', 'lump'] as const).map((b) => ({ value: b, label: t(`classes.billing.${b}`) }))} />
            {billing === 'lump' && members.length > 1 ? (
              <Chips size="sm" label={t('terms.payer')} value={payer ?? members[0]} onChange={setPayer} options={memberNames.map((s) => ({ value: s.id, label: s.first_name }))} />
            ) : null}
            <View style={styles.preview}>
              {termType !== 'monthly' ? <KeyValue label={t('terms.sharePerSession')} value={formatMoney(preview.share)} /> : null}
              {termType !== 'monthly' ? <KeyValue label={t('terms.coachPerSession')} value={formatMoney(p - (court ?? 0))} color={colors.primaryDark} /> : null}
              <KeyValue label={t('terms.perStudent')} value={formatMoney(billing === 'lump' ? preview.total : preview.perStudentTotal)} />
              <KeyValue label={t('terms.totalPrice')} value={formatMoney(preview.total)} strong />
              {billing === 'split' ? <AppText variant="caption" muted>{t('terms.splitHint')}</AppText> : null}
            </View>
          </Card>

          <SectionHeader title={t('terms.step.payment')} />
          <Card style={{ gap: spacing.lg }}>
            <Chips value={plan} onChange={setPlan} options={(['upfront', 'per_session', 'installments', 'manual'] as const).map((x) => ({ value: x, label: t(`terms.plan.${x}`) }))} />
            <AppText variant="small" muted>{t(`terms.planDesc.${plan}`)}</AppText>
            {plan === 'installments' ? <NumberField label={t('terms.installments')} value={installments} onChange={setInstallments} /> : null}
          </Card>

          <SectionHeader title={t('terms.step.schedule')} />
          {termType !== 'custom' ? (
            <Card style={{ gap: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button size="sm" variant="secondary" title={t('terms.oddDays')} onPress={() => preset(ODD_DAYS)} style={{ flex: 1 }} />
                <Button size="sm" variant="secondary" title={t('terms.evenDays')} onPress={() => preset(EVEN_DAYS)} style={{ flex: 1 }} />
              </View>
              <View style={styles.week}>
                {PERSIAN_WEEK.map((w, i) => {
                  const on = days.some((x) => x.weekday === w);
                  return (
                    <Button key={w} size="sm" variant={on ? 'navy' : 'outline'} title={weekdayLabels[i]} onPress={() => toggleDay(w)} style={{ flex: 1, paddingHorizontal: 0 }} />
                  );
                })}
              </View>
              <TimeField label={t('terms.defaultTime')} value={defaultStart} onChange={setAllTimes} />
              {[...days].sort((a, b) => PERSIAN_WEEK.indexOf(a.weekday) - PERSIAN_WEEK.indexOf(b.weekday)).map((x) => (
                <View key={x.weekday} style={styles.slot}>
                  <AppText variant="bodyMedium" style={{ width: 70 }}>{t(`calendar.weekdays.${PERSIAN_WEEK.indexOf(x.weekday)}`)}</AppText>
                  <View style={{ flex: 1 }}><TimeField compact value={x.start} onChange={(v) => setDays(days.map((y) => (y.weekday === x.weekday ? { ...y, start: v, end: addMinutes(v, duration) } : y)))} /></View>
                  <AppText muted>–</AppText>
                  <View style={{ flex: 1 }}><TimeField compact value={x.end} onChange={(v) => setDays(days.map((y) => (y.weekday === x.weekday ? { ...y, end: v } : y)))} /></View>
                </View>
              ))}
              {days.length && preview.sessions ? <AppText variant="small" color={colors.primaryDark}>{t('terms.willGenerate', { n: digits(preview.sessions) })}</AppText> : null}
            </Card>
          ) : (
            <Card style={{ gap: spacing.md }}>
              {dates.map((x, i) => (
                <View key={i} style={styles.slot}>
                  <View style={{ flex: 1.4 }}><DateField value={x.date} onChange={(v) => setDates(dates.map((y, j) => (j === i ? { ...y, date: v } : y)))} /></View>
                  <View style={{ flex: 1 }}><TimeField compact value={x.start} onChange={(v) => setDates(dates.map((y, j) => (j === i ? { ...y, start: v, end: addMinutes(v, duration) } : y)))} /></View>
                  <IconButton icon="trash-can-outline" size={34} color={colors.danger} onPress={() => setDates(dates.filter((_, j) => j !== i))} />
                </View>
              ))}
              <Button variant="outline" icon="plus" title={t('terms.addDate')} onPress={() => {
                const last = dates[dates.length - 1];
                const date = last ? toISODate(dayjs(last.date).add(7, 'day')) : startDate;
                setDates([...dates, { date, start: last?.start ?? defaultStart, end: last?.end ?? addMinutes(defaultStart, duration) }]);
              }} />
            </Card>
          )}
        </>
      ) : null}
      <StudentPicker visible={picker} onClose={() => setPicker(false)} selected={members} onChange={setMembers} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  week: { flexDirection: 'row', gap: 4 },
  slot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
