import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../api';
import { StudentCard } from '../components/StudentCard';
import { Chips, EmptyState, ErrorView, Fab, Header, Screen, SkeletonList, TextField } from '@/shared/components';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { spacing } from '@/shared/theme';
import { digits } from '@/shared/utils/format';

type Filter = 'all' | 'active' | 'inactive' | 'debt';

export function StudentsListScreen() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const debounced = useDebounce(q);
  const params = {
    q: debounced || undefined,
    status: filter === 'active' || filter === 'inactive' ? filter : undefined,
  };
  const { data, isLoading, error, refetch, isRefetching } = useStudents(params);
  const list = (data ?? []).filter((s) => filter !== 'debt' || (s.account && s.account.balance < 0));

  return (
    <Screen overlay={<Fab icon="account-plus" label={t('students.add')} onPress={() => router.push('/coach/student/form')} />} scroll={false} padded={false} header={<Header title={t('students.title')} subtitle={data ? t('students.count', { n: digits(list.length) }) : undefined} large />}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md }}>
        <TextField icon="magnify" placeholder={t('students.search')} value={q} onChangeText={setQ} />
        <Chips scroll size="sm" value={filter} onChange={setFilter} options={[
          { value: 'active', label: t('students.filter.active') },
          { value: 'all', label: t('common.all') },
          { value: 'debt', label: t('students.filter.debtors') },
          { value: 'inactive', label: t('students.filter.inactive') },
        ]} />
      </View>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? (
        <View style={{ paddingHorizontal: spacing.lg }}><SkeletonList /></View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 120 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item, index }) => <StudentCard student={item} index={index} onPress={() => router.push(`/coach/student/${item.id}`)} />}
          ListEmptyComponent={<EmptyState icon="account-search-outline" title={t('students.empty')} description={t('students.emptyHint')} actionLabel={t('students.add')} onAction={() => router.push('/coach/student/form')} />}
        />
      )}
    </Screen>
  );
}
