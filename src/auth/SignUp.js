import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ToastAndroid,
  Linking, // Import Linking
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../utils/colors';
import { showMessage } from 'react-native-flash-message';

const showNotification = (message, type = 'default') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    showMessage({
      message: message,
      type: type, // Can be "success", "warning", "danger", "info", or "default"
      icon: 'auto', // Or "none", or a custom icon component
    });
  }
};

/**
 * Validates the strength of a password.
 * @param {string} password - The password to validate.
 * @returns {{isValid: boolean, message: string}} - An object with validation status and a message.
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }

  return { isValid: true, message: '' };
};


const SignUp = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('Personal');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false); // New state for checkbox
  const [show, setShow] = useState(true);
  const [passwordError, setPasswordError] = useState(''); // State for password validation error

  const options = ['Personal', 'Employee'];

  const handleSelect = option => {
    setSelectedAccount(option);
    setDropdownVisible(false);
  };

  // sign up function
  const handleSignUp = async () => {
    // 1. Ensure all fields are filled
    if (!email || !password) {
      showNotification('Missing Information. All fields are required', 'danger');
      return;
    }

    // 2. Check if the terms and conditions are agreed upon
    if (!agreeToTerms) {
      showNotification('Please agree to the Terms and Conditions and Privacy Policy', 'danger');
      return;
    }

    // 3. --- Updated: Validate Password Strength ---
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message); // Set error message to state
      return; // Stop the submission
    } else {
      setPasswordError(''); // Clear error if password is valid
    }


    try {
      setLoading(true);

      const data = {
        email: email,
        password: password,
        role: selectedAccount === 'Personal' ? 'user' : 'counselor',
      };

      const response = await axios.post('/auth/register', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Sign Up: ', response);

      if (response?.data?.status_code === 201) {
        showNotification(response?.data?.message, 'success');

        navigation.navigate('Login');
      } else if (response?.data?.status_code === 402) {
        // This is treated as a general failure or payment-related error.
        showNotification(`Error signing up: ${response?.data?.message || 'An unexpected error occurred.'}`, 'danger');

      } else if (response?.data?.status_code === 409) {
        // A 409 Conflict status typically means the user (e.g., email) already exists.
        // We use the 'info' type to guide them to the login screen without an alarming red banner.
        showNotification(`${response?.data?.message || 'This account already exists.'} Please log in.`, 'info');
        navigation.navigate('Login')
      }
    } catch (error) {
      ToastAndroid.showWithGravity(
        'Registration failed\nPlease check your network connection and try again.',
        ToastAndroid.LONG,
        ToastAndroid.TOP,
      );

      console.log('sign up error: ', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E0F7FA' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Handles different keyboard behavior for iOS and Android
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F7FA',
        }}>
        {/* Image */}
        <View style={{ height: responsiveHeight(20), width: '100%' }}>
          <Image
            source={require('../assets/background.png')}
            style={{ position: 'absolute', height: '190%', width: '100%' }}
          />
        </View>

        {/* Logo */}
        <View
          style={{
            backgroundColor: 'red',
            width: '100%',
            top: -responsiveHeight(14),
            left: 30,
          }}>
          <Image
            source={require('../assets/logoback.png')}
            style={{ position: 'absolute', height: 50, width: 50, top: 0 }}
          />
        </View>

        {/* Sign up Form */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 30,
            paddingBottom: 50,
            alignItems: 'center', // Ensures full-width alignment
          }}
          keyboardShouldPersistTaps="handled" // Allows closing the keyboard by tapping outside
          style={{ width: '100%' }} // Ensures the ScrollView itself takes full width
        >
          {/* Lottie Animation */}
          <View
            style={{
              width: 230,
              height: 230,
              alignSelf: 'center',
              marginBottom: 20,
            }}>
            <LottieView
              source={require('../assets/animations/signup.json')}
              autoPlay
              loop
              style={{
                height: '100%',
                alignSelf: 'center',
                marginBottom: 20,
                width: '100%',
              }}
            />
          </View>

          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: responsiveFontSize(2.5),
              textAlign: 'center',
              marginBottom: 30,
              color: '#000',
              textTransform: 'uppercase',
            }}>
            Sign up
          </Text>

          {/* Email */}
          <TextInput
            placeholder="Email"
            value={email}
            placeholderTextColor={'grey'}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none" // 👈 Add this line
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
              width: '100%',
              color: '#000',
            }}
          />

          {/* Password */}
          <View
            style={[{
              flexDirection: 'row',
              height: responsiveHeight(Platform.OS === 'ios' ? 6.2 : 7),
              borderRadius: 13,
              alignItems: 'center',
              borderWidth: 1.5,
              backgroundColor: '#fff',
              paddingHorizontal: 18,
            },
            { borderColor: passwordError ? 'red' : '#1f8dba' } // Conditional border color
            ]}>
            <TextInput
              placeholder="Password"
              value={password}
              secureTextEntry={show}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) {
                  setPasswordError(''); // Clear error when user starts typing
                }
              }}
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

          {/* Display Password Error Message */}
          {passwordError ? (
            <Text style={{
              color: 'red',
              fontSize: responsiveFontSize(1.6),
              fontFamily: 'Poppins-Medium',
              alignSelf: 'flex-start',
              marginTop: 5,
              marginBottom: 10,
            }}>
              {passwordError}
            </Text>
          ) : <View style={{ marginBottom: 10 }} />}

          {/* Role Selection */}
          <View
            style={{
              backgroundColor: '#fff',
              borderColor: '#1f8dba',
              borderWidth: 1.5,
              width: '100%',
              borderRadius: 16,
              padding: 18,
              marginBottom: 20,
            }}>
            <Text
              style={{
                color: 'grey',
                fontFamily: 'Poppins-SemiBold',
                fontSize: 15,
                marginBottom: 10,
              }}>
              Select Account
            </Text>

            {/* Dropdown Button */}
            <TouchableOpacity
              onPress={() => setDropdownVisible(!dropdownVisible)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f7fcfe',
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 10,
                borderColor: '#1f8dba',
                borderWidth: 0.5,
              }}>
              <Text
                style={{
                  color: primary,
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: responsiveFontSize(1.8),
                }}>
                {selectedAccount}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#555" />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {dropdownVisible && (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  overflow: 'hidden',
                  elevation: 2,
                }}>
                {options.map(option => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleSelect(option)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                    }}>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(1.9),
                        color: '#333',
                        fontFamily: 'Poppins-Medium',
                      }}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Checkbox for Terms and Conditions */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              width: '100%',
              paddingHorizontal: 5,
            }}>
            <TouchableOpacity
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              style={{ marginRight: 10 }}>
              <Icon
                name={agreeToTerms ? 'check-box' : 'check-box-outline-blank'}
                size={23}
                color={agreeToTerms ? primary : '#666'}
              />
            </TouchableOpacity>
            <Text
              style={{
                color: '#555',
                fontSize: responsiveFontSize(1.7),
                fontFamily: 'Poppins-Medium',
                flexShrink: 1,
              }}>
              By signing up you agree to our{' '}
              <Text
                style={{ color: '#1f8dba', fontFamily: 'Poppins-Bold' }}
                onPress={() => Linking.openURL('https://thecalmspace.in/footer/t&c')}>
                Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: '#1f8dba', fontFamily: 'Poppins-Bold' }}
                onPress={() => Linking.openURL('https://thecalmspace.in/footer/privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          {/* Sign up */}
          <TouchableOpacity
            onPress={handleSignUp}
            style={{
              backgroundColor: '#1f8dba',
              height: responsiveHeight(7),
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%'
            }}>
            {loading ? (
              <ActivityIndicator size="large" color={'#fff'} />
            ) : (
              <Text
                style={{
                  color: '#fff',
                  fontSize: responsiveFontSize(2.3),
                  fontWeight: '600',
                  fontFamily: 'Poppins-Bold',
                }}>
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Already have an account / login */}
          <TouchableOpacity
            style={{
              marginTop: 10,
              alignItems: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'flex-end',
            }}>
            <Text
              style={{
                color: '#bdbdbd',
                fontSize: responsiveFontSize(1.6),
                fontWeight: '500',
                fontFamily: 'Poppins-Medium',
              }}>
              Already have an account?
            </Text>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text
                style={{
                  color: '#1f8dba',
                  fontWeight: '600',
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: responsiveFontSize(1.6),
                }}>
                Log In
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;