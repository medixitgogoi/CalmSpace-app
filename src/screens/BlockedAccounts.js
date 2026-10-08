import React, { useState, useCallback } from 'react';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Platform,
    ToastAndroid,
    Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import axios from 'axios';
import { primary } from '../utils/colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const BlockedAccounts = () => {
    const navigation = useNavigation();
    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Track which user is currently being unblocked to show a specific loader
    const [unblockingId, setUnblockingId] = useState(null);

    const fetchBlockedUsers = async () => {
        try {
            const response = await axios.get('/blockuser', {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authToken,
                },
            });
            setBlockedUsers(response?.data?.data || []);
        } catch (error) {
            console.error('Error fetching blocked users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBlockedUsers();
        }, [authToken])
    );

    const showNativeFeedback = (title, message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert(title, message, [{ text: 'OK' }]);
        }
    };

    const handleUnblockUser = async (userId) => {
        // Start loading for this specific user
        setUnblockingId(userId);
        try {
            const response = await axios.patch(
                "/blockuser/unblock",
                { blockUser: userId },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authToken,
                    },
                }
            );

            if (response.data.status_code === 201) {
                showNativeFeedback('Success', 'User unblocked successfully');
                // Re-fetch the list
                await fetchBlockedUsers();
            }
        } catch (error) {
            console.log('Unblocking failed: ', error);
            showNativeFeedback('Error', 'Failed to unblock user');
        } finally {
            // Stop loading
            setUnblockingId(null);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBlockedUsers();
    }, [authToken]);

    const renderItem = ({ item }) => {
        const isCurrentlyUnblocking = unblockingId === item?.blockUser?._id;

        return (
            <View style={styles.userCard}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#999" />
                    </View>
                    <View>
                        <Text style={styles.userName}>{item?.blockUser?.name || 'Unknown User'}</Text>
                        <Text style={styles.userEmail}>{item?.blockUser?.email || 'No email provided'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.unblockButton, isCurrentlyUnblocking && { backgroundColor: '#F5F5F5' }]}
                    onPress={() => !isCurrentlyUnblocking && handleUnblockUser(item?.blockUser?._id)}
                    disabled={isCurrentlyUnblocking}
                >
                    {isCurrentlyUnblocking ? (
                        <ActivityIndicator size="small" color="#E53935" />
                    ) : (
                        <Text style={styles.unblockText}>Unblock</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const EmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>No Blocked Accounts</Text>
            <Text style={styles.emptySubtitle}>Users you block will appear here.</Text>
        </View>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar animated={true} barStyle={'dark-content'} backgroundColor={'#F8F9FC'} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={isTablet ? 28 : 22} color={'#333'} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Blocked Accounts</Text>
                    <View style={styles.headerButton} />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={primary} />
                    </View>
                ) : (
                    <FlatList
                        data={blockedUsers}
                        keyExtractor={(item) => item._id || item.id}
                        renderItem={renderItem}
                        contentContainerStyle={[styles.listContent, isTablet && styles.tabletContent]}
                        ListEmptyComponent={EmptyComponent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[primary]}
                                tintColor={primary}
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60 },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.3), fontFamily: 'Poppins-SemiBold', color: '#1A1A1A', includeFontPadding: false },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, flexGrow: 1 },
    tabletContent: { width: '70%', alignSelf: 'center' },
    userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    userName: { fontFamily: 'Poppins-SemiBold', fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8), color: '#333', includeFontPadding: false },
    userEmail: { fontFamily: 'Poppins-Regular', fontSize: isTablet ? responsiveFontSize(0.9) : responsiveFontSize(1.4), color: '#777', includeFontPadding: false },
    unblockButton: { backgroundColor: '#FEEBEE', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
    unblockText: { color: '#E53935', fontFamily: 'Poppins-Medium', fontSize: isTablet ? responsiveFontSize(0.9) : responsiveFontSize(1.4), includeFontPadding: false },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.2), color: '#555', includeFontPadding: false, marginTop: 20 },
    emptySubtitle: { fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.6), color: '#999', textAlign: 'center', includeFontPadding: false, marginTop: 5 },
});

export default BlockedAccounts;