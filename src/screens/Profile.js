import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import {
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { logoutUser } from '../redux/UserSlice';
import { useDispatch, useSelector } from 'react-redux';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { primary } from '../utils/colors';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserData } from '../utils/fetchUserData';
import { disconnectSocket } from '../redux/socketSlice';
import FallbackPrompt from '../components/FallbackPrompt';
import { privacy, refund, terms } from '../utils/policies';
import Modal from 'react-native-modal';

// 1. Detect Tablet
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const Profile = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);

  const authToken = userDetails?.authToken;
  const dispatch = useDispatch();

  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [newUser, setNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyData, setPolicyData] = useState([]);

  const logOutHandler = async () => {
    try {
      setShowLogoutPrompt(false);
      dispatch(logoutUser());
      await AsyncStorage.removeItem('userDetails');
      dispatch(disconnectSocket());
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to log out',
        text2: 'Please try again',
        position: 'top',
        topOffset: 40,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await fetchUserData(authToken);
          setNewUser(!data?.isComplete);
          setUserName(data?.user?.name);
          setUserEmail(data?.user?.email);
        } catch (error) {
          console.log('Error fetching user data: ', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [authToken]),
  );

  const profileImageSource = userDetails?.gender === 'female' ? require('../assets/female_avatar.png') : require('../assets/male_avatar.png');

  const menuItems = [
    {
      title: 'Booking History',
      icon: 'time-outline',
      onPress: () => navigation.navigate('History'),
    },
    {
      title: 'Chat History',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => { navigation.navigate('ChatHistory') },
    },
    {
      title: 'Blocked Accounts',
      icon: 'headset-outline',
      onPress: () => { navigation.navigate('BlockedAccounts') },
    },
  ];

  const appItems = [
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => {
        setPolicyTitle('Privacy Policy');
        setPolicyData(privacy);
        setPolicyModalVisible(true);
      },
    },
    {
      title: 'Terms and Conditions',
      icon: 'document-text-outline',
      onPress: () => {
        setPolicyTitle('Terms and Conditions');
        setPolicyData(terms);
        setPolicyModalVisible(true);
      },
    },
    {
      title: 'Refund and Cancellation Policy',
      icon: 'cash-outline',
      onPress: () => {
        setPolicyTitle('Refund Policy');
        setPolicyData(refund);
        setPolicyModalVisible(true);
      },
    },
  ];

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          animated={true}
          barStyle={'dark-content'}
          hidden={false}
          backgroundColor={'#F8F9FC'}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 20} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerButton} />
        </View>

        {newUser ? (
          <FallbackPrompt />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* 2. Tablet Wrapper: Centers content and restricts width on iPad */}
            <View style={isTablet ? styles.tabletContainer : styles.mobileContainer}>

              <View style={styles.profileHeader}>
                <Image
                  source={profileImageSource}
                  style={styles.profileImage}
                  resizeMode='contain'
                />
                <Text style={styles.profileName}>{userName || 'User'}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
              </View>

              <View style={styles.menuCard}>
                {menuItems.map((item, index) => (
                  <View key={item.title}>
                    <TouchableOpacity onPress={item.onPress} style={styles.menuItem}>
                      <View style={styles.menuIconWrapper}>
                        <Ionicons
                          name={item.icon}
                          size={isTablet ? 22 : 18}
                          color={primary}
                        />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#BDBDBD" />
                    </TouchableOpacity>
                    {index < menuItems.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>

              <View style={{ ...styles.menuCard, marginTop: 10 }}>
                {appItems.map((item, index) => (
                  <View key={item.title}>
                    <TouchableOpacity onPress={item.onPress} style={styles.menuItem}>
                      <View style={styles.menuIconWrapper}>
                        <Ionicons
                          name={item.icon}
                          size={isTablet ? 22 : 18}
                          color={primary}
                        />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#BDBDBD" />
                    </TouchableOpacity>
                    {index < appItems.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Made with ❤️ from Calmspace</Text>
                <Text style={styles.versionText}>App Version: 6.1.1</Text>
              </View>

            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={() => setShowLogoutPrompt(true)}
          style={styles.logoutButton}>
          <Ionicons
            name="log-out-outline"
            size={isTablet ? 26 : 22}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Modal
          isVisible={showLogoutPrompt}
          onBackdropPress={() => setShowLogoutPrompt(false)}
          onBackButtonPress={() => setShowLogoutPrompt(false)}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.5}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={isTablet ? 40 : 32} color="#E53935" />
            </View>

            <Text style={styles.modalTitle}>Ready to Go?</Text>

            <Text style={styles.modalSubText}>
              Are you sure you want to log out? You'll be missed!
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={() => setShowLogoutPrompt(false)}
                style={[styles.modalButton, styles.cancelButton]}>
                <Text style={[styles.modalButtonText, { color: '#555' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={logOutHandler}
                style={[styles.modalButton, styles.confirmButton]}>
                <Text style={styles.modalButtonText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          isVisible={policyModalVisible}
          onBackdropPress={() => setPolicyModalVisible(false)}
          onBackButtonPress={() => setPolicyModalVisible(false)}

          style={{ justifyContent: 'flex-end', margin: 0 }}

          animationIn="slideInUp"
          animationOut="slideOutDown"
          backdropOpacity={0.5}

          swipeDirection="down"
          onSwipeComplete={() => setPolicyModalVisible(false)}
          propagateSwipe={true}   // allows scroll inside
        >
          <View style={styles.policyModalContainer}>

            {/* Centered Close Button */}
            <TouchableOpacity
              onPress={() => setPolicyModalVisible(false)}
              style={styles.floatingCloseButton}
            >
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>

            <View style={{
              width: 40,
              height: 5,
              backgroundColor: '#ccc',
              borderRadius: 10,
              alignSelf: 'center',
              marginBottom: 10
            }} />

            {/* Header */}
            <View style={styles.policyHeader}>
              <Text style={styles.policyTitle}>{policyTitle}</Text>
            </View>

            {/* Content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {policyData.map((item, index) => (
                <View key={index} style={{ marginBottom: 15 }}>

                  {item.heading && (
                    <Text style={styles.policyHeading}>{item.heading}</Text>
                  )}

                  <Text style={styles.policyText}>{item.desc}</Text>

                </View>
              ))}
            </ScrollView>

          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'android' || isTablet ? 10 : 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 15,
  },
  mobileContainer: {
    width: '100%',
  },
  tabletContainer: {
    width: '60%',
    alignSelf: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: isTablet ? 150 : 120,
    height: isTablet ? 150 : 120,
    borderRadius: isTablet ? 75 : 60,
    borderWidth: 3,
    borderColor: primary,
  },
  profileName: {
    fontSize: isTablet ? responsiveFontSize(1.8) : responsiveFontSize(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
    marginTop: 15,
  },
  profileEmail: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 0,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: responsiveHeight(Platform.OS === 'ios' ? 5.8 : 5)
  },
  menuIconWrapper: {
    width: isTablet ? 45 : 35,
    height: isTablet ? 45 : 35,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.9),
    color: '#1A1A1A',
    includeFontPadding: false,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 5,
    marginLeft: isTablet ? 65 : 55,
  },
  logoutButton: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(Platform.OS === 'ios' ? 2.3 : 2.1),
    borderRadius: 15,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 20,
    width: isTablet ? '50%' : '95%',
    alignSelf: 'center'
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: isTablet ? '50%' : '100%',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? responsiveFontSize(1.6) : responsiveFontSize(2.5),
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalSubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#E53935',
    marginLeft: 10,
  },
  modalButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    color: '#fff',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.6),
    color: '#888',
  },
  versionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(0.9) : responsiveFontSize(1.5),
    color: '#AAA',
    marginTop: 4,
  },
  policyModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 15,
    maxHeight: '80%',
  },
  policyHeader: {
    backgroundColor: '#5ae8dc',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 20,
    marginTop: 15
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  policyMainHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
    color: '#000',
  },
  policyHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    color: '#333',
  },
  policyText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  floatingCloseButton: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    backgroundColor: '#f9b2b2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    color: '#fff'
  },
});

export default Profile;