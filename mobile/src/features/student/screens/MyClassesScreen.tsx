import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStudentDashboard } from '@/features/dashboard/api';
import { AppText, Card, ClassTypeBadge, EmptyState, Header, ProgressBar, Screen, SectionHeader, SkeletonList } from '@/shared/components';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import { colors, spacing } from '@/shared/theme';
import { digits, formatRelativeDay } from '@/shared/utils/format';

export function MyClassesScreen() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useStudentDashboard();
  return (
    <Screen onRefresh={refetch} header={<Header large title={t('nav.myClasses')} />}>
      {isLoading || !data ? <SkeletonList /> : (
        <>
          {data.my_classes.length ? data.my_classes.map((c, i) => {
            const terms = data.terms.filter((x) => x.class_id === c.id);
            return (
              <Card key={c.id} index={i} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText variant="h3">{c.name}</AppText>
                  <ClassTypeBadge type={c.class_type} />
                </View>
                <AppText variant="small" muted>{`${digits(c.duration_minutes)} ${t('common.minutes')}`}</AppText>
                {terms.map((term) => (
                  <View key={term.term_id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <AppText variant="small">{term.term_title}</AppText>
                      {term.remaining_sessions != null ? <AppText variant="small" color={term.remaining_sessions <= 2 ? colors.danger : colors.primaryDark}>{t('students.remaining', { n: digits(term.remaining_sessions) })}</AppText> : null}
                    </View>
                    {term.total_sessions ? <ProgressBar value={term.used_sessions / term.total_sessions} /> : null}
                  </View>
                ))}
              </Card>
            );
          }) : <EmptyState icon="tennis" title={t('student.noClasses')} />}
          <SectionHeader title={t('dashboard.upcoming')} />
          {data.upcoming_sessions.map((s, i) => (
            <SessionCard key={s.id} session={s} index={i} showDate={formatRelativeDay(s.start_at)} onPress={() => router.push(`/student/session/${s.id}`)} />
          ))}
        </>
      )}
    </Screen>
  );
}
