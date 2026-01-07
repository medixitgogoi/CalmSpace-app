import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ToastAndroid,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { getCounselorByID } from '../../utils/getCounselorByID';

// --- Constants & Helpers ---
const MAX_CONTENT_WIDTH = 600; // Max width for tablet container

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

// --- Reusable UI Components ---

const FormField = memo(({ label, value, onChangeText, placeholder, keyboardType, multiline = false, width }) => {
  const fSize = (s) => getAdaptiveFontSize(s, width);

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { fontSize: fSize(1.9) }]}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          keyboardType={keyboardType ? keyboardType : 'default'}
          style={[
            styles.input,
            { fontSize: fSize(2) },
            multiline && { height: width > 768 ? 150 : 100, textAlignVertical: 'top' }
          ]}
        />
      </View>
    </View>
  );
});

const Tag = memo(({ label, onRemove, width }) => {
  const fSize = (s) => getAdaptiveFontSize(s, width);
  return (
    <View style={styles.tagContainer}>
      <Text style={[styles.tagText, { fontSize: fSize(1.8) }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.tagRemoveButton}>
        <Ionicons name="close" size={16} color="#334155" />
      </TouchableOpacity>
    </View>
  );
});

const ArrayInputField = memo(({ label, items, setItems, placeholder, width }) => {
  const [currentInput, setCurrentInput] = useState('');
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const handleAddItem = () => {
    const newItem = currentInput.trim();
    if (newItem && !items.includes(newItem)) {
      setItems([...items, newItem]);
    }
    setCurrentInput('');
  };

  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { fontSize: fSize(1.9) }]}>{label}</Text>
      <View style={styles.tagsWrapper}>
        {items.map((item, index) => (
          <Tag key={index} label={item} onRemove={() => handleRemoveItem(index)} width={width} />
        ))}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          value={currentInput}
          onChangeText={setCurrentInput}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={[styles.input, { fontSize: fSize(2) }]}
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// --- Main Screen Component ---

const UpdateProfile = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const authToken = useSelector(state => state.user?.authToken);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [info, setInfo] = useState('');
  const [expertise, setExpertise] = useState('');
  const [languages, setLanguages] = useState([]);
  const [speciality, setSpeciality] = useState([]);
  const [experience, setExperience] = useState('');
  const [degree, setDegree] = useState('');
  const [therapy, setTherapy] = useState('');

  // Prefill data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCounselorByID(authToken);
        if (data) {
          setInfo(data.info || '');
          setExpertise(data.expertise || '');
          // Ensure experience is converted to string for the TextInput to display correctly
          setExperience(data.experience ? String(data.experience) : '');
          setDegree(data.degree || '');
          setTherapy(data.therapy || '');
          setLanguages(data.languages || []);
          setSpeciality(data.speciality || []);
        }
      } catch (error) {
        console.log('Error fetching details: ', error);
        Alert.alert("Error", "Could not fetch profile data.");
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchData();
    else setLoading(false);
  }, [authToken]);

  // --- FIXED HANDLESUBMIT FUNCTION ---
  const handleSubmit = async () => {
    // 1. Check for empty fields
    if (!info.trim() || !expertise.trim() || !languages.length || !experience.trim() || !degree.trim() || !therapy.trim() || !speciality.length) {
      Alert.alert('Incomplete Form', 'All fields are required.');
      return;
    }

    // 2. Validate Experience is a number
    const experienceNum = Number(experience);
    if (isNaN(experienceNum)) {
      Alert.alert('Invalid Input', 'Years of Experience must be a valid number.');
      return;
    }

    setSubmitLoading(true);

    // 3. Create payload with explicit Number conversion
    const payload = {
      info,
      expertise,
      languages,
      experience: experienceNum, // <--- FIXED: Explicitly sending a Number
      degree,
      therapy,
      speciality
    };

    try {
      const response = await axios.put('/counselor/edit-info', payload, {
        headers: { 'Content-Type': 'application/json', Authorization: authToken },
      });

      if (response?.data?.status_code === 201) {
        const msg = response?.data?.message || 'Success!';
        Platform.OS === 'android' ? ToastAndroid.show(msg, ToastAndroid.LONG) : Alert.alert('Success!', msg);
        navigation.goBack();
      } else {
        // If the server returns a 200 OK but with a logic error (status_code != 201)
        const msg = response?.data?.message || 'Something went wrong on the server.';
        console.log('Server Error Response:', response.data);
        Platform.OS === 'android' ? ToastAndroid.show(msg, ToastAndroid.LONG) : Alert.alert('Error!', msg);
      }
    } catch (error) {
      // This catches 4xx and 5xx errors (Axios throws on these by default)
      console.log("Update error details:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to update details. Please try again.';
      Alert.alert('Request Failed', errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSetInfo = useCallback((text) => setInfo(text), []);
  const handleSetExpertise = useCallback((text) => setExpertise(text), []);
  const handleSetExperience = useCallback((text) => setExperience(text), []);
  const handleSetDegree = useCallback((text) => setDegree(text), []);
  const handleSetTherapy = useCallback((text) => setTherapy(text), []);
  const handleSetLanguages = useCallback((items) => setLanguages(items), []);
  const handleSetSpeciality = useCallback((items) => setSpeciality(items), []);

  if (loading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size={'large'} color={'#3B82F6'} />
        <Text style={[styles.loadingText, { fontSize: fSize(2) }]}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={'#1E293B'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: fSize(2.3) }]}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: isTablet ? MAX_CONTENT_WIDTH : '100%', alignSelf: 'center' }}>

              <FormField label="About You (Info)" value={info} onChangeText={handleSetInfo} placeholder="Tell us about your background and approach." multiline width={width} />

              <FormField label="Areas of Expertise" value={expertise} onChangeText={handleSetExpertise} placeholder="e.g., CBT, Mindfulness, Relationship Counseling" multiline width={width} />

              <ArrayInputField label="Languages Spoken" items={languages} setItems={handleSetLanguages} placeholder="Type a language and press add..." width={width} />

              <FormField label="Years of Experience" value={experience} onChangeText={handleSetExperience} placeholder="e.g., 5 years" keyboardType='numeric' width={width} />

              <FormField label="Highest Degree/Qualification" value={degree} onChangeText={handleSetDegree} placeholder="e.g., M.A. in Clinical Psychology" width={width} />

              <FormField label="Therapy Approaches" value={therapy} onChangeText={handleSetTherapy} placeholder="e.g., Person-Centered, Psychodynamic" multiline width={width} />

              <ArrayInputField label="Specialties" items={speciality} setItems={handleSetSpeciality} placeholder="Type a specialty and press add..." width={width} />

            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              disabled={submitLoading}
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                submitLoading && styles.disabledButton,
                {
                  width: isTablet ? MAX_CONTENT_WIDTH : '100%',
                  alignSelf: 'center',
                  height: isTablet ? responsiveHeight(6.5) : responsiveHeight(6),
                }
              ]}
            >
              {submitLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={isTablet ? 35 : 22} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={[styles.submitButtonText, { fontSize: fSize(2.1) }]}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#475569'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#1E293B',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: responsiveHeight(12), // Extra padding for footer space
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    minHeight: 50,
  },
  addButton: {
    paddingHorizontal: 12,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: 'Poppins-Medium',
    color: '#334155',
  },
  tagRemoveButton: {
    marginLeft: 8,
    padding: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: '#F8FAFC',
    // backgroundColor: 'red',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    includeFontPadding: false,
  },
});

export default UpdateProfile;