import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

// Local Utils & Components
import { fetchUserData } from '../../utils/fetchUserData';
import InfoRow from '../../components/InfoRow';
import Sidebar from '../../components/Sidebar';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { connectSocket } from '../../redux/socketSlice';
import { background } from '../../utils/colors';

// Helper for adaptive font sizing on tablets vs phones
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const Dashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const MAX_CONTENT_WIDTH = 600;

  // --- State ---
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [data, setData] = useState(null);
  const [newCounselor, setNewCounselor] = useState(false);
  const [infoCounselorAdded, setInfoCounselorAdded] = useState(true);

  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [counselorLoading, setCounselorLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // --- Effects ---

  // 1. Fetch User Data
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const userData = await fetchUserData(authToken);
          setData(userData?.user);
          setNewCounselor(!userData?.isComplete);
        } catch (error) {
          console.log('Error fetching user data: ', error);
        } finally {
          setUserLoading(false);
        }
      };
      fetchData();
      return () => { };
    }, [authToken]),
  );

  // 2. Fetch Counselor Data
  useFocusEffect(
    useCallback(() => {
      if (!newCounselor) {
        const fetchData = async () => {
          try {
            const counselorData = await getCounselorByID(authToken);
            if (!counselorData) {
              setInfoCounselorAdded(false);
            } else {
              setUserId(counselorData?.counselorId?._id);
            }
          } catch (error) {
            console.log('Error fetching counselor: ', error);
          } finally {
            setCounselorLoading(false);
          }
        };
        fetchData();
      }
    }, [newCounselor, authToken]),
  );

  // 3. Combine Loading States
  useEffect(() => {
    // If it's a new counselor (incomplete profile), we don't wait for counselorLoading
    if (newCounselor && !userLoading) {
      setLoading(false);
    } else if (!userLoading && !counselorLoading) {
      setLoading(false);
    }
  }, [userLoading, counselorLoading, newCounselor]);

  // 4. Connect Socket
  useEffect(() => {
    if (userId) {
      dispatch(connectSocket({ userId }));
    }
  }, [userId, dispatch]);

  // --- Render Helpers ---

  // Navigation Handlers
  const handleNavigation = (screen) => {
    setSidebarVisible(false);
    navigation.navigate(screen);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ecf9f9" />

        {/* --- Header / Menu Icon --- */}
        {!newCounselor && (
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu-outline" size={30} color="#0f172a" />
          </TouchableOpacity>
        )}

        {/* --- Sidebar Component --- */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onQuickBoost={() => handleNavigation('QuickBoost')}
          onSlot={() => handleNavigation('Slot')}
          onCommunity={() => handleNavigation('CommunityCounselor')}
          onAppointment={() => handleNavigation('Appointments')}
        />

        {/* --- Main Content --- */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { alignItems: 'center' } // Center content for wide screens
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Constrained Width Container for Tablets */}
          <View style={{ width: isTablet ? MAX_CONTENT_WIDTH : '100%' }}>

            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={{ width: width * 0.6, height: width * 0.6, maxWidth: 300, maxHeight: 300 }}>
                  <LottieView
                    source={require('../../assets/animations/loading.json')}
                    autoPlay
                    loop
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </View>
            ) : (
              <>
                {!newCounselor ? (
                  // --- Active Counselor View ---
                  <>
                    <View style={styles.profileHeader}>
                      <Image
                        source={{ uri: data?.pic }}
                        style={styles.profileImage}
                      />
                      <Text style={[styles.profileName, { fontSize: getAdaptiveFontSize(2.5, width) }]}>
                        {data?.name}
                      </Text>
                      <Text style={[styles.profileEmail, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                        {data?.email}
                      </Text>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoTitleContainer}>
                        <Text style={[styles.infoTitleText, { fontSize: getAdaptiveFontSize(2.2, width) }]}>
                          About Counselor
                        </Text>
                      </View>

                      <InfoRow label="Age" value={data?.age} />
                      <InfoRow label="Gender" value={data?.gender} />
                      <InfoRow label="Role" value={data?.role} />
                      <InfoRow
                        label="Joined on"
                        value={new Date(data?.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      />
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                      onPress={() => navigation.navigate(infoCounselorAdded ? 'UpdateProfile' : 'AddDetails')}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name={infoCounselorAdded ? "create-outline" : "document-text-outline"}
                        size={isTablet ? 40 : 23}
                        color="#0ea5e9"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.actionButtonText, { fontSize: getAdaptiveFontSize(2, width) }]}>
                        {infoCounselorAdded ? "Update Profile" : "Add Details"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // --- Incomplete Profile View ---
                  <View style={styles.incompleteContainer}>
                    <View style={styles.incompleteCard}>
                      <Ionicons
                        name="person-circle-outline"
                        size={80}
                        color="#0ea5e9"
                        style={{ marginBottom: 16 }}
                      />

                      <Text style={[styles.incompleteTitle, { fontSize: getAdaptiveFontSize(2.4, width) }]}>
                        Complete Your Profile
                      </Text>

                      <Text style={[styles.incompleteSubtitle, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                        Please complete your profile so users can find you and trust your valuable services.
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('CompleteProfile', { data: 2 })}
                      style={styles.primaryButton}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.primaryButtonText, { fontSize: getAdaptiveFontSize(2, width) }]}>
                        Add Profile Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 10, // Ensure it's clickable above scrollview
    backgroundColor: 'rgba(255,255,255,0.8)', // Slight background for readability
    borderRadius: 20,
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 60, // Space for header/menu
    paddingBottom: 40,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },

  // --- Active Counselor Styles ---
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e0f7fb',
    marginBottom: 12,
  },
  profileName: {
    fontFamily: 'Poppins-SemiBold',
    color: '#0f172a',
    textAlign: 'center',
  },
  profileEmail: {
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  infoTitleContainer: {
    backgroundColor: '#e0f7fb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitleText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#0ea5e9',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#f7fdfd',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderColor: '#0ea5e9',
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButtonText: {
    includeFontPadding: false,
    fontFamily: 'Poppins-SemiBold',
    color: '#0ea5e9',
    letterSpacing: 0.5,
  },

  // --- Incomplete Profile Styles ---
  incompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  incompleteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  incompleteTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  incompleteSubtitle: {
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});

export default Dashboard;