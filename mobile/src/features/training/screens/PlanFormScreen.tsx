import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCreatePlan } from '../api';
import { useStudent } from '@/features/students/api';
import { StudentPicker } from '@/features/classes/components/StudentPicker';
import { Avatar, Button, Card, DateField, Header, ListRow, Screen, TextField } from '@/shared/components';
import { spacing } from '@/shared/theme';
import { toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';

export function PlanFormScreen() {
  const { t } = useTranslation();
  const p = useLocalSearchParams<{ studentId?: string }>();
  const [studentId, setStudentId] = useState(p.studentId ?? '');
  const [picker, setPicker] = useState(false);
  const student = useStudent(studentId);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [start, setStart] = useState(toISODate(new Date()));
  const [end, setEnd] = useState(toISODate(dayjs().add(1, 'month')));
  const create = useCreatePlan();
  const fb = useFeedback();
  const name = student.data ? `${student.data.first_name} ${student.data.last_name}` : '';

  const submit = async () => {
    if (!studentId) return fb.error(t('finance.pickStudent'));
    if (!title.trim()) return fb.error(t('validation.required'));
    try {
      const plan = await create.mutateAsync({ student_id: studentId, title: title.trim(), description: desc || null, start_date: start, end_date: end });
      fb.success(t('common.saved'));
      router.replace(`/coach/training/${plan.id}`);
    } catch (e) { fb.error(errorMessage(e)); }
  };

  return (
    <Screen header={<Header back title={t('training.newPlan')} />} footer={<Button title={t('common.continue')} size="lg" onPress={submit} loading={create.isPending} />}>
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow left={studentId ? <Avatar name={name} size={40} /> : undefined} icon={studentId ? undefined : 'account-search-outline'} title={studentId ? name : t('finance.pickStudent')} onPress={() => setPicker(true)} />
      </Card>
      <Card style={{ gap: spacing.lg }}>
        <TextField label={t('training.planTitle')} value={title} onChangeText={setTitle} placeholder={t('training.planTitlePh')} />
        <TextField label={t('common.description')} value={desc} onChangeText={setDesc} multiline />
        <DateField label={t('terms.startDate')} value={start} onChange={setStart} />
        <DateField label={t('terms.endDate')} value={end} onChange={setEnd} />
      </Card>
      <StudentPicker single visible={picker} onClose={() => setPicker(false)} selected={studentId ? [studentId] : []} onChange={(ids) => setStudentId(ids[0] ?? '')} />
    </Screen>
  );
}
