// InfoModal.js
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { primary } from '../utils/colors'; // Assuming you have a colors file

const InfoModal = ({ visible, title, message, onClose }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Ionicons name="information-circle-outline" size={50} color={primary} style={styles.icon} />

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Ok, got it!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    icon: {
        marginBottom: 10,
    },
    title: {
        fontSize: responsiveFontSize(2.5),
        fontFamily: 'Poppins-Bold',
        color: '#1F2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: responsiveFontSize(1.9),
        fontFamily: 'Poppins-Regular',
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 24,
    },
    button: {
        backgroundColor: primary,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 40,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2),
        textAlign: 'center',
    },
});

export default InfoModal;