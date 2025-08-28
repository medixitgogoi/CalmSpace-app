import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// Import responsiveWidth along with the others
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { primary } from '../utils/colors';

const CompleteProfile = ({ navigation, route }) => {
  const { data: backToScreen } = route.params;
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); // 'male', 'female', or ''

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(age) || Number(age) <= 0) {
      newErrors.age = 'Please enter a valid age';
    }
    if (!gender) newErrors.gender = 'Please select a gender';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name,
        age: age,
        gender: gender,
      };

      const response = await axios.post('/auth/update-profile', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });

      console.log('update profile response: ', response);

      if (response?.data?.status_code === 200) {
        ToastAndroid.show(
          'Profile details updated successfully',
          ToastAndroid.SHORT,
        );

        if (backToScreen === 1) {
          navigation.navigate('Profile');
        } else {
          navigation.navigate('Dashboard');
        }
      }
    } catch (error) {
      console.log('update profile error: ', error);
      const errorMessage = error.response?.data?.message || 'Update failed. Please check your network and try again.';
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar animated={true} barStyle={'dark-content'} backgroundColor="#F8F9FC" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={responsiveWidth(6)} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete your Profile</Text>
          <View style={{ width: responsiveWidth(9) }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Using 'height' can sometimes work better
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={text => {
                    setName(text);
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter your name"
                  placeholderTextColor="#888"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Age Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  value={age}
                  onChangeText={text => {
                    setAge(text);
                    if (errors.age) setErrors(prev => ({ ...prev, age: null }));
                  }}
                  style={[styles.input, errors.age && styles.inputError]}
                  placeholder="Enter your age"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={3}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'male' && styles.genderOptionSelected,
                    ]}
                    onPress={() => {
                      setGender('male');
                      if (errors.gender) setErrors(prev => ({ ...prev, gender: null }));
                    }}>
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'male' && styles.genderTextSelected,
                      ]}>
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'female' && styles.genderOptionSelected,
                    ]}
                    onPress={() => {
                      setGender('female');
                      if (errors.gender) setErrors(prev => ({ ...prev, gender: null }));
                    }}>
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'female' && styles.genderTextSelected,
                      ]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>
            </View>

            {/* Spacer to push button to the bottom */}
            <View style={{ flex: 1 }} />

            {/* Update Button */}
            <TouchableOpacity onPress={updateProfile} style={styles.updateBtn} disabled={loading}>
              {loading ? (
                <ActivityIndicator size={'small'} color={'#fff'} />
              ) : (
                <Text style={styles.updateBtnText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// All fixed values in the StyleSheet are now replaced with responsive units.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(1),
  },
  form: {
    marginTop: responsiveHeight(1.5),
  },
  inputGroup: {
    marginBottom: responsiveHeight(2.5),
  },
  label: {
    fontSize: responsiveFontSize(1.9),
    color: '#4A5568',
    fontFamily: 'Poppins-Medium',
    marginBottom: responsiveHeight(1),
  },
  input: {
    height: responsiveHeight(6.6),
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(4),
    backgroundColor: '#fff',
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.8),
    color: '#1A202C',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.5),
    marginTop: responsiveHeight(0.7),
  },
  genderContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(4),
  },
  genderOption: {
    flex: 1,
    paddingVertical: responsiveHeight(1.5),
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: responsiveWidth(3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    backgroundColor: primary,
    borderColor: primary,
  },
  genderText: {
    fontFamily: 'Poppins-Medium',
    fontSize: responsiveFontSize(1.8),
    color: '#4A5568',
  },
  genderTextSelected: {
    color: '#fff',
  },
  updateBtn: {
    backgroundColor: primary,
    paddingVertical: responsiveHeight(2),
    borderRadius: responsiveWidth(4),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(2.5),
    minHeight: responsiveHeight(6.5),
  },
  updateBtnText: {
    color: '#fff',
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
});

export default CompleteProfile;