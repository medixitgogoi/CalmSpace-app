import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getCounselorByID } from '../../utils/getCounselorByID';
import CounselorChat from '../../components/CounselorChat'; // Assuming this component is styled or fits well
import { useFocusEffect } from '@react-navigation/native';

// --- NEW MODERN UI ---

const QuickBoost = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [details, setDetails] = useState(null);

  // Fetch counselor data on screen focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        try {
          const data = await getCounselorByID(authToken);
          if (isActive) {
            setDetails(data);
            setIsAvailable(data?.status === 'online');
          }
        } catch (error) {
          console.log('Error fetching counselor: ', error);
          if (isActive) Alert.alert("Error", "Could not fetch your status.");
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [authToken])
  );

  // Handle toggling availability status
  const handleToggle = async (newValue) => {
    setToggleLoading(true);
    try {
      const response = await axios.post(
        '/counselor/Updateonline',
        {},
        { headers: { 'Content-Type': 'application/json', Authorization: authToken } }
      );

      if (response?.data?.status_code === 201) {
        setIsAvailable(newValue);
      } else {
        Alert.alert("Update Failed", "Could not change your status. Please try again.");
      }
    } catch (error) {
      console.log('Error toggling availability: ', error.message);
      Alert.alert("Error", "An error occurred while updating your status.");
    } finally {
      setToggleLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size={'large'} color={'#2563EB'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={'#1F2937'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Boost</Text>
          <View style={{ width: 40 }} />
        </View>

        {details ? (
          <>
            {/* Availability Toggle Card */}
            <View style={styles.card}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Your Availability</Text>
                <Text style={styles.cardSubtitle}>
                  {isAvailable ? 'You are currently online and visible to users.' : 'You are offline. Go online to receive requests.'}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                {toggleLoading ? (
                  <ActivityIndicator color={isAvailable ? "#16A34A" : "#6B7280"} />
                ) : (
                  <Switch
                    value={isAvailable}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
                    thumbColor={isAvailable ? '#16A34A' : '#F9FAFB'}
                    ios_backgroundColor="#D1D5DB"
                  />
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Active Chats</Text>
              <View style={styles.divider} />
            </View>

            {/* Counselor Chat List */}
            <CounselorChat navigation={navigation} />
          </>
        ) : (
          // Prompt to Add Details
          <View style={[styles.centeredScreen, { paddingHorizontal: 20 }]}>
            <Ionicons name="document-text-outline" size={80} color="#F59E0B" />
            <Text style={styles.noticeTitle}>Profile Not Found</Text>
            <Text style={styles.noticeText}>
              Please create your counselor profile to access the Quick Boost feature and connect with users.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddDetails')}
              style={styles.addDetailsButton}>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.addDetailsButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: Platform.OS === 'ios' ? 20 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  cardTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    marginTop: 4,
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  // --- Notice Screen Styles ---
  noticeTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  noticeText: {
    fontSize: responsiveFontSize(2),
    color: '#4B5563',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  addDetailsButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  addDetailsButtonText: {
    fontSize: responsiveFontSize(2),
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
});

export default QuickBoost;