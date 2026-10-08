import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useClass, useSaveClass } from '../api';
import { classSchema, ClassForm } from '../schemas';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { StudentPicker } from '../components/StudentPicker';
import { AppText, Button, Card, FormChips, FormMoney, FormNumber, FormText, Header, ListRow, LoadingView, Screen, SectionHeader } from '@/shared/components';
import { classTypeColors, spacing } from '@/shared/theme';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';
import { digits } from '@/shared/utils/format';
import type { ClassType } from '@/shared/types/api';

const PRESETS: Record<ClassType, Partial<ClassForm>> = {
  private: { capacity_min: 1, capacity_max: 1, duration_minutes: 60, billing_mode: 'per_student' },
  semi_private: { capacity_min: 2, capacity_max: 3, duration_minutes: 60, billing_mode: 'split' },
  group: { capacity_min: 3, capacity_max: 8, duration_minutes: 90, billing_mode: 'per_student' },
  academy: { capacity_min: 1, capacity_max: 8, duration_minutes: 120, billing_mode: 'per_student' },
};

export function ClassFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useClass(id ?? '');
  const save = useSaveClass(id);
  const fb = useFeedback();
  const [members, setMembers] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const { control, handleSubmit, reset, setValue } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '', class_type: 'private', ...PRESETS.private, session_price: 1_000_000, court_cost: 300_000, monthly_fee: 0 } as ClassForm,
  });
  const type = useWatch({ control, name: 'class_type' });
  const price = useWatch({ control, name: 'session_price' }) ?? 0;
  const court = useWatch({ control, name: 'court_cost' }) ?? 0;
  const billing = useWatch({ control, name: 'billing_mode' });

  useEffect(() => {
    const c = existing.data;
    if (c) reset({ ...c, location: c.location ?? '', description: c.description ?? '' });
  }, [existing.data, reset]);

  const pickType = (v: ClassType) => {
    setValue('class_type', v);
    if (!id) Object.entries(PRESETS[v]).forEach(([k, val]) => setValue(k as keyof ClassForm, val as never));
  };

  const onSubmit = handleSubmit(async (v) => {
    try {
      const body = classSchema.parse(v);
      const out = await save.mutateAsync({ ...body, member_ids: id ? undefined : members });
      fb.success(t('common.saved'));
      if (id) router.back();
      else router.replace(`/coach/class/${out.id}`);
    } catch (e) {
      fb.error(errorMessage(e));
    }
  });

  if (id && existing.isLoading) return <LoadingView />;
  return (
    <Screen header={<Header back title={id ? t('classes.edit') : t('classes.add')} />} footer={<Button title={t('common.save')} onPress={onSubmit} loading={save.isPending} size="lg" />}>
      <Card style={{ gap: spacing.lg }}>
        <FormText control={control} name="name" label={t('classes.name')} placeholder={t('classes.namePlaceholder')} />
        {!id ? (
          <View style={{ gap: 6 }}>
            <AppText variant="bodyMedium">{t('classes.typeLabel')}</AppText>
            <View style={{ gap: spacing.sm }}>
              {(['private', 'semi_private', 'group', 'academy'] as const).map((v) => (
                <ListRow key={v} title={t(`classes.type.${v}`)} subtitle={t(`classes.typeDesc.${v}`)} onPress={() => pickType(v)} chevron={false}
                  left={<View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: type === v ? classTypeColors[v].main : classTypeColors[v].soft, borderWidth: 2, borderColor: classTypeColors[v].main }} />} />
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}><FormNumber control={control} name="capacity_min" label={t('classes.capacityMin')} /></View>
          <View style={{ flex: 1 }}><FormNumber control={control} name="capacity_max" label={t('classes.capacityMax')} /></View>
          <View style={{ flex: 1 }}><FormNumber control={control} name="duration_minutes" label={t('classes.duration')} /></View>
        </View>
        <FormChips control={control} name="duration_minutes" options={[60, 90, 120, 180].map((m) => ({ value: m, label: `${digits(m)}′` }))} />
      </Card>

      <SectionHeader title={t('classes.pricing')} />
      <Card style={{ gap: spacing.lg }}>
        <AppText variant="small" muted>{t('classes.pricingHint')}</AppText>
        <FormMoney control={control} name="session_price" label={type === 'semi_private' ? t('classes.totalSessionPrice') : t('classes.sessionPrice')} />
        <FormMoney control={control} name="court_cost" label={t('classes.courtCost')} />
        <PriceBreakdown price={price} court={court} />
        {type === 'group' || type === 'academy' ? <FormMoney control={control} name="monthly_fee" label={t('classes.monthlyFee')} hint={t('classes.monthlyFeeHint')} /> : null}
        <FormChips control={control} name="billing_mode" label={t('classes.billingMode')} options={(['per_student', 'split', 'lump'] as const).map((b) => ({ value: b, label: t(`classes.billing.${b}`) }))} />
        <AppText variant="small" muted>{t(`classes.billingDesc.${billing}`)}</AppText>
      </Card>

      <SectionHeader title={t('classes.extra')} />
      <Card style={{ gap: spacing.lg }}>
        <FormText control={control} name="location" label={t('classes.location')} icon="map-marker-outline" />
        <FormText control={control} name="description" label={t('common.description')} multiline />
      </Card>

      {!id ? (
        <>
          <SectionHeader title={t('classes.members')} count={members.length} action={t('classes.addMember')} onAction={() => setPicker(true)} />
          <Button variant="outline" icon="account-multiple-plus-outline" title={members.length ? t('classes.selectedN', { n: digits(members.length) }) : t('classes.addMember')} onPress={() => setPicker(true)} />
          <StudentPicker visible={picker} onClose={() => setPicker(false)} selected={members} onChange={setMembers} />
        </>
      ) : null}
    </Screen>
  );
}
