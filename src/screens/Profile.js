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
  Linking,
  Modal,
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

const Profile = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);

  const authToken = userDetails?.authToken;
  const dispatch = useDispatch();

  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [newUser, setNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleLinkPress = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Toast.show({
        type: 'error',
        text1: `Could not open the link.`,
        position: 'top',
        topOffset: 40,
      });
    }
  };

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
  ];

  const appItems = [
    {
      title: 'About Us',
      icon: 'information-circle-outline',
      onPress: () => handleLinkPress('https://thecalmspace.in/aboutus'),
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => handleLinkPress('https://thecalmspace.in/footer/privacy'),
    },
    {
      title: 'Terms and Conditions',
      icon: 'document-text-outline',
      onPress: () => handleLinkPress('https://thecalmspace.in/footer/t&c'),
    },
    {
      title: 'Refund and Cancellation Policy',
      icon: 'cash-outline',
      onPress: () => handleLinkPress('https://thecalmspace.in/footer/refund'),
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
            <Ionicons name="arrow-back" size={20} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerButton} />
        </View>

        {newUser ? (
          <FallbackPrompt />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
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
                        size={18}
                        color={primary}
                      />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
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
                        size={18}
                        color={primary}
                      />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                  </TouchableOpacity>
                  {index < appItems.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Made with ❤️ from Calmspace</Text>
              <Text style={styles.versionText}>App Version: 5.2.1</Text>
            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={() => setShowLogoutPrompt(true)}
          style={styles.logoutButton}>
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showLogoutPrompt}
          onRequestClose={() => {
            setShowLogoutPrompt(false);
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="log-out-outline" size={32} color="#E53935" />
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
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
    borderColor: primary,
  },
  profileName: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
    marginTop: 15,
  },
  profileEmail: {
    fontSize: responsiveFontSize(1.7),
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
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(1.9),
    color: '#1A1A1A',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 5,
    marginLeft: 55,
  },
  logoutButton: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(Platform.OS === 'ios' ? 2.3 : 2.1),
    borderRadius: 15,
    marginTop: 30,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 20,
    width: '95%',
    alignSelf: 'center'
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(2),
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
    width: '100%',
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
    fontSize: responsiveFontSize(2.5),
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalSubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.8),
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
    fontSize: responsiveFontSize(1.8),
    color: '#fff',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 60,
  },
  footerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.6),
    color: '#888',
  },
  versionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.5),
    color: '#AAA',
    marginTop: 4,
  },
});

export default Profile;