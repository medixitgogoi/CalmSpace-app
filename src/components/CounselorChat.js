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
} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';
import { getOnlineUsers } from '../utils/getOnlineUsers';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- NEW MODERN UI ---

const CounselorChat = ({ navigation }) => {
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
      // Optionally, show an alert to the user
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
        source={{ uri: item?.pic || 'https://i.pravatar.cc/150' }} // Fallback avatar
        style={styles.avatar}
      />
      <View style={styles.chatTextContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userStatus}>Waiting for you...</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
    </Pressable>
  );

  // Render when the list is empty
  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={70} color="#D1D5DB" />
      <Text style={styles.emptyTextTitle}>No Active Chats</Text>
      <Text style={styles.emptyTextSubtitle}>
        Users who are online and need a Quick Boost will appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderChatItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyListComponent}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']} // For Android
            tintColor="#3B82F6" // For iOS
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // A clean, light background
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatItemPressed: {
    backgroundColor: '#F3F4F6', // Visual feedback on press
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 12,
  },
  chatTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
  },
  userStatus: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -50, // Adjust to center vertically
  },
  emptyTextTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: 'Poppins-Bold',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyTextSubtitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CounselorChat;