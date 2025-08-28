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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { getCounselorByID } from '../../utils/getCounselorByID';

// --- Reusable UI Components ---

// Memoized FormField to prevent re-renders, fixing the keyboard issue.
const FormField = memo(({ label, value, onChangeText, placeholder, keyboardType, multiline = false }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        keyboardType={keyboardType ? keyboardType : 'default'}
        style={[styles.input, multiline && { height: responsiveHeight(12), textAlignVertical: 'top' }]}
      />
    </View>
  </View>
));

// A new component to display items as "tags" or "pills" that can be removed.
const Tag = memo(({ label, onRemove }) => (
  <View style={styles.tagContainer}>
    <Text style={styles.tagText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.tagRemoveButton}>
      <Ionicons name="close" size={16} color="#334155" />
    </TouchableOpacity>
  </View>
));

// A new component for handling array inputs with a tag-based UI.
const ArrayInputField = memo(({ label, items, setItems, placeholder }) => {
  const [currentInput, setCurrentInput] = useState('');

  const handleAddItem = () => {
    const newItem = currentInput.trim();
    if (newItem && !items.includes(newItem)) {
      setItems([...items, newItem]);
    }
    setCurrentInput(''); // Clear input after adding
  };

  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagsWrapper}>
        {items.map((item, index) => (
          <Tag key={index} label={item} onRemove={() => handleRemoveItem(index)} />
        ))}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          value={currentInput}
          onChangeText={setCurrentInput}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          onSubmitEditing={handleAddItem} // Add item when user presses return/enter
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
  // Select only the authToken to prevent re-renders when other user details change.
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

  // Prefill data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCounselorByID(authToken);
        if (data) {
          setInfo(data.info || '');
          setExpertise(data.expertise || '');
          setExperience(String(data.experience || ''));
          setDegree(data.degree || '');
          setTherapy(data.therapy || '');
          setLanguages(data.languages || []);
          setSpeciality(data.speciality || []);
        }
      } catch (error) {
        console.log('Error fetching counselor details: ', error);
        Alert.alert("Error", "Could not fetch your profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (authToken) {
      fetchData();
    } else {
      setLoading(false);
      Alert.alert("Authentication Error", "Could not verify user. Please log in again.");
    }
  }, [authToken]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!info.trim() || !expertise.trim() || !languages.length || !experience.trim() || !degree.trim() || !therapy.trim() || !speciality.length) {
      Alert.alert(
        'Incomplete Form',
        'All fields are required. Please fill out all the details and try again.'
      );

      return;
    }

    setSubmitLoading(true);

    const payload = {
      info,
      expertise,
      languages,
      experience,
      degree,
      therapy,
      speciality,
    };

    try {
      const response = await axios.put('/counselor/edit-info', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });

      console.log('updated button: ', response);

      if (response?.data?.status_code === 201) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response?.data?.message || 'Success!', ToastAndroid.LONG);
        } else {
          Alert.alert('Success!', response?.data?.message);
        }

        navigation.goBack();
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response?.data?.message || 'Error!', ToastAndroid.LONG);
        } else {
          Alert.alert('Error!', response?.data?.message);
        }
      }
    } catch (error) {
      console.log("Update profile error:", error);
      if (Platform.OS === 'android') {
        ToastAndroid.show(response?.data?.message || 'Network error!', ToastAndroid.LONG);
      } else {
        Alert.alert('Network Error!', response?.data?.message);
      }
      Alert.alert('Request Failed', 'Failed to update details. Please check your connection and try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Use useCallback to memoize state setters. This is crucial for preventing re-renders in child components.
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
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={'#1E293B'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled">

            <FormField label="About You (Info)" value={info} onChangeText={handleSetInfo} placeholder="Tell us about your background and approach." multiline />
            <FormField label="Areas of Expertise" value={expertise} onChangeText={handleSetExpertise} placeholder="e.g., CBT, Mindfulness, Relationship Counseling" multiline />
            <ArrayInputField label="Languages Spoken" items={languages} setItems={handleSetLanguages} placeholder="Type a language and press add..." />
            <FormField label="Years of Experience" value={experience} onChangeText={handleSetExperience} placeholder="e.g., 5 years" keyboardType='numeric' />
            <FormField label="Highest Degree/Qualification" value={degree} onChangeText={handleSetDegree} placeholder="e.g., M.A. in Clinical Psychology" />
            <FormField label="Therapy Approaches" value={therapy} onChangeText={handleSetTherapy} placeholder="e.g., Person-Centered, Psychodynamic" multiline />
            <ArrayInputField label="Specialties" items={speciality} setItems={handleSetSpeciality} placeholder="Type a specialty and press add..." />

          </ScrollView>

          {/* Footer with Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              disabled={submitLoading}
              onPress={handleSubmit}
              style={[styles.submitButton, submitLoading && styles.disabledButton]}>
              {submitLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
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
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#475569'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: 'Poppins-Bold',
    color: '#1E293B',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: responsiveHeight(12),
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: responsiveFontSize(1.9),
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
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    minHeight: responsiveHeight(6.5),
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
    fontSize: responsiveFontSize(1.8),
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
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    height: responsiveHeight(6.6),
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
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-Bold',
  },
});

export default UpdateProfile;
