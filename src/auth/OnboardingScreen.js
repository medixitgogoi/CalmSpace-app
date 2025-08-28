import {useState} from 'react';
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import {responsiveFontSize} from 'react-native-responsive-dimensions';
import {primary} from '../utils/colors';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const OnboardingScreen = ({navigation}) => {
  const [backgroundColor, setBackgroundColor] = useState('#e1f6f6');

  const onDoneAndSkip = () => {
    navigation.navigate('Login');
  };

  // Background colors for each page
  const backgroundColors = ['#e1f6f6', '#fffbec', '#ffe2d9'];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex: 1, backgroundColor: backgroundColor}}>
        <StatusBar hidden />

        <View style={{flex: 1, backgroundColor: backgroundColor}}>
          <Onboarding
            containerStyles={{paddingHorizontal: 10}}
            DoneButtonComponent={({...props}) => (
              <TouchableOpacity
                {...props}
                style={{
                  backgroundColor: primary,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginRight: 12,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: responsiveFontSize(1.5),
                    fontFamily: 'Poppins-Medium',
                  }}>
                  Done ✓
                </Text>
              </TouchableOpacity>
            )}
            onDone={onDoneAndSkip}
            SkipButtonComponent={({...props}) => (
              <TouchableOpacity
                {...props}
                style={{
                  backgroundColor: 'transparent',
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  marginRight: 12,
                }}>
                <Text
                  style={{
                    color: '#232323',
                    fontSize: responsiveFontSize(1.7),
                    fontFamily: 'Poppins-Medium',
                  }}>
                  Skip
                </Text>
              </TouchableOpacity>
            )}
            NextButtonComponent={({...props}) => (
              <TouchableOpacity
                {...props}
                style={{
                  backgroundColor: '#232323',
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 20,
                  marginRight: 12,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: responsiveFontSize(1.7),
                    fontFamily: 'Poppins-Medium',
                  }}>
                  Next
                </Text>
              </TouchableOpacity>
            )}
            onSkip={onDoneAndSkip}
            bottomBarHighlight={false}
            bottomBarStyle={{paddingBottom: 30}}
            contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 30}}
            titleStyles={{
              fontFamily: 'Poppins-Bold',
              fontSize: responsiveFontSize(2.5),
              color: primary,
            }}
            subTitleStyles={{
              fontFamily: 'Poppins-Medium',
              fontSize: responsiveFontSize(1.8),
              color: '#9c9c9c',
            }}
            pageIndexCallback={pageIndex => {
              setBackgroundColor(backgroundColors[pageIndex]);
            }}
            pages={[
              {
                backgroundColor: '#e1f6f6',
                image: (
                  <View style={{width: width * 0.9, height: width}}>
                    <LottieView
                      source={require('../assets/animations/ani1.json')}
                      autoPlay
                      loop
                      style={{width: '100%', height: '100%'}}
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
                  <View style={{width: width * 0.9, height: width}}>
                    <LottieView
                      source={require('../assets/animations/ani2.json')}
                      autoPlay
                      loop
                      style={{width: '100%', height: '100%'}}
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
                  <View style={{width: width * 0.9, height: width}}>
                    <LottieView
                      source={require('../assets/animations/ani3.json')}
                      autoPlay
                      loop
                      style={{width: '100%', height: '100%'}}
                    />
                  </View>
                ),
                title: 'Navigate Life’s Crossroads',
                subtitle:
                  'Clarity comes with the right mindset. Let’s take the next step together.',
              },
            ]}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;
