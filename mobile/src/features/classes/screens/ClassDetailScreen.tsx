import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useClass, useClassMember, useDeleteClass, useTerms } from '../api';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { StudentPicker } from '../components/StudentPicker';
import {
  AppText, Avatar, Button, Card, ClassTypeBadge, EmptyState, ErrorView, Header, IconButton, KeyValue, ListRow, LoadingView, Screen, SectionHeader, ProgressBar,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';
import { confirm } from '@/shared/utils/confirm';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { errorMessage } from '@/shared/utils/errors';

export function ClassDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error, refetch } = useClass(id);
  const terms = useTerms({ class_id: id });
  const member = useClassMember(id);
  const del = useDeleteClass();
  const fb = useFeedback();
  const [picker, setPicker] = useState(false);

  if (isLoading) return <LoadingView />;
  if (error || !c) return <Screen header={<Header back title="" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const ids = c.members.map((m) => m.student_id);

  const onMembers = async (next: string[]) => {
    const added = next.filter((x) => !ids.includes(x));
    const removed = ids.filter((x) => !next.includes(x));
    try {
      for (const sid of added) await member.mutateAsync({ sid, add: true });
      for (const sid of removed) await member.mutateAsync({ sid, add: false });
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  return (
    <Screen onRefresh={refetch} header={<Header back title={c.name} right={<IconButton icon="pencil-outline" onPress={() => router.push(`/coach/class/form?id=${id}`)} />} />}
      footer={<Button title={t('terms.new')} icon="calendar-plus" size="lg" onPress={() => router.push(`/coach/term/new?classId=${id}`)} />}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ClassTypeBadge type={c.class_type} />
          <AppText variant="small" muted>{`${digits(c.duration_minutes)} ${t('common.minutes')}`}</AppText>
        </View>
        <KeyValue label={c.class_type === 'semi_private' ? t('classes.totalSessionPrice') : t('classes.sessionPrice')} value={formatMoney(c.session_price)} strong />
        {c.monthly_fee ? <KeyValue label={t('classes.monthlyFee')} value={formatMoney(c.monthly_fee)} strong /> : null}
        <PriceBreakdown price={c.session_price} court={c.court_cost} />
        <KeyValue label={t('classes.billingMode')} value={t(`classes.billing.${c.billing_mode}`)} />
        <KeyValue label={t('classes.capacity')} value={`${digits(c.capacity_min)} – ${digits(c.capacity_max)}`} />
        {c.location ? <KeyValue label={t('classes.location')} value={c.location} /> : null}
      </Card>

      <SectionHeader title={t('classes.members')} count={c.member_count} action={t('common.edit')} onAction={() => setPicker(true)} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {c.members.length ? c.members.map((m, i) => (
          <ListRow key={m.student_id} left={<Avatar name={m.full_name} size={36} />} title={m.full_name} subtitle={t(`students.level.${m.level}`)}
            onPress={() => router.push(`/coach/student/${m.student_id}`)} divider={i < c.members.length - 1} />
        )) : <EmptyState icon="account-plus-outline" title={t('classes.noMembers')} actionLabel={t('classes.addMember')} onAction={() => setPicker(true)} />}
      </Card>

      <SectionHeader title={t('terms.title')} count={terms.data?.length} />
      {terms.data?.length ? terms.data.map((term, i) => (
        <Card key={term.id} index={i} onPress={() => router.push(`/coach/term/${term.id}`)} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="bodyMedium">{term.title}</AppText>
            <AppText variant="small" muted>{t(`terms.status.${term.status}`)}</AppText>
          </View>
          <AppText variant="small" muted>{`${formatDate(term.start_date)} · ${t(`terms.type.${term.term_type}`)} · ${formatMoney(term.total_price)}`}</AppText>
          {term.total_sessions ? <ProgressBar value={term.sessions_completed / term.total_sessions} /> : null}
          {term.makeup_needed ? <AppText variant="small" color={colors.warning}>{term.makeup_suggestion}</AppText> : null}
        </Card>
      )) : <Card><EmptyState icon="calendar-blank-outline" title={t('terms.empty')} /></Card>}

      <Button variant="danger" icon="trash-can-outline" title={t('classes.delete')} onPress={async () => {
        if (!(await confirm(t('classes.deleteConfirm'), undefined, true))) return;
        await del.mutateAsync(id);
        router.back();
      }} />
      <StudentPicker visible={picker} onClose={() => setPicker(false)} selected={ids} onChange={onMembers} />
    </Screen>
  );
}
