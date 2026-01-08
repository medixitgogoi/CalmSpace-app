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
  useWindowDimensions,
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getCounselorByID } from '../../utils/getCounselorByID';
import CounselorChat from '../../components/CounselorChat';
import { useFocusEffect } from '@react-navigation/native';

// --- Constants ---
const MAX_CONTENT_WIDTH = 650;

const COLORS = {
  bg: '#F1F5F9', // Slate-100
  white: '#FFFFFF',
  textDark: '#0F172A', // Slate-900
  textLight: '#64748B', // Slate-500
  primary: '#2563EB', // Blue-600
  success: '#10B981', // Emerald-500
  successBg: '#ECFDF5', // Emerald-50
  offlineBg: '#E2E8F0', // Slate-200
};

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const QuickBoost = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [details, setDetails] = useState(null);

  // Fetch counselor data
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

  // Handle toggling availability
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
        <ActivityIndicator size={'large'} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fSize(2.2) }]}>Quick Boost</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* --- Main Content Area --- */}
        <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
          <View style={{ width: isTablet ? MAX_CONTENT_WIDTH : '100%', flex: 1 }}>

            {details ? (
              <>
                {/* 1. Status Dashboard Card */}
                <View style={[
                  styles.statusCard,
                  isAvailable ? styles.statusCardOnline : styles.statusCardOffline
                ]}>
                  <View style={styles.statusHeader}>
                    <View style={[
                      styles.iconCircle,
                      { backgroundColor: isAvailable ? '#D1FAE5' : '#CBD5E1' }
                    ]}>
                      <Ionicons
                        name={isAvailable ? "flash" : "moon"}
                        size={24}
                        color={isAvailable ? COLORS.success : COLORS.textLight}
                      />
                    </View>
                    <View style={styles.switchWrapper}>
                      {toggleLoading ? (
                        <ActivityIndicator color={isAvailable ? COLORS.success : COLORS.textLight} />
                      ) : (
                        <Switch
                          value={isAvailable}
                          onValueChange={handleToggle}
                          trackColor={{ false: '#94A3B8', true: '#6EE7B7' }}
                          thumbColor={isAvailable ? '#10B981' : '#F1F5F9'}
                          // ios_backgroundColor="#CBD5E1"
                          style={{ transform: [{ scaleX: isTablet ? 1.1 : 0.9 }, { scaleY: isTablet ? 1.1 : 0.9 }] }}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.statusTextContainer}>
                    <Text style={[styles.statusTitle, { fontSize: fSize(2.2), color: isAvailable ? '#064E3B' : '#334155' }]}>
                      {isAvailable ? "You're Online!" : "You're Currently Offline"}
                    </Text>
                    <Text style={[styles.statusSubtitle, { fontSize: fSize(1.6), color: isAvailable ? '#065F46' : '#64748B' }]}>
                      {isAvailable
                        ? "Great! Users can now find you for instant Quick Boost sessions."
                        : "Go online to start receiving instant chat requests from users."}
                    </Text>
                  </View>
                </View>

                {/* 2. Active Chats Section */}
                <View style={styles.chatSectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles-outline" size={isTablet ? 35 : 20} color={COLORS.textLight} style={{ marginRight: 8 }} />
                    <Text style={[styles.sectionTitle, { fontSize: fSize(1.8) }]}>
                      Recent Conversations
                    </Text>
                  </View>

                  {/* Chat List Area */}
                  <View style={styles.chatListWrapper}>
                    <CounselorChat navigation={navigation} />
                  </View>
                </View>
              </>
            ) : (
              // --- No Profile State ---
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIconWrapper}>
                  <Ionicons name="person-add-outline" size={isTablet ? 60 : 50} color={COLORS.primary} />
                </View>
                <Text style={[styles.emptyTitle, { fontSize: fSize(2.4) }]}>Setup Your Profile</Text>
                <Text style={[styles.emptySubtitle, { fontSize: fSize(1.8) }]}>
                  To access Quick Boost and start helping users, you need to complete your counselor profile first.
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AddDetails')}
                  style={styles.ctaButton}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.ctaButtonText, { fontSize: fSize(2) }]}>Create Profile Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
  },

  // --- Status Card ---
  statusCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    // Modern Shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
  },
  statusCardOnline: {
    backgroundColor: COLORS.successBg,
    borderColor: '#A7F3D0',
  },
  statusCardOffline: {
    backgroundColor: COLORS.white,
    borderColor: '#E2E8F0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    gap: 4,
  },
  statusTitle: {
    fontFamily: 'Poppins-Bold',
  },
  statusSubtitle: {
    fontFamily: 'Poppins-Medium',
  },

  // --- Chat Section ---
  chatSectionContainer: {
    flex: 1,
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // Subtle shadow for the bottom sheet effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 5,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  chatListWrapper: {
    flex: 1,
    // backgroundColor: 'red',
    paddingBottom: 20, // Space at bottom
    // paddingHorizontal: 20
  },

  // --- Empty State ---
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -40, // Visual adjustment
  },
  emptyStateIconWrapper: {
    width: 100,
    height: 100,
    backgroundColor: '#DBEAFE', // Light Blue
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.white,
  },
});

export default QuickBoost;