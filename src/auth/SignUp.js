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
  Linking,
  Modal as RNModal, // Using RN Modal for EULA
  StyleSheet,
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

// --- Helpers remain the same ---
const showNotification = (message, type = 'default') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    showMessage({ message, type, icon: 'auto' });
  }
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (password.length < minLength) return { isValid: false, message: 'Password must be at least 8 characters long.' };
  if (!hasUpperCase) return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  if (!hasLowerCase) return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  if (!hasNumber) return { isValid: false, message: 'Password must contain at least one number.' };
  if (!hasSpecialChar) return { isValid: false, message: 'Password must contain at least one special character.' };
  return { isValid: true, message: '' };
};

const SignUp = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('Personal');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [show, setShow] = useState(true);
  const [passwordError, setPasswordError] = useState('');

  // EULA Modal State
  const [eulaVisible, setEulaVisible] = useState(false);

  const options = ['Personal', 'Employee'];

  const handleSelect = option => {
    setSelectedAccount(option);
    setDropdownVisible(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      showNotification('Missing Information. All fields are required', 'danger');
      return;
    }

    if (!agreeToTerms) {
      showNotification('You must accept the EULA and Privacy Policy to continue', 'danger');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
      return;
    }

    try {
      setLoading(true);
      const data = {
        email: email,
        password: password,
        role: selectedAccount === 'Personal' ? 'user' : 'counselor',
      };
      const response = await axios.post('/auth/register', data, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response?.data?.status_code === 201) {
        showNotification(response?.data?.message, 'success');
        navigation.navigate('Login');
      } else if (response?.data?.status_code === 409) {
        showNotification(`${response?.data?.message || 'Account exists.'} Please log in.`, 'info');
        navigation.navigate('Login');
      }
    } catch (error) {
      showNotification('Registration failed. Check your connection.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E0F7FA' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* EULA MODAL - CRITICAL FOR APP STORE COMPLIANCE */}
      <RNModal
        visible={eulaVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.eulaContainer}>
            <Text style={styles.eulaTitle}>End User License Agreement (EULA)</Text>
            <ScrollView style={styles.eulaScroll}>
              <Text style={styles.eulaText}>
                Last Updated: June 2026{"\n\n"}
                By using Calmspace, you agree to the following terms:{"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>1. Objectionable Content Policy: </Text>
                Calmspace maintains a zero-tolerance policy regarding objectionable content. You may not post content that is:
                - Sexually Explicit or Obscene{"\n"}
                - Harassing, Threatening, or Abusive{"\n"}
                - Hate Speech or Discriminatory{"\n"}
                - Encouraging Illegal Activity{"\n\n"}

                <Text style={{ fontWeight: 'bold' }}>2. Moderation: </Text>
                We reserve the right to review, flag, and remove any user-generated content that violates these terms.{"\n\n"}

                <Text style={{ fontWeight: 'bold' }}>3. User Termination: </Text>
                Abusive users who violate these standards will be permanently banned from the platform. Users can report any violations via the "Report" feature located on every post/chat.{"\n\n"}

                <Text style={{ fontWeight: 'bold' }}>4. Privacy: </Text>
                Your data is handled according to our Privacy Policy.
              </Text>
            </ScrollView>
            <View style={styles.eulaActions}>
              <TouchableOpacity
                style={[styles.eulaBtn, { backgroundColor: '#ccc' }]}
                onPress={() => { setEulaVisible(false); setAgreeToTerms(false); }}
              >
                <Text style={styles.btnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.eulaBtn, { backgroundColor: primary }]}
                onPress={() => { setEulaVisible(false); setAgreeToTerms(true); }}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>

      <View style={{ flex: 1, backgroundColor: '#E0F7FA' }}>
        <View style={{ height: responsiveHeight(20), width: '100%' }}>
          <Image source={require('../assets/background.png')} style={{ position: 'absolute', height: '190%', width: '100%' }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 50, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 200, height: 200, marginBottom: 10 }}>
            <LottieView source={require('../assets/animations/signup.json')} autoPlay loop style={{ height: '100%', width: '100%' }} />
          </View>

          <Text style={styles.screenTitle}>Sign up</Text>

          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            placeholderTextColor={'grey'}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.inputStyle}
          />

          <View style={[styles.inputStyle, { flexDirection: 'row', alignItems: 'center', borderColor: passwordError ? 'red' : '#1f8dba' }]}>
            <TextInput
              placeholder="Password"
              value={password}
              placeholderTextColor={'grey'}
              secureTextEntry={show}
              onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
              style={{ flex: 1, color: '#000', fontFamily: 'Poppins-SemiBold' }}
            />
            <Feather name={show ? 'eye-off' : 'eye'} onPress={() => setShow(!show)} size={20} color="#000" />
          </View>

          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : <View style={{ height: 20 }} />}

          {/* Account Picker logic omitted for brevity, same as your code */}

          {/* CHECKBOX WITH EULA TRIGGER */}
          <View style={styles.checkboxRow}>
            <TouchableOpacity onPress={() => setEulaVisible(true)}>
              <Icon
                name={agreeToTerms ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={agreeToTerms ? primary : '#666'}
              />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I have read and agree to the{' '}
              <Text style={styles.linkText} onPress={() => setEulaVisible(true)}>EULA</Text>,{' '}
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://thecalmspace.in/footer/t&c')}>Terms</Text> &{' '}
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://thecalmspace.in/footer/privacy')}>Privacy Policy</Text>.
            </Text>
          </View>

          <TouchableOpacity onPress={handleSignUp} style={styles.submitBtn}>
            {loading ? <ActivityIndicator size="large" color={'#fff'} /> : <Text style={styles.submitBtnText}>Sign Up</Text>}
          </TouchableOpacity>

          {/* Login Link logic omitted */}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  eulaContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  eulaTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, marginBottom: 15, color: '#000', textAlign: 'center' },
  eulaScroll: { marginBottom: 20 },
  eulaText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#444', lineHeight: 20 },
  eulaActions: { flexDirection: 'row', justifyContent: 'space-between' },
  eulaBtn: { flex: 0.45, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins-Bold' },
  screenTitle: { fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.5), textAlign: 'center', marginBottom: 20, color: '#000' },
  inputStyle: { height: responsiveHeight(7), fontFamily: 'Poppins-SemiBold', backgroundColor: '#fff', borderColor: '#1f8dba', borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 18, marginBottom: 15, width: '100%', color: '#000' },
  errorText: { color: 'red', fontSize: 12, alignSelf: 'flex-start', marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
  termsText: { color: '#555', fontSize: 12, fontFamily: 'Poppins-Medium', flexShrink: 1, marginLeft: 10 },
  linkText: { color: primary, fontFamily: 'Poppins-Bold', textDecorationLine: 'underline' },
  submitBtn: { backgroundColor: '#1f8dba', height: responsiveHeight(7), borderRadius: 15, justifyContent: 'center', alignItems: 'center', width: '100%' },
  submitBtnText: { color: '#fff', fontSize: 20, fontFamily: 'Poppins-Bold' }
});

export default SignUp;