import { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Modal,
  ScrollView,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { background, primary, secondary } from '../utils/colors';
import { useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';
import { RAZORPAY_API_KEY } from '@env';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const ProcessingModal = ({ visible }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={() => { }}
  >
    <View style={styles.modalOverlay}>
      {/* Tablet Fix: Constrain modal width */}
      <View style={[styles.modalContent, isTablet && { width: '50%', paddingVertical: 50 }]}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.modalText, isTablet && { fontSize: responsiveFontSize(1.5) }]}>
          Confirming your booking...
        </Text>
      </View>
    </View>
  </Modal>
);

const BoostPayment = ({ route, navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const { id, name, pic, amount } = route?.params;
  console.log('id: ', id);
  console.log('name: ', name);
  console.log('pic: ', pic);
  console.log('amount: ', amount);

  const [loading, setLoading] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const [counselorName, setCounselorName] = useState(name);

  const initiatePayment = async () => {
    setLoading(true);

    try {
      const orderRequestData = {
        amount: amount,
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
          // amount: amount,
          amount: 1, //change for testing
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
                // amount: amount,
                amount: 1, //change for testing
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
                  const url = `/payment/paymentstatus/${id}`;
                  const response = await axios.get(url, {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: authToken,
                    },
                  });

                  console.log('BoostPayment response: ', response); //change for testing

                  if (response?.data?.expiredAt) {
                    navigation.navigate('BoostChat', {
                      id: id,
                      name: counselorName,
                      pic: pic,
                      expiredAt: response?.data?.expiredAt,
                    });
                  } else {
                    showMessage({
                      message: "Data Incomplete",
                      description: "Could not retrieve session details from the server.",
                      type: "warning",
                    });
                  }
                } catch (error) {
                  // Error handling logic remains the same...
                  console.log('Status check error', error);
                }
              }
            } catch (verificationError) {
              console.log("Signature verification failed: ", verificationError);
              if (Platform.OS === 'android') {
                ToastAndroid.show("Could not verify the payment. Please contact support.", ToastAndroid.SHORT);
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
          }).catch((error) => {
            if (error.code === 'EC_RZP_USER_CANCELLED') {
              if (Platform.OS === 'android') {
                ToastAndroid.show("Payment Cancelled", ToastAndroid.SHORT);
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
              ToastAndroid.show(`Payment Failed: ${errorMessage}`, ToastAndroid.LONG);
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
        showMessage({
          message: "Error",
          description: "Could not create a payment order. Please try again.",
          type: "danger",
          icon: "danger",
        });
      }

    } catch (error) {
      console.log('Error creating payment order: ', error);
      showMessage({
        message: "Connection Error",
        description: "Unable to connect to the payment server. Please check your internet connection and try again.",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar animated={true} barStyle={'dark-content'} hidden={false} />

        <ProcessingModal visible={isConfirmingBooking} />

        <View style={styles.contentContainer}>
          {/* --- 2. Tablet Wrapper for Main Content --- */}
          <View style={isTablet ? styles.tabletWrapper : styles.mobileWrapper}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={[styles.mainHeading, isTablet && { fontSize: responsiveFontSize(1.8) }]}>
                Payment Details
              </Text>

              {/* Session Details Card */}
              <View style={styles.sessionCard}>
                <Text style={[styles.sessionText, isTablet && { fontSize: responsiveFontSize(1.2), lineHeight: 30 }]}>
                  You are about to pay{' '}
                  <Text style={styles.highlightText}>₹{amount}</Text> for a 20-minute
                  session with{' '}
                  <Text style={styles.highlightText}>{name}</Text>
                </Text>
              </View>

              {/* Price Breakup Card */}
              <View style={styles.whiteCard}>
                <Text style={[styles.priceHeading, isTablet && { fontSize: responsiveFontSize(1.4) }]}>
                  Price Details
                </Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, isTablet && { fontSize: responsiveFontSize(1.2) }]}>Session Price</Text>
                  <Text style={[styles.priceValue, isTablet && { fontSize: responsiveFontSize(1.2) }]}>₹{amount}.00</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, isTablet && { fontSize: responsiveFontSize(1.2) }]}>Taxes & Charges</Text>
                  <Text style={[styles.priceValue, isTablet && { fontSize: responsiveFontSize(1.2) }]}>₹0.00</Text>
                </View>

                <View style={styles.divider} />

                <View style={{ ...styles.priceRow, marginTop: 8 }}>
                  <Text style={[styles.totalLabel, isTablet && { fontSize: responsiveFontSize(1.3) }]}>Total Amount</Text>
                  <Text style={[styles.totalValue, isTablet && { fontSize: responsiveFontSize(1.3) }]}>₹{amount}.00</Text>
                </View>
              </View>

              {/* Extension Info Card */}
              <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'flex-start' }]}>
                <Icon name="pin" size={isTablet ? 20 : 13} color="red" style={styles.pinIcon} />
                <Text style={[styles.infoText, isTablet && { fontSize: responsiveFontSize(1) }]}>
                  If you want to extend beyond 20 minutes, an additional{' '}
                  <Text style={styles.highlightText}>₹199</Text> will be charged for another 20 minutes
                  after the completion of this session until 3 sessions have been completed.
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.secureContainer}>
                <MaterialCommunityIcons name="shield-check" size={isTablet ? 26 : 20} color="#2ECC71" />
                <Text style={[styles.secureText, isTablet && { fontSize: responsiveFontSize(1.2) }]}>
                  Safe & Secure Payments. 100% Authentic.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.payButton,
                  { backgroundColor: loading ? '#A5C9CA' : primary },
                  isTablet && { height: 60 } // Taller button for tablet
                ]}
                // onPress={initiatePayment}
                onPress={() => navigation.navigate('BoostChat')} //change for testing
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size={'small'} color={'#fff'} />
                ) : (
                  <Text style={[styles.payButtonText, isTablet && { fontSize: responsiveFontSize(1.4) }]}>
                    Proceed to pay ₹{amount}.00
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </SafeAreaView>
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
    shadowOffset: { width: 0, height: 2 },
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
  // --- New Wrappers ---
  mobileWrapper: {
    flex: 1,
  },
  tabletWrapper: {
    flex: 1,
    width: '60%',
    alignSelf: 'center',
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
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    borderColor: '#000',
    borderWidth: 0.5
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
  pinIcon: {
    marginRight: 10,
    marginTop: 5,
  },
  infoText: {
    fontSize: responsiveFontSize(1.6),
    color: '#555',
    lineHeight: 22,
    flex: 1,
    fontFamily: 'Poppins-Regular',
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
    height: responsiveHeight(6),
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

export default BoostPayment;