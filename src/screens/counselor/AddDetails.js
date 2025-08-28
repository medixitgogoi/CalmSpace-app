import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message'; // Import showMessage

import { fetchUserData } from '../../utils/fetchUserData';
import { primary, secondary } from '../../utils/colors';


// Reusable and memoized component for form inputs
const FormInput = React.memo(
  ({ label, value, onChangeText, placeholder, multiline = false }) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline={multiline}
        />
      </View>
    );
  },
);

// Refactored component using react-native-flash-message
const AddDetails = ({ navigation }) => {
  const authToken = useSelector(state => state.user?.authToken);

  const [formData, setFormData] = useState({
    info: '',
    expertise: '',
    languages: '',
    speciality: '',
    experience: '',
    degree: '',
    therapy: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!authToken) return;

      const fetchData = async () => {
        setInitialLoading(true);
        try {
          const data = await fetchUserData(authToken);
          setIsVerified(data?.adminVerified);

          if (data?.counselorInfo) {
            setFormData({
              info: data.counselorInfo.info || '',
              expertise: data.counselorInfo.expertise || '',
              languages: (data.counselorInfo.languages || []).join(', '),
              speciality: (data.counselorInfo.speciality || []).join(', '),
              experience: data.counselorInfo.experience || '',
              degree: data.counselorInfo.degree || '',
              therapy: data.counselorInfo.therapy || '',
            });
          }
        } catch (error) {
          console.log('Error fetching counselor data: ', error);
          showMessage({
            message: 'Data Load Failed',
            description: 'Could not fetch your existing details. Please try again.',
            type: 'danger',
            icon: 'danger',
          });
        } finally {
          setInitialLoading(false);
        }
      };

      fetchData();
    }, [authToken]),
  );

  const handleSubmit = useCallback(async () => {
    if (Object.values(formData).some(value => !value.trim())) {
      showMessage({
        message: 'Incomplete Form',
        description: 'Please fill out all the required fields to proceed.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        languages: formData.languages.split(',').map(item => item.trim()),
        speciality: formData.speciality.split(',').map(item => item.trim()),
      };

      const response = await axios.post('/counselor/update-info', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });

      if (response?.data?.status_code === 200) {
        showMessage({
          message: 'Details Saved!',
          description: 'Your counselor information has been updated successfully.',
          type: 'success',
          icon: 'success',
        });
        navigation.navigate('Dashboard');
      } else {
        showMessage({
          message: 'Update Failed',
          description: response?.data?.message || 'An unknown error occurred.',
          type: 'danger',
          icon: 'danger',
        });
      }
    } catch (error) {
      console.log('Submission Error: ', error);
      showMessage({
        message: 'Submission Error',
        description: 'Could not save details. Please check your connection and try again.',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [formData, authToken, navigation]);

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.flexOne}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}>
          {isVerified ? (
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}>
                  <Ionicons name="arrow-back" size={25} color={'#333'} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Details</Text>
                <View style={styles.backButton} />
              </View>

              {/* Form */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                <FormInput
                  label="Info"
                  value={formData.info}
                  onChangeText={value => handleInputChange('info', value)}
                  placeholder="A brief professional bio"
                  multiline
                />
                <FormInput
                  label="Expertise"
                  value={formData.expertise}
                  onChangeText={value => handleInputChange('expertise', value)}
                  placeholder="e.g., Cognitive Behavioral Therapy"
                  multiline
                />
                <FormInput
                  label="Languages"
                  value={formData.languages}
                  onChangeText={value => handleInputChange('languages', value)}
                  placeholder="English, Hindi, Assamese"
                />
                <FormInput
                  label="Experience"
                  value={formData.experience}
                  onChangeText={value => handleInputChange('experience', value)}
                  placeholder="e.g., 5 years"
                />
                <FormInput
                  label="Degree"
                  value={formData.degree}
                  onChangeText={value => handleInputChange('degree', value)}
                  placeholder="e.g., M.A. in Clinical Psychology"
                />
                <FormInput
                  label="Therapy"
                  value={formData.therapy}
                  onChangeText={value => handleInputChange('therapy', value)}
                  placeholder="Therapies you specialize in"
                  multiline
                />
                <FormInput
                  label="Speciality"
                  value={formData.speciality}
                  onChangeText={value => handleInputChange('speciality', value)}
                  placeholder="Anxiety, Depression, Relationships"
                  multiline
                />
              </ScrollView>

              {/* Submit Button */}
              <TouchableOpacity
                disabled={loading}
                onPress={handleSubmit}
                style={styles.submitButton}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={22}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.submitButtonText}>Save Details</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.verificationCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={60} color="#34d399" />
              </View>
              <Text style={styles.verificationTitle}>Verification Required</Text>
              <Text style={styles.verificationSubtitle}>
                Your account must be verified by an admin before you can add your details. Please wait for approval.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Dashboard')}
                style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Okay, I Understand</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AddDetails;

// The StyleSheet remains the same as in the previous answer.
const styles = StyleSheet.create({
  // Layout & Container
  flexOne: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },

  // Form Input (for the reusable component)
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-Regular',
    color: '#0f172a',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
  },

  // Verification Card
  verificationCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    margin: 16,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  verificationSubtitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    height: responsiveHeight(6.5),
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(2),
  },
});