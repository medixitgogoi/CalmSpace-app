import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';
import { getOnlineUsers } from '../utils/getOnlineUsers';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Constants & Helpers ---
const MAX_CONTENT_WIDTH = 600;
const COLORS = {
  bg: '#F1F5F9',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#64748B',
  primary: '#2563EB',
  statusGreen: '#10B981',
  statusGreenBg: '#DCFCE7',
};

const AVATAR_COLORS = [
  '#FF5733', '#2563EB', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#E11D48'
];

const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

// Added onChatPress prop to handle intercepted navigation logic from QuickBoost.js
const CounselorChat = ({ navigation, blockedIds, onChatPress }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const visibleUsers = useMemo(() => {
    if (!users) return [];
    if (!blockedIds) return users;
    return users.filter(user => !blockedIds.has(user._id));
  }, [users, blockedIds]);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getOnlineUsers(authToken);
      setUsers(data || []);
    } catch (error) {
      console.log('Error fetching users: ', error);
    } finally {
      if (!isRefresh) setLoading(false);
      else setRefreshing(false);
    }
  }, [authToken]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const onRefresh = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const renderChatItem = ({ item }) => {
    const initials = item.name ? item.name.charAt(0).toUpperCase() : '?';
    const avatarBg = getAvatarColor(item.name || "");

    return (
      <Pressable
        style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
        // Logic Interceptor: Call onChatPress instead of direct navigation
        onPress={() => onChatPress(item)}>

        <View style={[styles.avatarInitial, { backgroundColor: avatarBg, width: isTablet ? 50 : 45, height: isTablet ? 50 : 45, borderRadius: isTablet ? 25 : 22.5 }]}>
          <Text style={[styles.avatarText, { fontSize: fSize(2) }]}>{initials}</Text>
        </View>

        <View style={styles.chatTextContainer}>
          <Text style={[styles.userName, { fontSize: fSize(1.8) }]}>{item.name}</Text>

          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={[styles.userStatus, { fontSize: fSize(1.3) }]}>Active Request</Text>
          </View>
        </View>

        <View style={styles.actionIcon}>
          <Ionicons name="chevron-forward" size={isTablet ? 22 : 18} color={COLORS.textLight} />
        </View>
      </Pressable>
    );
  };

  const renderEmptyListComponent = () => (
    <View style={[styles.emptyContainer, { minHeight: isTablet ? 300 : 200 }]}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="chatbubbles-outline" size={isTablet ? 60 : 50} color="#CBD5E1" />
      </View>
      <Text style={[styles.emptyTextTitle, { fontSize: fSize(2.2) }]}>No Active Chats</Text>
      <Text style={[styles.emptyTextSubtitle, { fontSize: fSize(1.6) }]}>
        Users who are online and need a Quick Boost will appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, width: isTablet ? MAX_CONTENT_WIDTH : '100%', alignSelf: 'center' }}>
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 1, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, minHeight: 200 },
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1.5 },
  chatItemPressed: { backgroundColor: '#F8FAFC', transform: [{ scale: 0.99 }] },
  avatarInitial: { marginRight: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatarText: { fontFamily: 'Poppins-Bold', color: '#FFF', includeFontPadding: false },
  chatTextContainer: { flex: 1, justifyContent: 'center' },
  userName: { fontFamily: 'Poppins-SemiBold', color: COLORS.textDark },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.statusGreenBg, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.statusGreen, marginRight: 6 },
  userStatus: { fontFamily: 'Poppins-Bold', color: COLORS.statusGreen, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: 40 },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTextTitle: { fontFamily: 'Poppins-Bold', color: COLORS.textDark, textAlign: 'center' },
  emptyTextSubtitle: { fontFamily: 'Poppins-Regular', color: COLORS.textLight, textAlign: 'center', marginTop: 8, maxWidth: 300 },
});

export default CounselorChat;