import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useSaveStudent, useStudent } from '../api';
import { studentSchema, StudentForm } from '../schemas';
import {
  AppText, Button, Card, Chips, FormChips, FormDate, FormNumber, FormText, Header, LoadingView,
  Screen, SectionHeader,
} from '@/shared/components';
import { spacing } from '@/shared/theme';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { toISODate } from '@/shared/utils/dates';

export function StudentFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStudent(id ?? '');
  const save = useSaveStudent(id);
  const fb = useFeedback();
  const [withInvite, setWithInvite] = useState(true);

  const { control, handleSubmit, reset } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { first_name: '', last_name: '', level: 'beginner', start_date: toISODate(new Date()), phone: '', email: '' },
  });
  useEffect(() => {
    const s = existing.data;
    if (s) reset({ ...s, phone: s.phone ?? '', email: s.email ?? '', strengths: s.strengths ?? '', weaknesses: s.weaknesses ?? '', goals: s.goals ?? '', coach_notes: s.coach_notes ?? '' });
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const parsed = studentSchema.parse(v);
      const out = await save.mutateAsync({
        ...parsed,
        with_invitation: !id ? withInvite : undefined,
      });
      fb.success(id ? t('common.saved') : t('students.created'));
      if (id) router.back();
      else router.replace(`/coach/student/${out.id}`);
    } catch (e) {
      fb.error(errorMessage(e));
    }
  });

  if (id && existing.isLoading) return <LoadingView />;
  return (
    <Screen header={<Header back title={id ? t('students.edit') : t('students.add')} />} footer={<Button title={t('common.save')} onPress={onSubmit} loading={save.isPending} size="lg" />}>
      {!id ? (
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" muted>{t('students.connectionStatus')}</AppText>
          <Chips
            value={withInvite ? 'invite' : 'local'}
            onChange={(v) => setWithInvite(v === 'invite')}
            options={[
              { value: 'invite', label: t('students.registerWithInvite'), icon: 'share-variant-outline' },
              { value: 'local', label: t('students.registerLocalOnly'), icon: 'account-outline' },
            ]}
          />
        </Card>
      ) : null}

      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}><FormText control={control} name="first_name" label={t('auth.firstName')} /></View>
          <View style={{ flex: 1 }}><FormText control={control} name="last_name" label={t('auth.lastName')} /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}><FormNumber control={control} name="age" label={t('students.age')} /></View>
          <View style={{ flex: 2 }}><FormText control={control} name="phone" label={t('auth.phone')} ltr keyboardType="phone-pad" placeholder="0912..." /></View>
        </View>
        <FormText control={control} name="email" label={`${t('auth.email')} (${t('common.optional')})`} ltr autoCapitalize="none" keyboardType="email-address" hint={t('students.emailHint')} />
        <FormChips control={control} name="level" label={t('students.levelLabel')} options={(['beginner', 'intermediate', 'advanced', 'professional'] as const).map((l) => ({ value: l, label: t(`students.level.${l}`) }))} />
        <FormDate control={control} name="start_date" label={t('students.startDate')} />
      </Card>
      <SectionHeader title={t('students.coachingProfile')} />
      <Card style={{ gap: spacing.lg }}>
        <FormText control={control} name="strengths" label={t('students.strengths')} multiline />
        <FormText control={control} name="weaknesses" label={t('students.weaknesses')} multiline />
        <FormText control={control} name="goals" label={t('students.goals')} multiline />
        <FormText control={control} name="coach_notes" label={t('students.coachNotes')} multiline />
      </Card>
    </Screen>
  );
}
