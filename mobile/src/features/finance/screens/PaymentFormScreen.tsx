import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCreatePayment } from '../api';
import { useStudent, useStudentAccount } from '@/features/students/api';
import { StudentPicker } from '@/features/classes/components/StudentPicker';
import {
  AppText, Avatar, Badge, Button, Card, Chips, DateField, FinancialBadge, Header, KeyValue, ListRow, MoneyField, Screen, SectionHeader, TextField,
} from '@/shared/components';
import { colors, getClassColor, radius, spacing } from '@/shared/theme';
import { formatMoney } from '@/shared/utils/format';
import { toISODate } from '@/shared/utils/dates';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import type { PaymentMethod } from '@/shared/types/api';

/** Record a (full or partial) payment. Itemized debts per class are displayed and can be directly settled. */
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
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [termId, setTermId] = useState('');
  const [desc, setDesc] = useState('');
  const create = useCreatePayment();
  const fb = useFeedback();
  const acc = account.data;
  const remaining = acc?.remaining_amount ?? 0;

  const selectClassDebt = (classId: string | null, debt: number) => {
    setSelectedClassId(classId ?? '');
    setTermId('');
    if (debt > 0) {
      setAmount(debt);
    }
  };

  const submit = async () => {
    if (!studentId) return fb.error(t('finance.pickStudent'));
    if (!amount || amount <= 0) return fb.error(t('validation.amount'));
    try {
      const term = student.data?.terms.find((x) => x.term_id === termId);
      await create.mutateAsync({
        student_id: studentId,
        amount: Math.round(amount),
        paid_at: date,
        method,
        description: desc?.trim() || null,
        term_id: (termId && termId.trim().length > 0) ? termId.trim() : null,
        class_id: (selectedClassId && selectedClassId.trim().length > 0) ? selectedClassId.trim() : (term?.class_id || null),
      });
      fb.success(t('finance.paymentSaved', { amount: formatMoney(amount) }), true);
      router.back();
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const name = student.data ? `${student.data.first_name} ${student.data.last_name}` : '';
  const classDebts = acc?.debts_by_class ?? [];

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

      {classDebts.length > 0 ? (
        <>
          <SectionHeader title={t('finance.debtsByClass')} />
          <Card style={{ gap: spacing.sm }}>
            {classDebts.map((cd, idx) => {
              const clr = getClassColor(cd.class_type ?? undefined, cd.color);
              const isSelected = selectedClassId === (cd.class_id ?? '');
              return (
                <Pressable
                  key={cd.class_id ?? `idx-${idx}`}
                  onPress={() => selectClassDebt(cd.class_id, cd.debt)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: isSelected ? clr.soft : colors.background,
                    borderWidth: 1.5,
                    borderColor: isSelected ? clr.main : 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: clr.main }} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMedium" numberOfLines={1}>{cd.class_name}</AppText>
                      <AppText variant="caption" muted>{`${t('finance.charged')}: ${formatMoney(cd.charged)} · ${t('finance.paid')}: ${formatMoney(cd.paid)}`}</AppText>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <AppText variant="bodyMedium" color={cd.debt > 0 ? colors.danger : colors.success} style={{ fontFamily: 'Vazirmatn_700Bold' }}>
                      {formatMoney(cd.debt)}
                    </AppText>
                    {cd.debt > 0 ? (
                      <Badge label={t('finance.status.debt')} color={colors.danger} bg={colors.dangerSoft} />
                    ) : (
                      <Badge label={t('finance.status.settled')} color={colors.success} bg={colors.successSoft} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('finance.paymentInfo')} />
      <Card style={{ gap: spacing.lg }}>
        <MoneyField label={t('finance.amount')} value={amount} onChange={setAmount} />
        {remaining > 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button size="sm" variant="secondary" title={t('finance.payAll')} onPress={() => { setSelectedClassId(''); setTermId(''); setAmount(remaining); }} style={{ flex: 1 }} />
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

        {classDebts.length > 0 ? (
          <Chips scroll size="sm" label={t('finance.forClass')} value={selectedClassId} onChange={(v) => { setSelectedClassId(v); setTermId(''); }}
            options={[{ value: '', label: t('finance.allDebts') }, ...classDebts.filter((c) => !!c.class_id).map((c) => ({ value: c.class_id!, label: c.class_name }))]} />
        ) : null}

        {student.data?.terms.length ? (
          <Chips scroll size="sm" label={t('finance.forTerm')} value={termId} onChange={(v) => { setTermId(v); setSelectedClassId(''); }}
            options={[{ value: '', label: t('finance.general') }, ...student.data.terms.map((x) => ({ value: x.term_id, label: x.term_title }))]} />
        ) : null}

        <TextField label={`${t('common.description')} (${t('common.optional')})`} value={desc} onChangeText={setDesc} />
      </Card>
      <StudentPicker single visible={picker} onClose={() => setPicker(false)} selected={studentId ? [studentId] : []} onChange={(ids) => { setStudentId(ids[0] ?? ''); setSelectedClassId(''); setTermId(''); }} />
    </Screen>
  );
}
