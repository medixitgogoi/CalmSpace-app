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
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { addUser } from '../redux/UserSlice';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { showMessage } from 'react-native-flash-message';

const showNotification = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    showMessage({
      message: message,
      type: 'danger', // Can be "success", "warning", "danger", "info", or "default"
      icon: 'auto', // Or "none", or a custom icon component
    });
  }
};

const Login = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  // console.log('userDetails from login: ', userDetails);

  // const { connectSocket } = useSocket(); // pull in connectSocket

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
    // Ensure all fields are filled
    if (!email || !password) {
      showNotification('Missing Information. All fields are required');
      return;
    }

    try {
      setLoading(true);

      // Data object as per the API requirement
      const submitData = {
        email: email,
        password: password,
      };

      // API Call using axios
      const response = await axios.post(`/auth/login`, submitData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('login response: ', response);

      // Handle success response
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
        // --- Implemented Error Handling Logic ---
        const message = response?.data?.message || 'An unexpected error occurred.';

        switch (response?.data?.status_code) {
          case 401:
            // Unauthorized: Wrong password, invalid token, etc.
            showNotification('Authentication failed. Please check your credentials.', 'danger');
            break;

          case 404:
            // Not Found: The requested resource (e.g., user) doesn't exist.
            showNotification('User not found. Please check your details or sign up.', 'danger');
            break;

          case 405:
            // Method Not Allowed: A developer-facing error.
            // Show a generic message to the user.
            showNotification('An unexpected error occurred. Please try again later.', 'danger');
            // Log a specific error for debugging.
            console.error('API Error: Method Not Allowed. Check server endpoint configuration.');
            break;

          case 500:
            // Internal Server Error: A problem on the server.
            showNotification('A server error occurred. We are working on it, please try again later.', 'danger');
            break;

          default:
            // Fallback for any other non-200 status codes.
            showNotification(message, 'danger');
            break;
        }
      }
    } catch (error) {
      console.log('error: ', error);

      ToastAndroid.showWithGravity(
        'Something went wrong.\nPlease check your network connection and try again.',
        ToastAndroid.LONG,
        ToastAndroid.TOP,
      );
    } finally {
      // setEmail('');
      // setPassword('');

      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#E0F7FA' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#E0F7FA',
          }}>
          {/* Background and Top Design */}
          <View
            style={{
              height: '50%',
              width: '100%',
              transition: 'height 0.3s ease-in-out',
            }}>
            <Image
              source={require('../assets/background.png')}
              style={{ position: 'absolute', height: '170%', width: '100%' }}
            />

            {/* Lights */}
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
                  fontSize: responsiveFontSize(1.8),
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

          {/* Login Form with ScrollView */}
          <ScrollView
            style={{ width: '100%', height: '45%' }}
            contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: responsiveFontSize(2.8),
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
                height: responsiveHeight(Platform.OS === 'ios' ? 6.2 : 7),
                fontFamily: 'Poppins-SemiBold',
                backgroundColor: '#fff',
                borderColor: '#1f8dba',
                borderWidth: 1.5,
                fontWeight: '600',
                fontSize: responsiveFontSize(1.8),
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
                height: responsiveHeight(Platform.OS === 'ios' ? 6.2 : 7),
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
                  fontSize: responsiveFontSize(1.8),
                  width: '100%',
                }}
              />

              <View style={{ position: 'absolute', right: 5, top: 14 }}>
                <Feather
                  name={show ? 'eye-off' : 'eye'}
                  onPress={() => setShow(!show)}
                  style={{
                    color: '#000',
                    fontSize: responsiveFontSize(2),
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ marginBottom: 30, alignSelf: 'flex-end' }}>
              <Text
                style={{
                  fontSize: responsiveFontSize(1.5),
                  color: '#1f8dba',
                  fontFamily: 'Poppins-Medium',
                  textDecorationLine: 'underline',
                }}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login */}
            <TouchableOpacity
              onPress={handleLoginSubmit}
              disabled={loading}
              style={{
                backgroundColor: '#1f8dba',
                height: responsiveHeight(7),
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
                    fontSize: responsiveFontSize(2.6),
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
                  fontSize: responsiveFontSize(1.5),
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
                    fontSize: responsiveFontSize(1.5),
                  }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default Login;