import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { COLORS } from '../../utils/constants';

interface ReturnFormProps {
    server: 'student' | 'opponent'; // ← تغییر: به جای receiver، server را بگیر
    onReturnResult: (result: 'error' | 'in') => void;
    studentName?: string;
    opponentName?: string;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({
                                                          server,
                                                          onReturnResult,
                                                          studentName = 'Student',
                                                          opponentName = 'Opponent'
                                                      }) => {
    // تعیین کننده چه کسی ریترن می‌زند
    const returner = server === 'student' ? 'opponent' : 'student';
    const returnerName = returner === 'student' ? studentName : opponentName;

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text style={styles.title}>Return</Text>
                <Text style={styles.subtitle}>
                    {returnerName}'s Return
                </Text>

                <View style={styles.buttonGroup}>
                    <Button
                        mode="contained"
                        onPress={() => onReturnResult('error')}
                        style={[styles.button, styles.errorButton]}
                    >
                        Error
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => onReturnResult('in')}
                        style={[styles.button, styles.successButton]}
                    >
                        In Play
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        backgroundColor: COLORS.surface,
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
    buttonGroup: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        margin: 4,
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    errorButton: {
        backgroundColor: COLORS.error,
    },
});