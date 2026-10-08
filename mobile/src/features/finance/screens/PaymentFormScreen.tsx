import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCreatePayment } from '../api';
import { useStudent, useStudentAccount } from '@/features/students/api';
import { StudentPicker } from '@/features/classes/components/StudentPicker';
import {
  AppText, Avatar, Button, Card, Chips, DateField, FinancialBadge, Header, KeyValue, ListRow, MoneyField, Screen, SectionHeader, TextField,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatMoney } from '@/shared/utils/format';
import { toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import type { PaymentMethod } from '@/shared/types/api';

/** Record a (full or partial) payment. Allocation to oldest open charges happens on the server (FIFO). */
export function PaymentFormScreen() {
  const { t } = useTranslation();
  const p = useLocalSearchParams<{ studentId?: string }>();
  const [studentId, setStudentId] = useState(p.studentId ?? '');
  const [picker, setPicker] = useState(false);
  const student = useStudent(studentId);
  const account = useStudentAccount(studentId);
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(toISODate(new Date()));
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [termId, setTermId] = useState('');
  const [desc, setDesc] = useState('');
  const create = useCreatePayment();
  const fb = useFeedback();
  const acc = account.data;
  const remaining = acc?.remaining_amount ?? 0;

  const submit = async () => {
    if (!studentId) return fb.error(t('finance.pickStudent'));
    if (!amount || amount <= 0) return fb.error(t('validation.amount'));
    try {
      const term = student.data?.terms.find((x) => x.term_id === termId);
      await create.mutateAsync({ student_id: studentId, amount, paid_at: date, method, description: desc || null, term_id: termId || null, class_id: term?.class_id ?? null });
      fb.success(t('finance.paymentSaved', { amount: formatMoney(amount) }), true);
      router.back();
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const name = student.data ? `${student.data.first_name} ${student.data.last_name}` : '';
  return (
    <Screen header={<Header back title={t('finance.recordPayment')} />} footer={<Button title={t('finance.savePayment')} icon="check" size="lg" loading={create.isPending} onPress={submit} />}>
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow left={studentId ? <Avatar name={name} size={40} /> : undefined} icon={studentId ? undefined : 'account-search-outline'}
          title={studentId ? name : t('finance.pickStudent')} right={acc ? <FinancialBadge status={acc.status} /> : undefined} onPress={() => setPicker(true)} />
      </Card>
      {acc ? (
        <Card tone="muted" style={{ gap: 2 }}>
          <KeyValue label={t('finance.totalTuition')} value={formatMoney(acc.total_tuition)} />
          <KeyValue label={t('finance.paid')} value={formatMoney(acc.paid_amount)} />
          <KeyValue label={t('finance.remaining')} value={formatMoney(remaining)} color={remaining ? colors.danger : colors.success} strong />
          {acc.credit ? <KeyValue label={t('finance.credit')} value={formatMoney(acc.credit)} color={colors.info} /> : null}
        </Card>
      ) : null}

      <SectionHeader title={t('finance.paymentInfo')} />
      <Card style={{ gap: spacing.lg }}>
        <MoneyField label={t('finance.amount')} value={amount} onChange={setAmount} />
        {remaining > 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button size="sm" variant="secondary" title={t('finance.payAll')} onPress={() => setAmount(remaining)} style={{ flex: 1 }} />
            <Button size="sm" variant="outline" title={t('finance.payHalf')} onPress={() => setAmount(Math.round(remaining / 2))} style={{ flex: 1 }} />
          </View>
        ) : null}
        {amount && remaining && amount < remaining ? <AppText variant="small" color={colors.warning}>{t('finance.partialHint', { r: formatMoney(remaining - amount) })}</AppText> : null}
        <DateField label={t('common.date')} value={date} onChange={setDate} />
        <Chips label={t('finance.methodLabel')} value={method} onChange={setMethod} options={[
          { value: 'cash', label: t('finance.method.cash'), icon: 'cash' },
          { value: 'card', label: t('finance.method.card'), icon: 'credit-card-outline' },
          { value: 'transfer', label: t('finance.method.transfer'), icon: 'bank-transfer' },
          { value: 'other', label: t('finance.method.other'), icon: 'dots-horizontal' },
        ]} />
        {student.data?.terms.length ? (
          <Chips scroll size="sm" label={t('finance.forTerm')} value={termId} onChange={setTermId}
            options={[{ value: '', label: t('finance.general') }, ...student.data.terms.map((x) => ({ value: x.term_id, label: x.term_title }))]} />
        ) : null}
        <TextField label={`${t('common.description')} (${t('common.optional')})`} value={desc} onChangeText={setDesc} />
      </Card>
      <StudentPicker single visible={picker} onClose={() => setPicker(false)} selected={studentId ? [studentId] : []} onChange={(ids) => setStudentId(ids[0] ?? '')} />
    </Screen>
  );
}
