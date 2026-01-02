import LottieView from 'lottie-react-native';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  ToastAndroid,
  Dimensions, // Import Dimensions
} from 'react-native';
import { useEffect, useState } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../utils/colors';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { addUser } from '../redux/UserSlice';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { showMessage } from 'react-native-flash-message';

// --- TABLET DETECTION ---
const { width } = Dimensions.get('window');
const isTablet = width > 768;

const showNotification = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    showMessage({
      message: message,
      type: 'danger',
      icon: 'auto',
    });
  }
};

const Login = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [show, setShow] = useState(true);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardShow = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardHide = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      showNotification('Missing Information. All fields are required');
      return;
    }

    try {
      setLoading(true);
      const submitData = { email: email, password: password };

      const response = await axios.post(`/auth/login`, submitData, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response?.data?.status_code === 200) {
        if (response?.data?.role === 'user') {
          const userInfo = {
            _id: response?.data?.user,
            authToken: response?.data?.authToken,
            profileStatus: response?.data?.profileStatus,
          };
          dispatch(addUser(userInfo));
          await AsyncStorage.setItem('userDetails', JSON.stringify(userInfo));

          if (response?.data?.profileStatus) {
            navigation.navigate('Home');
          } else {
            navigation.navigate('Welcome');
          }
        } else {
          const userInfo = {
            _id: response?.data?.user,
            authToken: response?.data?.authToken,
            role: 'counselor',
          };
          dispatch(addUser(userInfo));
          await AsyncStorage.setItem('userDetails', JSON.stringify(userInfo));
          navigation.navigate('Dashboard');
        }
      } else {
        const message = response?.data?.message || 'An unexpected error occurred.';
        showNotification(message); // Simplified for brevity
      }
    } catch (error) {
      console.log('error: ', error);
      ToastAndroid.showWithGravity(
        'Something went wrong.\nPlease check your network connection and try again.',
        ToastAndroid.LONG,
        ToastAndroid.TOP,
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RESPONSIVE STYLE CONSTANTS ---
  // Fix the height for tablets so inputs don't look like huge boxes
  const inputHeight = isTablet ? 60 : responsiveHeight(Platform.OS === 'ios' ? 6.2 : 7);
  // Restrict width on tablets to 60% of screen
  const formWidth = isTablet ? '60%' : '100%';
  const titleSize = isTablet ? responsiveFontSize(2.2) : responsiveFontSize(2.8);
  const standardFontSize = isTablet ? responsiveFontSize(1.3) : responsiveFontSize(1.8);

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#E0F7FA' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View
          style={{
            flex: 1,
            alignItems: 'center', // Important for centering the tablet form
            backgroundColor: '#E0F7FA',
          }}>

          {/* --- TOP SECTION: BACKGROUND & LIGHTS (KEPT AS IS) --- */}
          <View
            style={{
              height: '50%',
              width: '100%',
              // Note: 'transition' is not a valid React Native style property, but left here as requested
            }}>
            <Image
              source={require('../assets/background.png')}
              style={{ position: 'absolute', height: '170%', width: '100%' }}
            />

            {/* Lights */}
            {!isTablet && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  position: 'absolute',
                  top: 0,
                  paddingHorizontal: 20,
                }}>
                <Image
                  source={require('../assets/light.png')}
                  style={{
                    height: isKeyboardVisible
                      ? responsiveHeight(20)
                      : responsiveHeight(33),
                    width: 140,
                  }}
                  resizeMode="contain"
                />
                <Image
                  source={require('../assets/light.png')}
                  style={{
                    height: isKeyboardVisible
                      ? responsiveHeight(10)
                      : responsiveHeight(17),
                    width: 100,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}


            <View
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: '#1f8dba',
                  fontWeight: '500',
                  fontSize: standardFontSize,
                  fontFamily: 'Poppins-Medium',
                  textAlign: 'center',
                }}>
                Start your journey to well-being today
              </Text>

              <View style={{ width: 35, height: 35 }}>
                <LottieView
                  source={require('../assets/animations/login.json')}
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </View>
          </View>

          {/* --- BOTTOM SECTION: LOGIN FORM (UPDATED FOR IPAD) --- */}
          <ScrollView
            style={{ width: '100%', height: '45%' }}
            contentContainerStyle={{
              paddingHorizontal: 30,
              paddingBottom: 20,
              alignItems: 'center' // Centers the inner form container
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* New Wrapper to control width on Tablets */}
            <View style={{ width: formWidth }}>

              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: titleSize,
                  textAlign: 'center',
                  marginVertical: 30,
                  color: '#000',
                  textTransform: 'uppercase',
                }}>
                Login
              </Text>

              {/* Email */}
              <TextInput
                placeholder="Email"
                value={email}
                placeholderTextColor={'grey'}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={primary}
                style={{
                  height: inputHeight,
                  fontFamily: 'Poppins-SemiBold',
                  backgroundColor: '#fff',
                  borderColor: '#1f8dba',
                  borderWidth: 1.5,
                  fontWeight: '600',
                  fontSize: standardFontSize,
                  borderRadius: 13,
                  paddingHorizontal: 18,
                  marginBottom: 20,
                  color: '#000',
                }}
              />

              {/* Password */}
              <View
                style={{
                  flexDirection: 'row',
                  height: inputHeight,
                  borderRadius: 13,
                  alignItems: 'center',
                  borderColor: '#1f8dba',
                  borderWidth: 1.5,
                  backgroundColor: '#fff',
                  paddingHorizontal: 18,
                  marginBottom: 10,
                }}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  secureTextEntry={show}
                  onChangeText={setPassword}
                  keyboardType="default"
                  selectionColor={primary}
                  placeholderTextColor={'grey'}
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontWeight: '600',
                    color: '#000',
                    fontSize: standardFontSize,
                    flex: 1, // Use flex 1 to fill remaining space
                    height: '100%' // Ensure it takes full height of container
                  }}
                />

                <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 5 }}>
                  <Feather
                    name={show ? 'eye-off' : 'eye'}
                    style={{
                      color: '#000',
                      fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2),
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={{ marginBottom: 30, alignSelf: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.5),
                    color: '#1f8dba',
                    fontFamily: 'Poppins-Medium',
                    textDecorationLine: 'underline',
                  }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLoginSubmit}
                disabled={loading}
                style={{
                  backgroundColor: '#1f8dba',
                  height: inputHeight,
                  borderRadius: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {loading ? (
                  <ActivityIndicator size="large" color={'#fff'} />
                ) : (
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: isTablet ? responsiveFontSize(1.8) : responsiveFontSize(2.6),
                      fontWeight: '600',
                      fontFamily: 'Poppins-Bold',
                    }}>
                    Login
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign up / Don't have an account */}
              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: 4,
                }}>
                <Text
                  style={{
                    color: '#bdbdbd',
                    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.5),
                    fontWeight: '500',
                    fontFamily: 'Poppins-Medium',
                  }}>
                  Don't have an account?
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('SignUp')}
                  disabled={loading}>
                  <Text
                    style={{
                      color: '#1f8dba',
                      fontWeight: '600',
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.5),
                    }}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default Login;