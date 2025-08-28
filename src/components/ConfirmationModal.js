// ConfirmationModal.js
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { primary } from '../utils/colors';

const ConfirmationModal = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    iconName = "alert-circle-outline"
}) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Ionicons name={iconName} size={50} color={'#F59E0B'} style={styles.icon} />

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                            <Text style={[styles.buttonText, styles.confirmButtonText]}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
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
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 20,
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
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        borderRadius: 12,
        paddingVertical: 12,
        width: '48%', // Two buttons with a small gap
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    confirmButton: {
        backgroundColor: primary,
    },
    buttonText: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(1.9),
    },
    cancelButtonText: {
        color: '#374151',
    },
    confirmButtonText: {
        color: 'white',
    },
});

export default ConfirmationModal;