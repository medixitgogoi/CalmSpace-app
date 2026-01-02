import {
  View,
  Text,
  BackHandler,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions, // Import useWindowDimensions
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { background } from '../utils/colors';

const COLORS = {
  background: '#F8F9FA',
  primary: '#28A745',
  primaryMuted: '#E9F5E9',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

const Confirmation = ({ route }) => {
  const { selectedSlot: time, scheduleAt: date } = route.params;
  const navigation = useNavigation();

  // --- 1. Tablet Detection ---
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );

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
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.card,
            // --- 2. Tablet Width Constraint ---
            isTablet && styles.cardTablet,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <LottieView
            source={require('../assets/animations/success.json')}
            autoPlay
            loop={false}
            // --- 3. Scale Animation for Tablet ---
            style={[styles.lottie, isTablet && { width: 300, height: 300 }]}
          />

          <Text allowFontScaling style={[styles.title, isTablet && styles.textTabletLarge]}>
            Booking Confirmed!
          </Text>

          <Text allowFontScaling style={[styles.subtitle, isTablet && styles.textTabletMedium]}>
            Your time slot has been successfully reserved.
          </Text>

          {/* Highlighted Details Block */}
          <View style={styles.detailsContainer}>
            <Text allowFontScaling style={[styles.detailsText, isTablet && styles.textTabletMedium]}>
              📅 &nbsp; {formattedDate}
            </Text>
            <Text allowFontScaling style={[styles.detailsText, isTablet && styles.textTabletMedium]}>
              🕒 &nbsp; {time}
            </Text>
          </View>

          <Text allowFontScaling style={[styles.infoText, isTablet && styles.textTabletSmall]}>
            You can find the meeting link and manage your booking in your History.
          </Text>
        </Animated.View>
      </View>

      {/* Button Container */}
      <View style={[styles.buttonContainer, isTablet && styles.buttonContainerTablet]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
          style={[styles.button, isTablet && styles.buttonTablet]}>
          <Text allowFontScaling style={[styles.buttonText, isTablet && styles.textTabletMedium]}>
            View Booking History
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Vertically center the card
    alignItems: 'center', // Horizontally center the card
  },
  card: {
    width: '90%', // Default for phones
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    // Removed absolute marginHorizontal to allow flex centering
    backgroundColor: COLORS.white, // Ensure card has background if container doesn't
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTablet: {
    width: '60%', // Restrict width on tablets
    maxWidth: 600,
    padding: 40, // More breathing room
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
    textAlign: 'center',
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

  // --- Button Styles ---
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 20,
    left: 0,
    right: 0,
    alignItems: 'center', // Center the button horizontally
    paddingHorizontal: 15,
  },
  buttonContainerTablet: {
    bottom: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: responsiveHeight(7),
    width: '100%', // Full width inside padding on phones
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonTablet: {
    width: '50%', // Half width on tablets
    height: 60, // Fixed comfortable height
  },
  buttonText: {
    color: COLORS.white,
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
  },

  // --- Tablet Specific Typography Tweaks ---
  textTabletLarge: {
    fontSize: responsiveFontSize(1.8), // Relative scale is different on tablets
  },
  textTabletMedium: {
    fontSize: responsiveFontSize(1.3),
  },
  textTabletSmall: {
    fontSize: responsiveFontSize(1.1),
  },
});

export default Confirmation;