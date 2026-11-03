import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { VALID_VALUES, COLORS } from '../../utils/constants';

interface ServeFormProps {
    server: 'student' | 'opponent';
    serveType: 'first' | 'second';
    onServeResult: (result: 'ace' | 'fault' | 'let' | 'in' | 'double_fault') => void;
    studentName?: string;
    opponentName?: string;
}

export const ServeForm: React.FC<ServeFormProps> = ({
                                                        server,
                                                        serveType,
                                                        onServeResult,
                                                        studentName = 'Student',
                                                        opponentName = 'Opponent'
                                                    }) => {
    const serverName = server === 'student' ? studentName : opponentName;

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text style={styles.title}>Serve</Text>
                <Text style={styles.subtitle}>
                    {serverName} • {serveType === 'first' ? '1st' : '2nd'} Serve
                </Text>

                <View style={styles.buttonGroup}>
                    {serveType === 'first' ? (
                        <>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('ace')}
                                style={[styles.button, styles.successButton]}
                            >
                                Ace
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('let')}
                                style={[styles.button, styles.warningButton]}
                            >
                                Let
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('fault')}
                                style={[styles.button, styles.errorButton]}
                            >
                                Fault
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('in')}
                                style={[styles.button, styles.primaryButton]}
                            >
                                In Play
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('ace')}
                                style={[styles.button, styles.successButton]}
                            >
                                Ace
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('let')}
                                style={[styles.button, styles.warningButton]}
                            >
                                Let
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('double_fault')}
                                style={[styles.button, styles.errorButton]}
                            >
                                Double Fault
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onServeResult('in')}
                                style={[styles.button, styles.primaryButton]}
                            >
                                In Play
                            </Button>
                        </>
                    )}
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
        flexWrap: 'wrap',
    },
    button: {
        flex: 1,
        margin: 4,
        minWidth: '45%',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    warningButton: {
        backgroundColor: COLORS.warning,
    },
    errorButton: {
        backgroundColor: COLORS.error,
    },
});