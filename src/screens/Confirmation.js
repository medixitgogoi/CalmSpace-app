import {
  View,
  Text,
  BackHandler,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform, // Import Platform
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  responsiveFontSize,
  responsiveHeight, // Import responsiveHeight
} from 'react-native-responsive-dimensions';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { background } from '../utils/colors';

// A modern color palette for a fresh look
const COLORS = {
  background: '#F8F9FA', // Kept for consistency, but not used for the main safeArea
  primary: '#28A745', // A vibrant, successful green
  primaryMuted: '#E9F5E9', // A muted version of the primary for backgrounds
  textPrimary: '#212529', // Dark gray for main text
  textSecondary: '#6C757D', // Lighter gray for secondary text
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

const Confirmation = ({ route }) => {
  const { selectedSlot: time, scheduleAt: date } = route.params;
  const navigation = useNavigation();

  // Animations for a delightful entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Hardware back button handler
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );

    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => backHandler.remove();
  }, [fadeAnim, slideAnim, navigation]);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <LottieView
          source={require('../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
        />

        <Text allowFontScaling style={styles.title}>
          Booking Confirmed!
        </Text>

        <Text allowFontScaling style={styles.subtitle}>
          Your time slot has been successfully reserved.
        </Text>

        {/* Highlighted Details Block */}
        <View style={styles.detailsContainer}>
          <Text allowFontScaling style={styles.detailsText}>
            📅 &nbsp; {formattedDate}
          </Text>
          <Text allowFontScaling style={styles.detailsText}>
            🕒 &nbsp; {time}
          </Text>
        </View>

        <Text allowFontScaling style={styles.infoText}>
          You can find the meeting link and manage your booking in your History.
        </Text>
      </Animated.View>

      {/* Button is now absolutely positioned relative to the safe area */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
          style={styles.button}>
          <Text allowFontScaling style={styles.buttonText}>
            View Booking History
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Merged and updated styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
    // justifyContent: 'center',
  },
  card: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  lottie: {
    width: 200,
    height: 200,
    marginBottom: -20,
  },
  title: {
    fontSize: responsiveFontSize(2.8),
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D4EAD5',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  infoText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 10, // Platform-specific positioning
    left: 15,
    right: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: responsiveHeight(7), // Using responsiveHeight
    borderRadius: 18, // Using new borderRadius
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
  },
});

export default Confirmation;
