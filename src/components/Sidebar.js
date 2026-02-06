import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { logoutUser } from '../redux/UserSlice';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Helper for Adaptive Fonts ---
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.6) : responsiveFontSize(size);
};

// --- Custom Logout Dialog ---
const LogoutDialog = ({ visible, onCancel, onConfirm, width }) => {
  // Adaptive sizes for dialog
  const isTablet = width > 768;
  const titleSize = isTablet ? responsiveFontSize(1.2) : responsiveFontSize(2.5);
  const msgSize = isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.9);
  const btnTextSize = isTablet ? responsiveFontSize(1.2) : responsiveFontSize(2);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.dialogOverlay}>
        <View style={[styles.dialogBox, { maxWidth: isTablet ? 450 : 320 }]}>
          <Ionicons name="warning-outline" size={isTablet ? 50 : 60} color="#F97316" />
          <Text style={[styles.dialogTitle, { fontSize: titleSize }]}>Logging Out</Text>
          <Text style={[styles.dialogMessage, { fontSize: msgSize }]}>
            Are you sure you want to log out from your account?
          </Text>
          <View style={styles.dialogButtonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={[styles.cancelButtonText, { fontSize: btnTextSize }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmLogoutButton} onPress={onConfirm}>
              <Text style={[styles.confirmLogoutButtonText, { fontSize: btnTextSize }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Main Sidebar Component ---
const Sidebar = ({ visible, onClose, onQuickBoost, onSlot, onCommunity, onAppointment, onEarnings }) => {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Calculate dynamic sidebar width: 75% for phones, fixed 350px for tablets
  const sidebarWidth = isTablet ? 350 : width * 0.75;

  // Animation State
  // We initialize off-screen based on the calculated width
  const sidebarPosition = useRef(new Animated.Value(-sidebarWidth)).current;
  const [isRendered, setIsRendered] = useState(visible);
  const [dialogVisible, setDialogVisible] = useState(false);

  // adaptive font helper for this scope
  const fSize = (s) => getAdaptiveFontSize(s, width);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.timing(sidebarPosition, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarPosition, {
        toValue: -sidebarWidth, // Animate back to the specific width
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible, sidebarPosition, sidebarWidth]);

  if (!isRendered) {
    return null;
  }

  const handleLogoutPress = () => setDialogVisible(true);

  const performLogout = async () => {
    try {
      setDialogVisible(false);
      dispatch(logoutUser());
      await AsyncStorage.removeItem('userDetails');
      onClose();
    } catch (error) {
      console.error("Logout error: ", error);
      Alert.alert('Logout Failed', 'An error occurred. Please try again.');
    }
  };

  const MenuButton = ({ icon, text, onPress }) => (
    <Pressable
      style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      onPress={() => {
        onClose();
        setTimeout(onPress, 100);
      }}>
      <Ionicons name={icon} size={isTablet ? 30 : 22} color="#4B5563" />
      <Text style={[styles.menuButtonText, { fontSize: fSize(2.1) }]}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onClose} style={styles.overlay} />

      {/* Sidebar Animated View */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            transform: [{ translateX: sidebarPosition }]
          }
        ]}
      >
        <SafeAreaView style={styles.safeAreaContainer}>
          <View>
            <View style={styles.header}>
              <Image
                source={require('../assets/no_back_logo_color.png')}
                style={[styles.logo, { width: isTablet ? 80 : 90, height: isTablet ? 70 : 80 }]}
              />
              <Text style={[styles.headerTitle, { fontSize: fSize(2.8) }]}>CalmSpace</Text>
              <Text style={[styles.headerSubtitle, { fontSize: fSize(1.7) }]}>Counselor Panel</Text>
            </View>

            <View style={styles.menuContainer}>
              <MenuButton icon="flash-outline" text="Quick Boost" onPress={onQuickBoost} />
              <MenuButton icon="calendar-outline" text="Schedule Slot" onPress={onSlot} />
              <MenuButton icon="people-outline" text="Community" onPress={onCommunity} />
              <MenuButton icon="list-outline" text="Appointments" onPress={onAppointment} />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={isTablet ? 35 : 22} color="#EF4444" />
              <Text style={[styles.logoutButtonText, { fontSize: fSize(2.1) }]}>Logout</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>

      <LogoutDialog
        visible={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        onConfirm={performLogout}
        width={width}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    height: '100%',
    backgroundColor: '#F8FAFC',
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      }
    }),
  },
  safeAreaContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 10
  },
  menuContainer: {
    padding: 15,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'ios' ? 15 : 12,
    borderRadius: 12,
  },
  menuButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  menuButtonText: {
    marginLeft: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    includeFontPadding: false,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutButtonText: {
    marginLeft: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#EF4444',
    includeFontPadding: false,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      }
    }),
  },
  dialogTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 15,
  },
  dialogMessage: {
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 35,
    // lineHeight: 22,
  },
  dialogButtonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#4B5563',
  },
  confirmLogoutButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
  },
  confirmLogoutButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  }
});

export default Sidebar;