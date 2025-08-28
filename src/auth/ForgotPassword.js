import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ActivityIndicator,
    StyleSheet,
    Platform,
    ToastAndroid,
    Alert,
    Keyboard,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';

// --- Reusable & Memoized Components for Performance & Cleanliness ---

const FormInput = memo(({ icon, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, children }) => (
    <View style={styles.inputContainer}>
        <Ionicons name={icon} size={22} color="#78909C" style={styles.inputIcon} />
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            placeholderTextColor="#90A4AE"
            style={styles.input}
            selectionColor="#00ACC1"
        />
        {children}
    </View>
));

const SubmitButton = memo(({ onPress, loading, title }) => (
    <TouchableOpacity onPress={onPress} disabled={loading} style={styles.submitButton}>
        {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
            <Text style={styles.submitButtonText}>{title}</Text>
        )}
    </TouchableOpacity>
));

const OtpInput = memo(({ otp, setOtp, inputsRef }) => {
    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = ({ nativeEvent: { key } }, index) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.otpContainer}>
            {[...Array(6)].map((_, index) => (
                <TextInput
                    key={index}
                    ref={ref => (inputsRef.current[index] = ref)}
                    value={otp[index] || ''}
                    onChangeText={text => handleOtpChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    style={styles.otpInput}
                />
            ))}
        </View>
    );
});

const ProgressIndicator = memo(({ currentStep }) => (
    <View style={styles.progressContainer}>
        {[1, 2, 3].map(step => (
            <React.Fragment key={step}>
                <View style={[styles.progressStep, currentStep >= step && styles.progressStepActive]}>
                    <Text style={[styles.progressText, currentStep >= step && styles.progressTextActive]}>{step}</Text>
                </View>
                {step < 3 && <View style={[styles.progressLine, currentStep > step && styles.progressLineActive]} />}
            </React.Fragment>
        ))}
    </View>
));

// --- Main Forgot Password Screen ---

