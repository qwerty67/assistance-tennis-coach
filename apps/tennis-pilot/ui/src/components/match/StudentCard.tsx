import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import { Title, Paragraph, Text, IconButton } from 'react-native-paper';
import { AppCard } from '../common';
import { Student } from '../../types';
import {useTheme} from "../../context/ThemeContext";

interface StudentCardProps {
    student: Student;
    onPress?: () => void;
    onDelete?: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
                                                            student,
                                                            onPress,
                                                            onDelete
                                                        }) => {
    const { colors } = useTheme();


    return (

        <AppCard onPress={onPress}>
            <TouchableOpacity
                onPress={onPress} // ✅ این خط را اضافه کنید
                activeOpacity={0.7}
            >
            <View style={styles.header}>
                <View style={[styles.info]}>
                    <Title style={{color:colors.text}}>{student.name}</Title>
                    {student.email && <Paragraph style={{color:colors.textSecondary}}>{student.email}</Paragraph>}
                    {student.phone && <Paragraph style={{color:colors.textSecondary}}>{student.phone}</Paragraph>}
                </View>
                {onDelete && (
                    <IconButton
                        icon={"delete"}
                        iconColor={"#F44336"}
                        size={20}
                        onPress={onDelete}
                    />
                )}
            </View>
            <View style={styles.stats}>
                <Text style={[styles.statItem,{color:colors.primary}]}>
                    Matches: {student.total_matches || 0}
                </Text>
                <Text style={[styles.statItem,{color:colors.primary}]}>
                    Wins: {student.wins || 0}
                </Text>
                <Text style={[styles.statItem,{color:colors.primary}]}>
                    Win Rate: {student.win_rate?.toFixed(1) || 0}%
                </Text>
            </View>
            </TouchableOpacity>
        </AppCard>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    info: {
        flex: 1,
    },
    stats: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    statItem: {
        flex: 1,
        fontSize: 12,
        // color: '#757575',
        textAlign: 'center',
    },
});