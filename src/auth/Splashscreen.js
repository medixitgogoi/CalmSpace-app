import { View, Animated, StatusBar, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

// It's a good practice to define styles using StyleSheet for performance and organization.
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
    width: 200, // Fixed width for better control
    height: 200, // Fixed height for better control
    resizeMode: 'contain',
  },
  text: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(3.5), // Slightly larger for impact
    color: '#5db7b7', // A calming, elegant teal
    marginTop: 0,
  },
  revealCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#86c9c9',
    position: 'absolute',
  },
});

const Splashscreen = () => {
  const navigation = useNavigation();
  const revealAnim = useRef(new Animated.Value(0)).current; // Single value to drive all animations

  useEffect(() => {
    // Animate the reveal value from 0 to 1 over 1.5 seconds
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: true,
    }).start();

    // Navigate after a delay
    const timer = setTimeout(() => {
      navigation.navigate('OnboardingScreen');
    }, 2500); // Adjusted timing slightly for a smoother transition

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigation, revealAnim]);

  // --- Animation Interpolations ---

  // Circle expands and then fades out
  const circleScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 15],
  });
  const circleOpacity = revealAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  // Content fades in and slides up gracefully from the bottom
  const contentOpacity = revealAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // MODIFICATION: Changed the output range to make the text appear from the bottom.
  const contentTranslateY = revealAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [100, 100, 0], // Start from a lower position (100) and move to 0
  });


  return (
    <LinearGradient colors={['#F0FFF0', '#FFFFFF']} style={styles.container}>
      <StatusBar hidden={true} />

      <Animated.View
        style={[
          styles.revealCircle,
          {
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

export default Splashscreen;