const ForgotPassword = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [tempToken, setTempToken] = useState(null);

    const otpInputsRef = useRef([]);

    // Cross-platform notification utility
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

    // Timer logic
    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const startOtpTimer = () => {
        setTimer(30);
        setCanResend(false);
    };

    // --- API Handlers with Original Axios Calls ---
    const handleSendOtp = useCallback(async () => {
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            showNotification('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await axios.post('/auth/send-otp', { email });

            // console.log('forgot pasword response: ', response);

            if (response.data.status_code === 201) {
                showNotification('Success', response.data.message);
                setStep(2);
                startOtpTimer();
            } else {
                showNotification(response.data.message || 'Failed to send OTP.');
            }
        } catch (error) {
            showNotification(error?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    }, [email]);

    const handleResendOtp = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            const response = await axios.post('/auth/send-otp', { email });
            if (response.data.status_code === 201) {
                showNotification('OTP Resent', 'A new OTP has been sent to your email.');
                startOtpTimer();
                setOtp(['', '', '', '', '', '']);
            } else {
                showNotification(response.data.message || 'Failed to resend OTP.');
            }
        } catch (error) {
            showNotification(error?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    }

    const handleVerifyOtp = useCallback(async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            showNotification('Invalid OTP', 'Please enter the complete 6-digit OTP.');
            return;
        }
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await axios.post('/auth/verify-otp', { email, otp: otpCode });

            if (response.data.status_code === 201) {
                showNotification('Success', response.data.message);
                setTempToken(response.data.tempToken);
                setStep(3);
            } else {
                showNotification(response.data.message || 'The OTP entered is incorrect.');
            }
        } catch (error) {
            showNotification(error?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    }, [otp, email]);

    const handleChangePassword = useCallback(async () => {
        if (password.length < 6) {
            showNotification('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            showNotification('Passwords Mismatch', 'The entered passwords do not match.');
            return;
        }
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await axios.post(
                "/auth/reset-password",
                { resetpassword: password },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: tempToken,
                    },
                }
            );

            if (response.data.status_code === 201) {
                showNotification('Success', response.data.message);
                navigation.navigate('Login');
            } else {
                showNotification(response.data.message || 'Failed to reset password.');
            }
        } catch (error) {
            showNotification(error?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    }, [password, confirmPassword, tempToken, navigation]);

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>
                        <FormInput icon="mail-outline" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                        <SubmitButton onPress={handleSendOtp} loading={loading} title="Send Code" />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>A 6-digit code has been sent to <Text style={{ fontFamily: 'Poppins-Bold' }}>{email}</Text>.</Text>
                        <OtpInput otp={otp} setOtp={setOtp} inputsRef={otpInputsRef} />
                        <View style={styles.resendContainer}>
                            <TouchableOpacity onPress={handleResendOtp} disabled={!canResend || loading}>
                                <Text style={[styles.resendText, (!canResend || loading) && styles.resendTextDisabled]}>
                                    {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <SubmitButton onPress={handleVerifyOtp} loading={loading} title="Verify" />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>Your new password must be secure and different from previous ones.</Text>
                        <FormInput icon="lock-closed-outline" placeholder="New Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}>
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#78909C" />
                            </TouchableOpacity>
                        </FormInput>
                        <FormInput icon="lock-closed-outline" placeholder="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword}>
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#78909C" />
                            </TouchableOpacity>
                        </FormInput>
                        <SubmitButton onPress={handleChangePassword} loading={loading} title="Reset Password" />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle='dark-content' hidden={false} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color={'#006064'} />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <ProgressIndicator currentStep={step} />
                        <View style={styles.contentContainer}>
                            {renderStepContent()}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0F7FA',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    backButton: {
        position: 'absolute',
        top: responsiveHeight(6),
        left: responsiveWidth(4),
        zIndex: 10,
        padding: 5,
    },
    lottieContainer: {
        height: responsiveHeight(28),
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: responsiveHeight(2),
    },
    lottie: {
        width: responsiveWidth(55),
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: responsiveWidth(15),
        marginVertical: responsiveHeight(3),
    },
    progressStep: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#B2EBF2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4DD0E1',
    },
    progressStepActive: {
        backgroundColor: '#00ACC1',
        borderColor: '#006064',
    },
    progressText: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(1.8),
        color: '#006064',
    },
    progressTextActive: {
        color: '#FFFFFF',
    },
    progressLine: {
        flex: 1,
        height: 4,
        backgroundColor: '#B2EBF2',
    },
    progressLineActive: {
        backgroundColor: '#00ACC1',
    },
    contentContainer: {
        paddingHorizontal: responsiveWidth(7),
    },
    stepContainer: {
        width: '100%',
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(3),
        color: '#004D40',
        textAlign: 'center',
        marginBottom: responsiveHeight(1),
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: responsiveFontSize(1.8),
        color: '#00796B',
        textAlign: 'center',
        marginBottom: responsiveHeight(4),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: responsiveHeight(2.5),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    inputIcon: {
        paddingLeft: 15,
    },
    input: {
        flex: 1,
        height: responsiveHeight(7.5),
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(1.9),
        color: '#004D40',
        paddingHorizontal: 12,
    },
    submitButton: {
        backgroundColor: '#00838F',
        height: responsiveHeight(7.5),
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#004D40',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginTop: responsiveHeight(2),
    },
    submitButtonText: {
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2.2),
        color: '#FFFFFF',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    otpInput: {
        width: responsiveWidth(12),
        // height: responsiveHeight(9),
        borderWidth: 2,
        borderColor: '#4DD0E1',
        borderRadius: 12,
        textAlign: 'center',
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2.5),
        color: '#004D40',
        backgroundColor: '#FFFFFF',
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: responsiveHeight(3),
    },
    resendText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(1.8),
        color: '#00838F',
    },
    resendTextDisabled: {
        color: '#78909C',
    },
    eyeIcon: {
        padding: 12,
    }
});

export default ForgotPassword;