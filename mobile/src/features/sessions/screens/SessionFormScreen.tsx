import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCreateMakeup, useCreateSession, useMakeupSuggestions, useSession } from '../api';
import { useClasses, useTerms } from '@/features/classes/api';
import { AppText, Button, Card, Chips, DateField, Header, PressableScale, Screen, SectionHeader, TextField, TimeField } from '@/shared/components';
import { classTypeColors, colors, radius, spacing } from '@/shared/theme';
import { formatDate, formatTime } from '@/shared/utils/format';
import { combineDateTime, toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';

const addMinutes = (hhmm: string, mins: number) => dayjs(`2000-01-01T${hhmm}`).add(mins, 'minute').format('HH:mm');

/** Add a single (extra) session, or create a makeup for a cancelled one with smart time suggestions. */
export function SessionFormScreen() {
  const { t } = useTranslation();
  const p = useLocalSearchParams<{ mode?: string; id?: string; classId?: string; termId?: string; date?: string; makeupId?: string; studentId?: string }>();
  const isMakeup = p.mode === 'makeup' && !!p.id;
  const original = useSession(isMakeup ? p.id! : '');
  const suggestions = useMakeupSuggestions(p.id ?? '', isMakeup);
  const classes = useClasses({ is_active: true });
  const [classId, setClassId] = useState(p.classId ?? '');
  const terms = useTerms(classId ? { class_id: classId } : {});
  const [termId, setTermId] = useState<string>(p.termId ?? '');
  const [date, setDate] = useState(p.date ?? toISODate(new Date()));
  const [start, setStart] = useState('17:00');
  const [end, setEnd] = useState('18:00');
  const [notes, setNotes] = useState('');
  const create = useCreateSession();
  const makeup = useCreateMakeup(p.id ?? '');
  const fb = useFeedback();
  const cls = classes.data?.find((c) => c.id === classId);

  useEffect(() => {
    if (original.data) {
      setClassId(original.data.class_id);
      setStart(dayjs(original.data.start_at).format('HH:mm'));
      setEnd(dayjs(original.data.end_at).format('HH:mm'));
    }
  }, [original.data]);

  const onStart = (v: string) => {
    setStart(v);
    setEnd(addMinutes(v, cls?.duration_minutes ?? original.data?.duration_minutes ?? 60));
  };

  const submit = async () => {
    try {
      const body = { start_at: combineDateTime(date, start), end_at: combineDateTime(date, end) };
      if (isMakeup) {
        await makeup.mutateAsync({ ...body, makeup_id: p.makeupId ?? null, student_id: p.studentId ?? null });
        fb.success(t('sessions.makeupCreated'), true);
      } else {
        if (!classId) return fb.error(t('terms.pickClass'));
        await create.mutateAsync({ ...body, class_id: classId, term_id: termId || null, notes: notes || null });
        fb.success(t('sessions.created'), true);
      }
      router.back();
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  return (
    <Screen header={<Header back title={isMakeup ? t('sessions.createMakeup') : t('sessions.add')} />}
      footer={<Button title={t('common.save')} size="lg" onPress={submit} loading={create.isPending || makeup.isPending} />}>
      {isMakeup && original.data ? (
        <Card tone="muted">
          <AppText variant="small" muted>{t('sessions.makeupFor')}</AppText>
          <AppText variant="bodyMedium">{`${original.data.class_name} · ${formatDate(original.data.start_at, 'dddd D MMMM')} ${formatTime(original.data.start_at)}`}</AppText>
          <AppText variant="small" color={colors.info}>{t('sessions.makeupHint')}</AppText>
        </Card>
      ) : null}

      {isMakeup && suggestions.data?.length ? (
        <>
          <SectionHeader title={t('sessions.suggestions')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {suggestions.data.map((sg) => {
              const on = toISODate(dayjs(sg.start_at)) === date && dayjs(sg.start_at).format('HH:mm') === start;
              return (
                <PressableScale key={sg.start_at} onPress={() => { setDate(toISODate(dayjs(sg.start_at))); setStart(dayjs(sg.start_at).format('HH:mm')); setEnd(dayjs(sg.end_at).format('HH:mm')); }}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.surface }}>
                  <AppText variant="small">{formatDate(sg.start_at, 'dddd D MMM')}</AppText>
                  <AppText variant="bodyMedium">{`${formatTime(sg.start_at)} – ${formatTime(sg.end_at)}`}</AppText>
                </PressableScale>
              );
            })}
          </View>
        </>
      ) : null}

      {!isMakeup ? (
        <>
          <SectionHeader title={t('terms.step.class')} />
          <Chips scroll value={classId} onChange={(v) => { setClassId(v); setTermId(''); }} options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name, color: classTypeColors[c.class_type].main }))} />
          {terms.data?.length ? (
            <Chips scroll size="sm" label={t('sessions.linkTerm')} value={termId} onChange={setTermId}
              options={[{ value: '', label: t('sessions.noTerm') }, ...terms.data.map((x) => ({ value: x.id, label: x.title }))]} />
          ) : null}
        </>
      ) : null}

      <SectionHeader title={t('sessions.time')} />
      <Card style={{ gap: spacing.lg }}>
        <DateField label={t('common.date')} value={date} onChange={setDate} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}><TimeField label={t('sessions.start')} value={start} onChange={onStart} /></View>
          <View style={{ flex: 1 }}><TimeField label={t('sessions.end')} value={end} onChange={setEnd} /></View>
        </View>
        {!isMakeup ? <TextField label={`${t('sessions.notes')} (${t('common.optional')})`} value={notes} onChangeText={setNotes} multiline /> : null}
      </Card>
    </Screen>
  );
}
