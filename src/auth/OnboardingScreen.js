import { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { primary } from '../utils/colors';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768; // Simple check for iPad/Tablet width

const OnboardingScreen = ({ navigation }) => {
  const [backgroundColor, setBackgroundColor] = useState('#e1f6f6');

  const onDoneAndSkip = () => {
    navigation.navigate('Login');
  };

  const backgroundColors = ['#e1f6f6', '#fffbec', '#ffe2d9'];

  // Button Text Style Helper to prevent overflow
  const buttonTextStyle = {
    color: '#fff',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.6),
    fontFamily: 'Poppins-Medium',
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: backgroundColor }}
        edges={['top', 'bottom']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={backgroundColor}
          animated={true}
        />

        <Onboarding
          // Pass the background color state directly to the container if needed, 
          // but Onboarding handles page colors via the 'pages' prop.
          containerStyles={{
            paddingHorizontal: 15,
          }}
          // Important: Reserve space for the image so it doesn't get crushed
          imageContainerStyles={{
            paddingBottom: responsiveHeight(2),
            paddingTop: responsiveHeight(2),
          }}

          // --- DONE BUTTON ---
          DoneButtonComponent={({ ...props }) => (
            <TouchableOpacity
              {...props}
              style={{
                backgroundColor: primary,
                paddingHorizontal: 16, // Reduced from 20+
                paddingVertical: 10,
                borderRadius: 30,
                marginRight: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={buttonTextStyle}
                numberOfLines={1}
                adjustsFontSizeToFit={true}>
                Done ✓
              </Text>
            </TouchableOpacity>
          )}

          // --- SKIP BUTTON ---
          SkipButtonComponent={({ ...props }) => (
            <TouchableOpacity
              {...props}
              style={{
                backgroundColor: 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginLeft: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  ...buttonTextStyle,
                  color: '#232323',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit={true}>
                Skip
              </Text>
            </TouchableOpacity>
          )}

          // --- NEXT BUTTON ---
          NextButtonComponent={({ ...props }) => (
            <TouchableOpacity
              {...props}
              style={{
                backgroundColor: '#232323',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 30,
                marginRight: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={buttonTextStyle}
                numberOfLines={1}
                adjustsFontSizeToFit={true}>
                Next
              </Text>
            </TouchableOpacity>
          )}

          onDone={onDoneAndSkip}
          onSkip={onDoneAndSkip}
          bottomBarHighlight={false}

          // Adjust bottom bar height to prevent cutting off buttons
          bottomBarStyle={{
            height: isTablet ? 120 : 100,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            backgroundColor: 'transparent',
          }}

          titleStyles={{
            fontFamily: 'Poppins-Bold',
            fontSize: isTablet ? responsiveFontSize(2) : responsiveFontSize(2.8),
            color: primary,
            textAlign: 'center',
          }}
          subTitleStyles={{
            fontFamily: 'Poppins-Medium',
            fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(1.8),
            color: '#7a7a7a',
            textAlign: 'center',
            marginTop: 10,
          }}
          pageIndexCallback={pageIndex => {
            setBackgroundColor(backgroundColors[pageIndex]);
          }}
          pages={[
            {
              backgroundColor: '#e1f6f6',
              image: (
                <View style={{
                  width: width,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LottieView
                    source={require('../assets/animations/ani1.json')}
                    autoPlay
                    loop
                    // Explicit dimensions are crucial for Lottie
                    style={{
                      width: isTablet ? responsiveWidth(50) : responsiveWidth(80),
                      height: isTablet ? responsiveHeight(40) : responsiveWidth(80),
                    }}
                    resizeMode="contain"
                  />
                </View>
              ),
              title: 'Find Your Inner Peace',
              subtitle:
                'Take a deep breath and embrace mindfulness in your daily life.',
            },
            {
              backgroundColor: '#fffbec',
              image: (
                <View style={{
                  width: width,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LottieView
                    source={require('../assets/animations/ani2.json')}
                    autoPlay
                    loop
                    style={{
                      width: isTablet ? responsiveWidth(50) : responsiveWidth(80),
                      height: isTablet ? responsiveHeight(40) : responsiveWidth(80),
                    }}
                    resizeMode="contain"
                  />
                </View>
              ),
              title: 'Experience Calm & Joy',
              subtitle:
                'Prioritize self-care and cultivate a sense of well-being.',
            },
            {
              backgroundColor: '#ffe2d9',
              image: (
                <View style={{
                  width: width,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LottieView
                    source={require('../assets/animations/ani3.json')}
                    autoPlay
                    loop
                    style={{
                      width: isTablet ? responsiveWidth(50) : responsiveWidth(80),
                      height: isTablet ? responsiveHeight(40) : responsiveWidth(80),
                    }}
                    resizeMode="contain"
                  />
                </View>
              ),
              title: 'Navigate Life’s Crossroads',
              subtitle:
                'Clarity comes with the right mindset. Let’s take the next step together.',
            },
          ]}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;