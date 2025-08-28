import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    StyleSheet,
    Modal,
    ToastAndroid,
} from 'react-native';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { background, primary, secondary } from '../utils/colors';
import { useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { RAZORPAY_API_KEY } from '@env';

const ProcessingModal = ({ visible }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }} // Prevent closing on Android back button
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={styles.modalText}>Confirming your booking...</Text>
            </View>
        </View>
    </Modal>
);

const MeetPaymentScreen = ({ route, navigation }) => {
    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const { counselor, scheduleAt, scheduleTime, meetLink, selectedSlot } = route?.params;

    const [id, setId] = useState('');
    const [counselorName, setCounselorName] = useState('');

    useEffect(() => {
        if (counselor) {
            setId(counselor?.counselorId?._id);
            setCounselorName(counselor?.counselorId?.name);
        }
    }, [counselor]);

    const [loading, setLoading] = useState(false);
    const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

    const initiatePayment = async () => {
        setLoading(true);

        try {
            const orderRequestData = {
                amount: 500,
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            };

            const response = await axios.post(
                "/payment/create-order",
                orderRequestData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authToken,
                    },
                }
            );

            const order = response?.data?.order;
            const receiptData = response?.data?.order?.receipt;

            if (response?.data?.success && order?.id) {
                const options = {
                    currency: order.currency,
                    key: RAZORPAY_API_KEY,
                    amount: 500,
                    name: 'CALMSPACE',
                    order_id: order?.id,
                    theme: { color: primary }
                };

                RazorpayCheckout.open(options)
                    .then(async (data) => {
                        setIsConfirmingBooking(true);
                        try {
                            const verifyRequestData = {
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature,
                                amount: 500,
                                receipt: receiptData,
                                counselorId: id
                            };

                            const verificationResponse = await axios.post(
                                "/payment/verify-signaturer",
                                verifyRequestData,
                                {
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: authToken,
                                    },
                                }
                            );

                            if (verificationResponse?.data?.success) {
                                try {
                                    const submitData = {
                                        scheduleDate: scheduleAt,
                                        scheduleTime: scheduleTime,
                                        meetLink: meetLink,
                                        counselorName: counselorName,
                                        counselorId: id,
                                    };

                                    const bookingResponse = await axios.post(`/auth/book-appointment`, submitData, {
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: authToken,
                                        },
                                    });

                                    if (bookingResponse?.data?.status_code === 201) {
                                        if (Platform.OS === 'android') {
                                            ToastAndroid.show(`${bookingResponse?.data?.message}`, ToastAndroid.LONG);
                                        } else {
                                            showMessage({
                                                message: "Congratulations!",
                                                description: bookingResponse?.data?.message,
                                                type: "success",
                                                icon: "success",
                                            });
                                        }

                                        navigation.navigate('Confirmation', {
                                            selectedSlot: selectedSlot,
                                            scheduleAt: scheduleAt,
                                        });

                                    } else {
                                        if (Platform.OS === 'android') {
                                            ToastAndroid.show(`${bookingResponse?.data?.message || 'Something went wrong.'}`, ToastAndroid.SHORT);
                                        } else {
                                            showMessage({
                                                message: "Booking Failed!",
                                                description: bookingResponse?.data?.message || 'Something went wrong.',
                                                type: "danger",
                                                icon: "danger",
                                            });
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error confirming booking:', error);

                                    if (Platform.OS === 'android') {
                                        ToastAndroid.show('Could not book appointment. Please contact support.', ToastAndroid.SHORT);
                                    } else {
                                        showMessage({
                                            message: "Error!",
                                            description: "Could not book appointment. Please contact support.",
                                            type: "danger",
                                            icon: "danger",
                                        });
                                    }
                                }
                            } else {
                                if (Platform.OS === 'android') {
                                    ToastAndroid.show('The server could not verify your payment. Please contact support.', ToastAndroid.SHORT);
                                } else {
                                    showMessage({
                                        message: "Verification Failed",
                                        description: "The server could not verify your payment. Please contact support.",
                                        type: "danger",
                                        icon: "danger",
                                    });
                                }
                            }
                        } catch (verificationError) {
                            console.log("Signature verification failed: ", verificationError);

                            if (Platform.OS === 'android') {
                                ToastAndroid.show('Could not verify the payment. Please contact support.', ToastAndroid.SHORT);
                            } else {
                                showMessage({
                                    message: "Verification Failed",
                                    description: "Could not verify the payment. Please contact support.",
                                    type: "danger",
                                    icon: "danger",
                                });
                            }
                        } finally {
                            setIsConfirmingBooking(false);
                        }
                    })
                    .catch((error) => {
                        if (error.code === 'EC_RZP_USER_CANCELLED') {
                            if (Platform.OS === 'android') {
                                ToastAndroid.show('Payment Cancelled. You cancelled the payment process.', ToastAndroid.SHORT);
                            } else {
                                showMessage({
                                    message: "Payment Cancelled",
                                    description: "You cancelled the payment process.",
                                    type: "info",
                                    icon: "info",
                                });
                            }
                            return;
                        }

                        const errorMessage = error?.error?.reason || 'Payment was not completed.';

                        if (Platform.OS === 'android') {
                            ToastAndroid.show(`Payment Failed: ${errorMessage}`, ToastAndroid.SHORT);
                        } else {
                            showMessage({
                                message: "Payment Failed",
                                description: errorMessage,
                                type: "danger",
                                icon: "danger",
                            });
                        }
                    });
            } else {
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Could not create a payment order. Please try again.');
                } else {
                    showMessage({
                        message: "Error",
                        description: "Could not create a payment order. Please try again.",
                        type: "danger",
                        icon: "danger",
                    });
                }
            }

        } catch (error) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Unable to connect to the payment server. Please check your connection and try again.');
            } else {
                showMessage({
                    message: "Connection Error",
                    description: "Unable to connect to the payment server. Please check your connection and try again.",
                    type: "danger",
                    icon: "danger",
                });
            }
        } finally {
            setLoading(false);
        }
    }

    const isButtonDisabled = loading || isConfirmingBooking;

    return (
        <SafeAreaProvider>
            <>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar animated={true} barStyle={'dark-content'} hidden={false} />

                    <ProcessingModal visible={isConfirmingBooking} />

                    <View style={styles.contentContainer}>
                        <Text style={styles.mainHeading}>Payment Details</Text>

                        <View style={styles.sessionCard}>
                            <Text style={styles.sessionText}>
                                You are about to pay{' '}
                                <Text style={styles.highlightText}>₹500</Text> for a 60-minute one-to-one
                                session with{' '}
                                <Text style={styles.highlightText}>{counselorName}</Text>
                            </Text>
                        </View>

                        <View style={styles.whiteCard}>
                            <Text style={styles.priceHeading}>Price Details</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Session Price</Text>
                                <Text style={styles.priceValue}>₹500.00</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Taxes & Charges</Text>
                                <Text style={styles.priceValue}>₹0.00</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={{ ...styles.priceRow, marginTop: 8 }}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>₹500.00</Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <View style={styles.secureContainer}>
                                <MaterialCommunityIcons name="shield-check" size={20} color="#2ECC71" />
                                <Text style={styles.secureText}>Safe & Secure Payments. 100% Authentic.</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.payButton, { backgroundColor: isButtonDisabled ? '#A5C9CA' : primary }]}
                                onPress={initiatePayment}
                                disabled={isButtonDisabled}
                            >
                                {loading ? (
                                    <ActivityIndicator size={'small'} color={'#fff'} />
                                ) : (
                                    <Text style={styles.payButtonText}>Proceed to pay ₹500.00</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
                <FlashMessage
                    position="top"
                    floating={Platform.OS === 'ios' ? false : true}
                    statusBarHeight={StatusBar.currentHeight}
                />
            </>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        paddingVertical: 30,
        paddingHorizontal: 40,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginTop: 20,
        fontSize: responsiveFontSize(1.9),
        fontFamily: 'Poppins-SemiBold',
        color: '#333',
    },
    safeArea: {
        flex: 1,
        backgroundColor: background,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 5,
    },
    mainHeading: {
        fontSize: responsiveFontSize(2.3),
        color: '#2D9596',
        marginBottom: 20,
        fontFamily: 'Poppins-Bold',
        alignSelf: 'center',
    },
    sessionCard: {
        backgroundColor: secondary,
        padding: 16,
        borderRadius: 18,
        marginBottom: 15,
    },
    whiteCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        marginBottom: 15,
        borderColor: '#eee',
        borderWidth: 1
    },
    sessionText: {
        fontSize: responsiveFontSize(1.9),
        color: '#333',
        lineHeight: 24,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },
    highlightText: {
        fontFamily: 'Poppins-Bold',
        color: '#2D9596',
    },
    priceHeading: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(2),
        color: '#333',
        marginBottom: 15,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    priceLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: responsiveFontSize(1.8),
        color: '#555',
    },
    priceValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: responsiveFontSize(1.8),
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 5,
    },
    totalLabel: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(1.9),
        color: '#333',
    },
    totalValue: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(1.9),
        color: '#2D9596',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: Platform.OS === 'ios' ? 0 : 10,
    },
    secureContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#dffbe8',
        borderRadius: 12,
    },
    secureText: {
        marginLeft: 10,
        fontFamily: 'Poppins-Regular',
        fontSize: responsiveFontSize(1.6),
        color: '#166534',
    },
    payButton: {
        height: responsiveHeight(6.6),
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    payButtonText: {
        color: '#fff',
        fontSize: responsiveFontSize(2.2),
        fontFamily: 'Poppins-SemiBold',
    },
});

export default MeetPaymentScreen;
