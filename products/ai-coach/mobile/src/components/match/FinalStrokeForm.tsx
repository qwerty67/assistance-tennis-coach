import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { VALID_VALUES, COLORS } from '../../utils/constants';
import { TennisHelpers } from '../../utils/tennisLogic';
import { useTheme } from '../../context/ThemeContext';
import { colors as dsColors, palette, radius, spacing } from '@tennis-platform/design-system';

interface FinalStrokeFormProps {
    onSubmit: (data: {
        player: 'student' | 'opponent';
        type: string;
        direction: string;
        result: 'winner' | 'forced_error' | 'unforced_error' | 'net';
    }) => void;
    onCancel: () => void;
    studentName?: string;
    opponentName?: string;
}

export const FinalStrokeForm: React.FC<FinalStrokeFormProps> = ({
    onSubmit,
    onCancel,
    studentName = 'شاگرد',
    opponentName = 'حریف'
}) => {
    const [player, setPlayer] = useState<'student' | 'opponent' | null>(null);
    const [strokeType, setStrokeType] = useState<string | null>(null);
    const [direction, setDirection] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const { colors } = useTheme();

    const handleSubmit = () => {
        if (player && strokeType && direction && result) {
            onSubmit({
                player,
                type: strokeType,
                direction,
                result: result as any,
            });
        }
    };

    const isComplete = Boolean(player && strokeType && direction && result);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Card.Content>
                    <Text style={[styles.title, { color: colors.text }]}>
                        ثبت ضربه پایانی و رویداد امتیاز
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        تکنیک، تاکتیک و وضعیت خاتمه رالی را مشخص کنید
                    </Text>

                    {/* Player Selection */}
                    <Text style={[styles.label, { color: colors.text }]}>
                        ضربه نهایی توسط چه بازیکنی زده شد؟
                    </Text>
                    <View style={styles.chipGroup}>
                        <Chip
                            selected={player === 'student'}
                            onPress={() => setPlayer('student')}
                            style={[
                                styles.chip,
                                player === 'student' && styles.selectedChip
                            ]}
                            textStyle={styles.chipText}
                        >
                            {studentName} (شاگرد)
                        </Chip>
                        <Chip
                            selected={player === 'opponent'}
                            onPress={() => setPlayer('opponent')}
                            style={[
                                styles.chip,
                                player === 'opponent' && styles.selectedChip
                            ]}
                            textStyle={styles.chipText}
                        >
                            {opponentName} (حریف)
                        </Chip>
                    </View>

                    {/* Stroke Type (Techniques) */}
                    <Text style={[styles.label, { color: colors.text }]}>
                        تکنیک ضربه (نوع ضربه)
                    </Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.stroke_types.map((type) => (
                            <Chip
                                key={type}
                                selected={strokeType === type}
                                onPress={() => setStrokeType(type)}
                                style={[
                                    styles.chip,
                                    strokeType === type && styles.selectedChip
                                ]}
                                textStyle={styles.chipText}
                            >
                                {TennisHelpers.getStrokeTypeDisplayName(type as any)}
                            </Chip>
                        ))}
                    </View>

                    {/* Direction (Tactics) */}
                    <Text style={[styles.label, { color: colors.text }]}>
                        تاکتیک و جهت ضربه
                    </Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.directions.map((dir) => (
                            <Chip
                                key={dir}
                                selected={direction === dir}
                                onPress={() => setDirection(dir)}
                                style={[
                                    styles.chip,
                                    direction === dir && styles.selectedChip
                                ]}
                                textStyle={styles.chipText}
                            >
                                {TennisHelpers.getDirectionDisplayName(dir as any)}
                            </Chip>
                        ))}
                    </View>

                    {/* Result (States) */}
                    <Text style={[styles.label, { color: colors.text }]}>
                        حالت و وضعیت پایان امتیاز
                    </Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.final_stroke_results.map((res) => {
                            const isWinner = res === 'winner' || res === 'forced_error';
                            const isSelected = result === res;
                            return (
                                <Chip
                                    key={res}
                                    selected={isSelected}
                                    onPress={() => setResult(res)}
                                    style={[
                                        styles.chip,
                                        isSelected && (isWinner ? styles.winnerChip : styles.errorChip)
                                    ]}
                                    textStyle={[
                                        styles.chipText,
                                        isSelected && { fontWeight: '700' }
                                    ]}
                                >
                                    {TennisHelpers.getFinalStrokeResultDisplayName(res as any)}
                                </Chip>
                            );
                        })}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonGroup}>
                        <Button
                            mode="outlined"
                            onPress={onCancel}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                        >
                            انصراف
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            disabled={!isComplete}
                            style={[styles.button, isComplete ? styles.submitButton : styles.disabledButton]}
                            labelStyle={[styles.buttonLabel, { color: isComplete ? '#FFFFFF' : '#888' }]}
                        >
                            ثبت امتیاز (Save Point)
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        marginBottom: 16,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
        fontFamily: 'Vazirmatn_700Bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'right',
        fontFamily: 'Vazirmatn_400Regular',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'right',
        fontFamily: 'Vazirmatn_700Bold',
        marginTop: 14,
        marginBottom: 8,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 6,
        marginBottom: 8,
    },
    chip: {
        marginVertical: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: dsColors.border,
        backgroundColor: dsColors.surface,
    },
    selectedChip: {
        backgroundColor: palette.lime200,
        borderColor: palette.navy800,
    },
    winnerChip: {
        backgroundColor: '#D1F2D9',
        borderColor: '#2E7D32',
    },
    errorChip: {
        backgroundColor: '#FFDEDF',
        borderColor: '#C62828',
    },
    chipText: {
        fontFamily: 'Vazirmatn_500Medium',
        fontSize: 12,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    button: {
        flex: 1,
        borderRadius: radius.md,
    },
    buttonLabel: {
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: palette.navy900,
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
    },
});
