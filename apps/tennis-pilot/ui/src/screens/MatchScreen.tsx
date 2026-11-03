import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MatchCard } from '../components/match';
import { LoadingScreen, EmptyState, CustomHeader } from '../components/common';
import { matchService } from '../services/matchService';
import { Match } from '../types';
import { COLORS, SPACING } from '../theme';
import {useTheme} from "../context/ThemeContext";

interface MatchScreenProps {
    navigation: any;
}

const MatchScreen: React.FC<MatchScreenProps> = ({ navigation }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { colors } = useTheme();

    const loadMatches = async () => {
        try {
            const data = await matchService.getAll();
            // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
            const sortedData = data.sort((a: any, b: any) =>
                new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
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

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <View style={[styles.container,{backgroundColor: colors.background}]}>
            <CustomHeader
                title="Matches"
                subtitle={`${matches.length} matches`}
                rightAction={{
                    icon: 'plus',
                    onPress: () => navigation.navigate('CreateMatch'),
                }}
            />

            {matches.length === 0 ? (
                <EmptyState
                    icon="tennis"
                    title="No Matches Yet"
                    message="Create your first match to start tracking"
                    actionLabel="Create Match"
                    onAction={() => navigation.navigate('CreateMatch')}
                />
            ) : (
                <FlatList
                    data={matches}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <MatchCard
                            match={item}
                            // ✅ ارسال navigation به MatchCard تا بتواند دکمه Continue را مدیریت کند
                            navigation={navigation}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    // ✅ رفع باگ چسبیدن کارت‌ها به هم:
                    ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
});

export default MatchScreen;