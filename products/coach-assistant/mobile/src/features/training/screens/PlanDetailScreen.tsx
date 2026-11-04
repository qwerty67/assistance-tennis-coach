import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAddExercise, useCatalog, useDeleteExercise, useDeletePlan, usePlan, useUpdateExercise } from '../api';
import { trainingApi } from '../api';
import { ExerciseItem } from '../components/ExerciseItem';
import {
  AppText, Button, Card, Chips, EmptyState, ErrorView, Header, IconButton, LoadingView, NumberField, ProgressBar, Screen, SectionHeader, Sheet, TextField,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { digits, formatDate } from '@/shared/utils/format';
import { confirm } from '@/shared/utils/confirm';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { queryClient, qk } from '@/shared/services/queryClient';
import type { Exercise, ExerciseStatus, Intensity, TrainingCategory } from '@/shared/types/api';

const CATS: TrainingCategory[] = ['technical', 'tactical', 'mental', 'fitness'];
const NEXT: Record<ExerciseStatus, ExerciseStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };

export function PlanDetailScreen({ role = 'coach' }: { role?: 'coach' | 'student' }) {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan, isLoading, error, refetch } = usePlan(id);
  const catalog = useCatalog();
  const add = useAddExercise(id);
  const upd = useUpdateExercise(id);
  const del = useDeleteExercise(id);
  const delPlan = useDeletePlan();
  const fb = useFeedback();
  const coach = role === 'coach';
  const [sheet, setSheet] = useState(false);
  const [cat, setCat] = useState<TrainingCategory>('technical');
  const [skill, setSkill] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sets, setSets] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [mins, setMins] = useState<number | null>(15);
  const [intensity, setIntensity] = useState<Intensity>('medium');

  if (isLoading) return <LoadingView />;
  if (error || !plan) return <Screen header={<Header back title="" />}><ErrorView error={error} onRetry={refetch} /></Screen>;

  const toggle = (ex: Exercise) => upd.mutate({ eid: ex.id, body: { status: NEXT[ex.status] } }, { onSuccess: (p) => { if (p.progress === 1) fb.success(t('training.planDone'), true); } });

  const save = async () => {
    const finalTitle = title.trim() || (skill ? t(`training.skill.${skill}`) : '');
    if (!finalTitle) return fb.error(t('validation.required'));
    try {
      await add.mutateAsync({ category: cat, skill, title: finalTitle, description: desc || null, sets, repetitions: reps, duration_minutes: mins, intensity, status: 'todo', order_index: plan.exercises.length, start_date: null, end_date: null });
      setSheet(false); setTitle(''); setDesc(''); setSkill(null);
    } catch (e) { fb.error(errorMessage(e)); }
  };

  const setStatus = async (status: string) => {
    const p = await trainingApi.update(id, { status });
    queryClient.setQueryData(qk.plan(id), p);
  };

  return (
    <Screen onRefresh={refetch} header={<Header back title={plan.title} subtitle={plan.student_name}
      right={coach ? <IconButton icon="trash-can-outline" color={colors.danger} onPress={async () => { if (await confirm(t('training.deleteConfirm'), undefined, true)) { await delPlan.mutateAsync(id); router.back(); } }} /> : undefined} />}
      footer={coach ? <Button title={t('training.addExercise')} icon="plus" size="lg" onPress={() => setSheet(true)} /> : undefined}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="h2">{`${digits(Math.round(plan.progress * 100))}٪`}</AppText>
          <AppText variant="small" muted>{[plan.start_date && formatDate(plan.start_date), plan.end_date && formatDate(plan.end_date)].filter(Boolean).join(' – ')}</AppText>
        </View>
        <ProgressBar value={plan.progress} height={10} />
        {plan.description ? <AppText variant="small" muted>{plan.description}</AppText> : null}
        {coach ? <Chips size="sm" value={plan.status} onChange={setStatus} options={(['draft', 'active', 'completed', 'archived'] as const).map((s) => ({ value: s, label: t(`training.planStatus.${s}`) }))} /> : null}
      </Card>
      <AppText variant="caption" muted>{t('training.tapHint')}</AppText>

      {CATS.map((c) => {
        const items = plan.exercises.filter((e) => e.category === c);
        if (!items.length) return null;
        return (
          <View key={c} style={{ gap: spacing.sm }}>
            <SectionHeader title={t(`training.category.${c}`)} count={items.length} />
            <Card style={{ paddingVertical: 0 }}>
              {items.map((ex) => (
                <ExerciseItem key={ex.id} ex={ex} onToggle={() => toggle(ex)}
                  onLongPress={coach ? async () => { if (await confirm(t('training.deleteExercise'), ex.title, true)) del.mutate(ex.id); } : undefined} />
              ))}
            </Card>
          </View>
        );
      })}
      {!plan.exercises.length ? <EmptyState icon="dumbbell" title={t('training.noExercises')} /> : null}

      <Sheet visible={sheet} onClose={() => setSheet(false)} title={t('training.addExercise')} footer={<Button title={t('common.add')} loading={add.isPending} onPress={save} />}>
        <Chips size="sm" value={cat} onChange={(v) => { setCat(v); setSkill(null); }} options={CATS.map((c) => ({ value: c, label: t(`training.category.${c}`) }))} />
        <Chips scroll size="sm" value={skill ?? ''} onChange={(v) => setSkill(v || null)} options={(catalog.data?.[cat] ?? []).map((s) => ({ value: s, label: t(`training.skill.${s}`, { defaultValue: s }) }))} />
        <TextField label={t('training.exerciseTitle')} value={title} onChangeText={setTitle} placeholder={skill ? t(`training.skill.${skill}`) : ''} />
        <TextField label={t('common.description')} value={desc} onChangeText={setDesc} multiline />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}><NumberField label={t('training.sets')} value={sets} onChange={setSets} /></View>
          <View style={{ flex: 1 }}><NumberField label={t('training.reps')} value={reps} onChange={setReps} /></View>
          <View style={{ flex: 1 }}><NumberField label={t('training.minutes')} value={mins} onChange={setMins} /></View>
        </View>
        <Chips size="sm" label={t('training.intensityLabel')} value={intensity} onChange={setIntensity} options={(['low', 'medium', 'high', 'max'] as const).map((x) => ({ value: x, label: t(`training.intensity.${x}`) }))} />
      </Sheet>
    </Screen>
  );
}
