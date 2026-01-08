import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
  Platform,
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
  bg: '#F1F5F9', // Slate-100 (matching parent)
  white: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#64748B',
  primary: '#2563EB',
  border: '#E2E8F0',
};

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const CounselorChat = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users from the server
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

  // Refetch users when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // Render a single chat item
  const renderChatItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
      onPress={() => navigation.navigate('QuickBoostChat', { id: item?._id, name: item?.name, pic: item?.pic, email: item?.email })}>
      <Image
        source={{ uri: item?.pic || 'https://i.pravatar.cc/150' }}
        style={[styles.avatar, { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: isTablet ? 24 : 20 }]}
      />
      <View style={styles.chatTextContainer}>
        <Text style={[styles.userName, { fontSize: fSize(1.8) }]}>{item.name}</Text>
        <Text style={[styles.userStatus, { fontSize: fSize(1.4) }]}>Waiting for you...</Text>
      </View>
      <View style={styles.actionIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={isTablet ? 24 : 22} color={COLORS.primary} />
      </View>
    </Pressable>
  );

  // Render when the list is empty
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
      {/* Centered list container for Tablets */}
      <View style={{ flex: 1, width: isTablet ? MAX_CONTENT_WIDTH : '100%', alignSelf: 'center' }}>
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 5, paddingBottom: 20 }}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background for the list area
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 200,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12, // Increased padding
    borderRadius: 16, // More rounded
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Very subtle border
    // Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  chatItemPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  avatar: {
    marginRight: 14,
    backgroundColor: '#E2E8F0',
  },
  chatTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textDark,
  },
  userStatus: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary, // Make status pop a bit more
    marginTop: 2,
  },
  actionIcon: {
    padding: 8,
    backgroundColor: '#EFF6FF', // Light blue bg
    borderRadius: 10,
  },
  // --- Empty State Styles ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTextTitle: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  emptyTextSubtitle: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
});

export default CounselorChat;