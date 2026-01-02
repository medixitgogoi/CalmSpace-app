import { View, Animated, StatusBar, StyleSheet, Dimensions, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight
} from 'react-native-responsive-dimensions';

// Get screen dimensions to calculate animation scales dynamically
const { width, height } = Dimensions.get('window');
const isTablet = width > 768; // Simple tablet detection

const Splashscreen = () => {
  const navigation = useNavigation();
  const revealAnim = useRef(new Animated.Value(0)).current;

  // Calculate the scale needed for the circle to cover the screen
  // We double the screen height to be safe, ensuring the circle covers everything even diagonally
  const circleStartSize = 100;
  const maxScale = (height / circleStartSize) * 2.5;

  useEffect(() => {
    // Animate the reveal value
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.navigate('OnboardingScreen');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, revealAnim]);

  // --- Animation Interpolations ---

  const circleScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, maxScale], // Uses dynamic scale calculation
  });

  const circleOpacity = revealAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const contentOpacity = revealAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Slide up distance: larger distance for taller screens (tablets)
  const slideDistance = isTablet ? 150 : 100;

  const contentTranslateY = revealAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [slideDistance, slideDistance, 0],
  });

  return (
    <LinearGradient colors={['#F0FFF0', '#FFFFFF']} style={styles.container}>
      <StatusBar hidden={true} />

      <Animated.View
        style={[
          styles.revealCircle,
          {
            width: circleStartSize,
            height: circleStartSize,
            borderRadius: circleStartSize / 2,
            transform: [{ scale: circleScale }],
            opacity: circleOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}>
        <Animated.Image
          source={require('../assets/no_back_logo_color.png')}
          style={styles.logo}
        />
        <Animated.Text style={styles.text}>Calmspace</Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Responsive width: 50% of screen for phones, 35% for tablets
    width: isTablet ? responsiveWidth(30) : responsiveWidth(50),
    height: isTablet ? responsiveWidth(30) : responsiveWidth(50),
    resizeMode: 'contain',
  },
  text: {
    fontFamily: 'Poppins-Bold',
    // Slightly larger font for tablets to match the larger screen real estate
    fontSize: isTablet ? responsiveFontSize(3.5) : responsiveFontSize(3.5),
    color: '#5db7b7',
    marginTop: responsiveHeight(1), // Responsive margin
  },
  revealCircle: {
    backgroundColor: '#86c9c9',
    position: 'absolute',
  },
});

export default Splashscreen;