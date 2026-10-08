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
  FlatList,
  ToastAndroid,
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getCounselorByID } from '../../utils/getCounselorByID';
import CounselorChat from '../../components/CounselorChat';
import { useFocusEffect } from '@react-navigation/native';
import { getBlockedUsers } from '../../utils/getBlockedUsers';
import { isBlocked } from '../../utils/isBlocked';

const MAX_CONTENT_WIDTH = 650;

const COLORS = {
  bg: '#F1F5F9',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#64748B',
  primary: '#2563EB',
  success: '#10B981',
  successBg: '#ECFDF5',
  danger: '#EF4444',
};

// --- Avatar Helpers ---
const AVATAR_COLORS = [
  '#FF5733', '#10B981', '#2563EB', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6',
  '#F43F5E', '#6366F1', '#84CC16', '#71717A'
];

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const getAvatarColor = (name) => {
  if (!name) return COLORS.textLight;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const QuickBoost = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => (isTablet ? responsiveFontSize(s * 0.7) : responsiveFontSize(s));

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [details, setDetails] = useState(null);

  // Tab and Blocked List State
  const [activeTab, setActiveTab] = useState('recent');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);
  const [checkingBlock, setCheckingBlock] = useState(false);

  const showFeedback = (title, msg) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(title, msg);
    }
  };

  const fetchBlockedList = async () => {
    setLoadingBlocked(true);
    const data = await getBlockedUsers(authToken);
    if (data) {
      setBlockedUsers(data);
      const ids = new Set(data.map(item => item?.blockUser?._id));
      setBlockedIds(ids);
    }
    setLoadingBlocked(false);
  };

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
          await fetchBlockedList();
        } catch (error) {
          console.log('Error fetching status: ', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [authToken])
  );

  useEffect(() => {
    if (activeTab === 'blocked') fetchBlockedList();
  }, [activeTab]);

  const handleToggle = async (newValue) => {
    setToggleLoading(true);
    try {
      const response = await axios.post('/counselor/Updateonline', {}, {
        headers: { 'Content-Type': 'application/json', Authorization: authToken }
      });
      if (response?.data?.status_code === 201) setIsAvailable(newValue);
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      const response = await axios.patch("/blockuser/unblock", { blockUser: userId }, {
        headers: { "Content-Type": "application/json", Authorization: authToken }
      });
      if (response?.data?.status_code === 201) {
        showFeedback('Success', 'User unblocked');
        fetchBlockedList();
      }
    } catch (error) {
      showFeedback('Error', 'Failed to unblock');
    } finally {
      setUnblockingId(null);
    }
  };

  // Logic to intercept chat press and check for block status
  const handleChatPress = async (chatUser) => {
    setCheckingBlock(true);
    try {
      const result = await isBlocked(authToken, chatUser._id);

      // If the result indicates the counselor is blocked by the user
      if (result?.isBlocked === true || result?.status === "blocked") {
        Alert.alert(
          "Access Denied",
          `You cannot enter this chat because you have been blocked by ${chatUser.name}.`,
          [{ text: "OK" }]
        );
      } else {
        navigation.navigate('QuickBoostChat', {
          id: chatUser._id,
          name: chatUser.name,
          pic: chatUser.pic
        });
      }
    } catch (error) {
      navigation.navigate('QuickBoostChat', { id: chatUser._id, name: chatUser.name, pic: chatUser.pic });
    } finally {
      setCheckingBlock(false);
    }
  };

  const renderBlockedUser = ({ item }) => {
    const userName = item?.blockUser?.name || 'User';
    const initials = getInitials(userName);
    const bgColor = getAvatarColor(userName);

    return (
      <View style={styles.blockedItem}>
        <View style={[styles.avatarCircle, { backgroundColor: bgColor }]}>
          <Text style={[styles.avatarText, { fontSize: fSize(2) }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.blockedName, { fontSize: fSize(1.8) }]}>{userName}</Text>
          <Text style={[styles.blockedEmail, { fontSize: fSize(1.4) }]}>{item?.blockUser?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.unblockBtn}
          onPress={() => handleUnblock(item?.blockUser?._id)}
          disabled={unblockingId !== null}
        >
          {unblockingId === item?.blockUser?._id ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <Text style={styles.unblockText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <View style={styles.centeredScreen}><ActivityIndicator size={'large'} color={COLORS.primary} /></View>;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

        {/* Loading Overlay for Block Check */}
        {checkingBlock && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingOverlayText}>Checking connection...</Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fSize(2.2) }]}>Quick Boost</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
          <View style={{ width: isTablet ? MAX_CONTENT_WIDTH : '100%', flex: 1 }}>
            {details && (
              <>
                <View style={[styles.statusCard, isAvailable ? styles.statusCardOnline : styles.statusCardOffline]}>
                  <View style={styles.statusHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: isAvailable ? '#D1FAE5' : '#CBD5E1' }]}>
                      <Ionicons name={isAvailable ? "flash" : "moon"} size={24} color={isAvailable ? COLORS.success : COLORS.textLight} />
                    </View>
                    <Switch value={isAvailable} onValueChange={handleToggle} trackColor={{ false: '#94A3B8', true: '#6EE7B7' }} thumbColor={isAvailable ? '#10B981' : '#F1F5F9'} />
                  </View>
                  <Text style={[styles.statusTitle, { fontSize: fSize(2.2), color: isAvailable ? '#064E3B' : '#334155' }]}>{isAvailable ? "You're Online!" : "You're Offline"}</Text>
                </View>

                <View style={styles.chatSectionContainer}>
                  <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'recent' && styles.activeTab]} onPress={() => setActiveTab('recent')}>
                      <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>Recent Chats</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'blocked' && styles.activeTab]} onPress={() => setActiveTab('blocked')}>
                      <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>Blocked Users</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chatListWrapper}>
                    {activeTab === 'recent' ? (
                      <CounselorChat
                        navigation={navigation}
                        blockedIds={blockedIds}
                        onChatPress={handleChatPress}
                      />
                    ) : (
                      <FlatList
                        data={blockedUsers}
                        keyExtractor={(item) => item._id}
                        renderItem={renderBlockedUser}
                        ListEmptyComponent={<View style={styles.blockedPlaceholder}><Ionicons name="shield-checkmark-outline" size={50} color="#CBD5E1" /><Text>No blocked users found.</Text></View>}
                      />
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: COLORS.white, elevation: 2 },
  headerTitle: { fontFamily: 'Poppins-Bold', color: COLORS.textDark },
  statusCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 24, padding: 24, elevation: 4, borderWidth: 1 },
  statusCardOnline: { backgroundColor: COLORS.successBg, borderColor: '#A7F3D0' },
  statusCardOffline: { backgroundColor: COLORS.white, borderColor: '#E2E8F0' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontFamily: 'Poppins-Bold' },
  chatSectionContainer: { flex: 1, marginTop: 24, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20, elevation: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 6, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.white, elevation: 2 },
  tabText: { fontFamily: 'Poppins-Medium', color: COLORS.textLight },
  activeTabText: { color: COLORS.primary, fontFamily: 'Poppins-Bold' },
  chatListWrapper: { flex: 1, paddingBottom: 20 },
  blockedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 12 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontFamily: 'Poppins-Bold' },
  blockedName: { fontFamily: 'Poppins-SemiBold', color: COLORS.textDark },
  blockedEmail: { fontFamily: 'Poppins-Regular', color: COLORS.textLight, fontSize: 12 },
  unblockBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  unblockText: { color: COLORS.danger, fontFamily: 'Poppins-SemiBold' },
  blockedPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  // Loading Overlay
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  loadingOverlayText: { marginTop: 10, fontFamily: 'Poppins-Medium', color: COLORS.textDark }
});

export default QuickBoost;