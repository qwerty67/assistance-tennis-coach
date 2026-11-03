import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppText, Button, Card, Header, Icon, Screen, SectionHeader, SkeletonList, EmptyState, Badge
} from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { usePilotMatches } from '@/features/pilot/api';

export default function TennisPilotHubScreen() {
  const { t } = useTranslation();
  const { data: matches, isLoading, refetch } = usePilotMatches();
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'completed'>('all');

  const filtered = (matches ?? []).filter((m) => {
    if (activeTab === 'ongoing') return m.status === 'ongoing';
    if (activeTab === 'completed') return m.status === 'completed';
    return true;
  });

  return (
    <Screen header={<Header back title=" TennisPilot \u00b7 \u062f\u0633\u062a\u06cc\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062f \u0645\u0633\u0627\u0628\u0642\u0647\ />}>
 {/* Hero AI banner */}
 <Card style={styles.heroCard}>
 <View style={styles.heroHeader}>
 <View style={styles.aiBadge}>
 <Icon name=\robot-outline\ size={16} color=\#fff\ />
 <AppText variant=\caption\ style={{ color: '#fff', fontWeight: 'bold' }}>TennisPilot AI</AppText>
 </View>
 <AppText variant=\caption\ muted>\u0645\u0648\u062a\u0648\u0631 \u062b\u0628\u062a \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0645\u062a\u06cc\u0627\u0632 \u0632\u0646\u062f\u0647</AppText>
 </View>

 <AppText variant=\h2\ style={{ marginTop: spacing.xs }}>\u0622\u0646\u0627\u0644\u06cc\u0632 \u0648 \u062b\u0628\u062a \u0644\u0627\u06cc\u0648 \u0645\u0633\u0627\u0628\u0642\u0627\u062a</AppText>
 <AppText variant=\body\ muted style={{ marginTop: 4 }}>
 \u062b\u0628\u062a \u0636\u0631\u0628\u0627\u062a \u0648\u06cc\u0646\u0631\u060c \u062e\u0637\u0627\u0647\u0627\u060c \u0633\u0631\u0648\u06cc\u0633 \u0648 \u062f\u0631\u06cc\u0627\u0641\u062a \u062a\u0648\u067e \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u06af\u0632\u0627\u0631\u0634 \u062a\u062d\u0644\u06cc\u0644\u06cc \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc.
 </AppText>

 <View style={styles.actionRow}>
 <Button
 title=\\u0634\u0631\u0648\u0639 \u0645\u0633\u0627\u0628\u0642\u0647 \u062c\u062f\u06cc\u062f\
 icon=\plus\
 size=\md\
 onPress={() => router.push('/coach/student')}
 />
 </View>
 </Card>

 <SectionHeader title=\\u0645\u0633\u0627\u0628\u0642\u0627\u062a \u062b\u0628\u062a\u200c\u0634\u062f\u0647\ count={filtered.length} />

 {isLoading ? (
 <SkeletonList rows={3} />
 ) : filtered.length === 0 ? (
 <Card>
 <EmptyState
 icon=\tennis\
 title=\\u0647\u0646\u0648\u0632 \u0645\u0633\u0627\u0628\u0642\u0647\u200c\u0627\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a\
 description=\\u0628\u0631\u0627\u06cc \u0634\u0631\u0648\u0639 \u0622\u0646\u0627\u0644\u06cc\u0632 \u0647\u0648\u0634\u0645\u0646\u062f\u060c \u06cc\u06a9 \u0645\u0633\u0627\u0628\u0642\u0647 \u0628\u0631\u0627\u06cc \u0634\u0627\u06af\u0631\u062f \u062e\u0648\u062f \u0627\u06cc\u062c\u0627\u062f \u06a9\u0646\u06cc\u062f.\
 actionLabel=\\u0627\u0646\u062a\u062e\u0627\u0628 \u0634\u0627\u06af\u0631\u062f \u0648 \u062b\u0628\u062a \u0645\u0633\u0627\u0628\u0642\u0647\
 onAction={() => router.push('/coach/students')}
 />
 </Card>
 ) : (
 filtered.map((m) => (
 <Card key={m.id} style={{ marginBottom: spacing.sm }}>
 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
 <View>
 <AppText variant=\h3\>{m.student_name || '\u0634\u0627\u06af\u0631\u062f'} vs {m.opponent_name}</AppText>
 <AppText variant=\caption\ muted>{m.match_date} \u00b7 {m.location || '\u06a9\u0648\u0631\u062a \u0627\u0635\u0644\u06cc'}</AppText>
 </View>
 <Badge
 label={m.status === 'completed' ? '\u062a\u06a9\u0645\u06cc\u0644 \u0634\u062f\u0647' : '\u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u06af\u0632\u0627\u0631\u06cc'}
 tone={m.status === 'completed' ? 'success' : 'warning'}
 />
 </View>
 {m.sets_score && (
 <AppText variant=\body\ style={{ marginTop: spacing.xs, fontWeight: 'bold' }}>
 \u0646\u062a\u06cc\u062c\u0647: {m.sets_score}
 </AppText>
 )}
 </Card>
 ))
 )}
 </Screen>
 );
}

const styles = StyleSheet.create({
 heroCard: {
 backgroundColor: colors.surface,
 borderWidth: 1,
 borderColor: colors.border,
 marginBottom: spacing.md,
 },
 heroHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 },
 aiBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 4,
 backgroundColor: colors.primaryDark,
 paddingHorizontal: 8,
 paddingVertical: 4,
 borderRadius: radius.sm,
 },
 actionRow: {
 flexDirection: 'row',
 marginTop: spacing.md,
 gap: spacing.sm,
 },
});
