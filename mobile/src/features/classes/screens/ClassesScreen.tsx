import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useClasses } from '../api';
import { ClassCard } from '../components/ClassCard';
import { Chips, EmptyState, ErrorView, Fab, Header, Screen, SkeletonList } from '@/shared/components';
import { classTypeColors, spacing } from '@/shared/theme';
import type { ClassType } from '@/shared/types/api';

export function ClassesScreen() {
  const { t } = useTranslation();
  const [type, setType] = useState<ClassType | 'all'>('all');
  const { data, isLoading, error, refetch, isRefetching } = useClasses(type === 'all' ? {} : { class_type: type });
  return (
    <Screen overlay={<Fab label={t('classes.add')} onPress={() => router.push('/coach/class/form')} />} scroll={false} padded={false} header={<Header large title={t('classes.title')} />}>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <Chips scroll size="sm" value={type} onChange={setType} options={[
          { value: 'all', label: t('common.all') },
          ...(['private', 'semi_private', 'group', 'academy'] as const).map((v) => ({ value: v, label: t(`classes.type.${v}`), color: classTypeColors[v].main })),
        ]} />
      </View>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <View style={{ paddingHorizontal: spacing.lg }}><SkeletonList /></View> : (
        <FlatList
          data={data}
          keyExtractor={(c) => c.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 120 }}
          renderItem={({ item, index }) => <ClassCard item={item} index={index} onPress={() => router.push(`/coach/class/${item.id}`)} />}
          ListEmptyComponent={<EmptyState icon="tennis" title={t('classes.empty')} description={t('classes.emptyHint')} actionLabel={t('classes.add')} onAction={() => router.push('/coach/class/form')} />}
        />
      )}
    </Screen>
  );
}
