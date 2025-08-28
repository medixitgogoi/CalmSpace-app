import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { logoutUser } from '../redux/UserSlice';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

// A beautiful, custom dialog component
const LogoutDialog = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade" // Fade in animation
      onRequestClose={onCancel}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <Ionicons name="warning-outline" size={60} color="#F97316" />
          <Text style={styles.dialogTitle}>Logging Out</Text>
          <Text style={styles.dialogMessage}>
            Are you sure you want to log out from your account?
          </Text>
          <View style={styles.dialogButtonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmLogoutButton} onPress={onConfirm}>
              <Text style={styles.confirmLogoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Sidebar = ({ visible, onClose, onQuickBoost, onSlot, onCommunity, onAppointment }) => {
  const dispatch = useDispatch();
  const sidebarPosition = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [isRendered, setIsRendered] = useState(visible);

  // State to control the visibility of our custom dialog
  const [dialogVisible, setDialogVisible] = useState(false);

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
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible, sidebarPosition]);

  if (!isRendered) {
    return null;
  }

  // This function now just shows our custom dialog
  const handleLogoutPress = () => {
    setDialogVisible(true);
  };

  const performLogout = async () => {
    try {
      // First, close the dialog
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
      <Ionicons name={icon} size={22} color="#4B5563" />
      <Text style={styles.menuButtonText}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onClose} style={styles.overlay} />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarPosition }] }]}>
        <SafeAreaView style={styles.safeAreaContainer}>

          <View>
            <View style={styles.header}>
              <Image
                source={require('../assets/no_back_logo_color.png')}
                style={styles.logo}
              />
              <Text style={styles.headerTitle}>Calmspace</Text>
              <Text style={styles.headerSubtitle}>Counselor Panel</Text>
            </View>

            <View style={styles.menuContainer}>
              <MenuButton icon="flash-outline" text="Quick Boost" onPress={onQuickBoost} />
              <MenuButton icon="calendar-outline" text="Schedule Slot" onPress={onSlot} />
              <MenuButton icon="people-outline" text="Community" onPress={onCommunity} />
              {/* --- THIS LINE IS UPDATED --- */}
              <MenuButton icon="list-outline" text="Appointments" onPress={onAppointment} />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>

        </SafeAreaView>
      </Animated.View>

      {/* Render our custom dialog */}
      <LogoutDialog
        visible={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        onConfirm={performLogout}
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
    width: SIDEBAR_WIDTH,
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
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.8),
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(1.7),
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
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
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
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#EF4444',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '85%',
    maxWidth: 320,
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
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 5,
  },
  dialogMessage: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
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
    fontSize: responsiveFontSize(2),
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
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  }
});

export default Sidebar;