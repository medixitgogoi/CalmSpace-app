import React from 'react';
import { Modal, View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

const ProcessingPaymentModal = ({ visible }) => {
    return (
        <Modal
            // Set transparent to false as the view is now opaque and full-screen
            transparent={false}
            animationType="fade"
            visible={visible}
            // onRequestClose is good practice for accessibility and Android back button
            onRequestClose={() => {
                // You can decide if the user can close the modal.
                // For a payment screen, it's often best to prevent this.
            }}
        >
            {/* SafeAreaView ensures content doesn't overlap with notches or status bars */}
            <SafeAreaView style={styles.container}>
                {/* Setting the status bar style for this specific screen */}
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <LottieView
                    source={require('../assets/animations/processing.json')} // Ensure this path is correct
                    autoPlay
                    loop
                    style={styles.lottieAnimation}
                />
                <Text style={styles.title}>Processing Payment</Text>
                <Text style={styles.message}>
                    Please wait, we are securely confirming your transaction. Do not close the app or press the back button.
                </Text>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // This container takes up the full screen
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Solid white background
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',     // Center content horizontally
    },
    lottieAnimation: {
        // Adjusted size for a full-screen view
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        fontSize: responsiveFontSize(2.8),
        fontFamily: 'Poppins-Bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    message: {
        fontSize: responsiveFontSize(2),
        fontFamily: 'Poppins-Regular',
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 26,
        // Add padding to prevent text from touching screen edges
        paddingHorizontal: 40,
    },
});

export default ProcessingPaymentModal;
