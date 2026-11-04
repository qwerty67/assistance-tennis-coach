import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { VALID_VALUES, COLORS } from '../../utils/constants';
import { TennisHelpers } from '../../utils/tennisLogic';
import {useTheme} from "../../context/ThemeContext";

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
                                                                    studentName = 'Student',
                                                                    opponentName = 'Opponent'
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

    const isComplete = player && strokeType && direction && result;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
            <Card style={[styles.card,{backgroundColor:colors.surface}]}>
                <Card.Content>
                    <Text style={[styles.title,{color:colors.text}]}>Final Stroke</Text>
                    <Text style={styles.subtitle}>
                        Record the stroke that ended the point
                    </Text>

                    {/* Player Selection */}
                    <Text style={[styles.label,{color:colors.textSecondary}]}>Who hit the final stroke?</Text>
                    <View style={styles.chipGroup}>
                        <Chip
                            selected={player === 'student'}
                            onPress={() => setPlayer('student')}
                            style={styles.chip}
                        >
                            {studentName}
                        </Chip>
                        <Chip
                            selected={player === 'opponent'}
                            onPress={() => setPlayer('opponent')}
                            style={styles.chip}
                        >
                            {opponentName}
                        </Chip>
                    </View>

                    {/* Stroke Type */}
                    <Text style={[styles.label,{color:colors.textSecondary}]}>Stroke Type</Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.stroke_types.map((type) => (
                            <Chip
                                key={type}
                                selected={strokeType === type}
                                onPress={() => setStrokeType(type)}
                                style={styles.chip}
                            >
                                {TennisHelpers.getStrokeTypeDisplayName(type as any)}
                            </Chip>
                        ))}
                    </View>

                    {/* Direction */}
                    <Text style={[styles.label,{color:colors.textSecondary}]}>Direction</Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.directions.map((dir) => (
                            <Chip
                                key={dir}
                                selected={direction === dir}
                                onPress={() => setDirection(dir)}
                                style={styles.chip}
                            >
                                {TennisHelpers.getDirectionDisplayName(dir as any)}
                            </Chip>
                        ))}
                    </View>

                    {/* Result */}
                    <Text style={[styles.label,{color:colors.textSecondary}]}>Result</Text>
                    <View style={styles.chipGroup}>
                        {VALID_VALUES.final_stroke_results.map((res) => (
                            <Chip
                                key={res}
                                selected={result === res}
                                onPress={() => setResult(res)}
                                style={[
                                    styles.chip,
                                    res === 'winner' && styles.winnerChip,
                                    (res === 'forced_error' || res === 'unforced_error' || res === 'net') &&
                                    styles.errorChip
                                ]}
                            >
                                {TennisHelpers.getFinalStrokeResultDisplayName(res as any)}
                            </Chip>
                        ))}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonGroup}>
                        <Button
                            mode="outlined"
                            onPress={onCancel}
                            style={styles.button}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            disabled={!isComplete}
                            style={[styles.button, styles.submitButton]}
                        >
                            Save Point
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
        marginBottom: 12,
        // backgroundColor: COLORS.surface,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 8,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    chip: {
        margin: 4,
    },
    winnerChip: {
        backgroundColor: '#E8F5E9',
    },
    errorChip: {
        backgroundColor: '#FFEBEE',
    },
    buttonGroup: {
        flexDirection: 'row',
        marginTop: 16,
    },
    button: {
        flex: 1,
        margin: 4,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
    },
});