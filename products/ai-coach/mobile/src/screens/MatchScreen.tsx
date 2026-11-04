import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    Chips,
    EmptyState,
    Fab,
    Header,
    Screen,
    SkeletonList,
    TextField,
} from '@tennis-platform/design-system';
import { spacing } from '@tennis-platform/design-system';
import { digits } from '@tennis-platform/shared-utils';
import { MatchCard } from '../components/match/MatchCard';
import { matchService } from '../services/matchService';
import { Match } from '../types';

type MatchFilter = 'all' | 'ongoing' | 'completed' | 'win';

export default function MatchScreen({ navigation }: any) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<MatchFilter>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMatches = async () => {
        try {
            const data = await matchService.getAll();
            const sortedData = data.sort((a: any, b: any) =>
                new Date(b.match_date || b.created_at || '').getTime() -
                new Date(a.match_date || a.created_at || '').getTime()
            );
            setMatches(sortedData);
        } catch (error) {
            console.error('Error loading matches:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMatches();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMatches();
    }, []);

    const filteredMatches = useMemo(() => {
        return matches.filter((m) => {
            const matchSearch =
                !search.trim() ||
                m.opponent_name.toLowerCase().includes(search.toLowerCase()) ||
                (m.location && m.location.toLowerCase().includes(search.toLowerCase()));
            if (!matchSearch) return false;

            if (filter === 'ongoing') return m.status === 'ongoing';
            if (filter === 'completed') return m.status === 'completed';
            if (filter === 'win') return m.final_result === 'win';
            return true;
        });
    }, [matches, search, filter]);

    const header = (
        <Header
            title="مسابقات و بازی‌ها"
            subtitle={`${digits(filteredMatches.length)} مسابقه`}
            large
        />
    );

    return (
        <Screen
            scroll={false}
            padded={false}
            header={header}
            overlay={
                <Fab
                    icon="tennis"
                    label="مسابقه جدید"
                    onPress={() => navigation.navigate('CreateMatch')}
                />
            }
        >
            <View style={styles.filterSection}>
                <TextField
                    icon="magnify"
                    placeholder="جستجوی نام حریف یا محل مسابقه..."
                    value={search}
                    onChangeText={setSearch}
                />
                <Chips
                    scroll
                    size="sm"
                    value={filter}
                    onChange={(v: any) => setFilter(v)}
                    options={[
                        { value: 'all', label: 'همه مسابقات' },
                        { value: 'ongoing', label: 'در جریان' },
                        { value: 'completed', label: 'تکمیل‌شده' },
                        { value: 'win', label: 'پیروزی‌ها' },
                    ]}
                />
            </View>

            {loading ? (
                <View style={{ paddingHorizontal: spacing.lg }}>
                    <SkeletonList rows={4} />
                </View>
            ) : (
                <FlatList
                    data={filteredMatches}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    renderItem={({ item, index }) => (
                        <MatchCard
                            match={item}
                            index={index}
                            navigation={navigation}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="tennis"
                            title="مسابقه‌ای یافت نشد"
                            description={
                                search.trim()
                                    ? 'مسابقه‌ای با این مشخصات یافت نشد.'
                                    : 'اولین مسابقه را برای ثبت امتیازات و آنالیز ایجاد کنید.'
                            }
                            actionLabel="ایجاد مسابقه جدید"
                            onAction={() => navigation.navigate('CreateMatch')}
                        />
                    }
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    filterSection: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        paddingBottom: 130,
    },
});
