import React from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import { responsiveFontSize } from "react-native-responsive-dimensions";

const InfoRow = ({ label, value }) => {
    const { width } = useWindowDimensions();

    // On tablets, scale down the percentage slightly to keep text elegant
    const adaptiveFontSize = width > 768 ? responsiveFontSize(1.2) : responsiveFontSize(1.7);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { fontSize: adaptiveFontSize }]}>
                {label}
            </Text>

            <Text style={[styles.value, { fontSize: adaptiveFontSize }]}>
                {value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8, // Slightly increased for better breathing room
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc', // Very subtle separator
        paddingBottom: 8,
    },
    label: {
        fontFamily: 'Poppins-Medium',
        color: '#334155',
    },
    value: {
        fontFamily: 'Poppins-Regular',
        color: '#64748b',
        textAlign: 'right', // Ensures value aligns right if it wraps
        flex: 1, // Allows value to take up space if needed
        paddingLeft: 20,
    }
});

export default InfoRow;