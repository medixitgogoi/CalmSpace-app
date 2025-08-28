import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';
import { getChatHistory } from '../utils/getChatHistory';
import moment from 'moment';
import LottieView from 'lottie-react-native';

// Color theme
const primary = '#2D9596';
const secondary = '#F5EDD9';
const background = '#F8F9FC';
const lightPrimary = '#94dfdf';
const cardBackground = '#fff';
const textColor = '#333';
const subtleText = '#6c757d';

const ChatHistory = ({ navigation }) => {
    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!authToken) {
            setData([]);
            return;
        }
        try {
            const result = await getChatHistory(authToken);
            const sortedData = result.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
            setData(sortedData);
        } catch (error) {
            console.log('Error fetching chat history data: ', error);
        }
    }, [authToken]);

    useEffect(() => {
        const initialLoad = async () => {
            setLoading(true);
            await fetchHistory();
            setLoading(false);
        };
        initialLoad();
    }, [fetchHistory]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchHistory();
        setIsRefreshing(false);
    }, [fetchHistory]);

    const renderHistoryItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.counselorInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color={primary} />
                    </View>
                    <Text style={styles.counselorName}>{item.counselorName}</Text>
                </View>
                <Text style={styles.sessionNumber}>Session #{item.sessionNumber}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={'#333'} />
                    <Text style={styles.infoText}>
                        {moment(item.startedAt).format('MMMM Do YYYY, h:mm a')}
                    </Text>
                </View>
                <View style={{ ...styles.infoRow, marginTop: Platform.OS === 'ios' ? 12 : 8 }}>
                    <MaterialCommunityIcons name="timelapse" size={20} color={'#333'} />
                    <Text style={styles.infoText}>{item.duration} minutes</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.amount}>₹{item.amount}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={styles.loadingText}>Fetching History...</Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar
                    animated={true}
                    barStyle={'dark-content'}
                    backgroundColor={background}
                />

                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={20} color={textColor} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chat History</Text>
                    <View style={styles.headerButton} />
                </View>

                <FlatList
                    data={data}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item, index) => `${item._id || item.startedAt}-${index}`}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onRefresh={handleRefresh}
                    refreshing={isRefreshing}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <LottieView
                                source={require('../assets/animations/fallback.json')}
                                autoPlay
                                loop
                                style={styles.lottieEmpty}
                            />
                            <Text style={styles.emptyText}>No chat history found.</Text>
                            {/* Changed the subtext to be more descriptive */}
                            <Text style={styles.emptySubText}>Your past chat sessions will appear here.</Text>
                        </View>
                    )}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default ChatHistory;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        backgroundColor: background,
        borderBottomWidth: 1,
        borderBottomColor: '#EAECEE',
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
        color: textColor,
    },
    listContainer: {
        flexGrow: 1,
        padding: 16,
    },
    card: {
        backgroundColor: cardBackground,
        borderRadius: 22,
        padding: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F4',
        paddingBottom: 9,
    },
    counselorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    counselorName: {
        fontSize: responsiveFontSize(2),
        fontFamily: 'Poppins-SemiBold',
        color: textColor,
    },
    sessionNumber: {
        fontSize: responsiveFontSize(1.6),
        fontFamily: 'Poppins-Medium',
        color: primary,
        backgroundColor: '#c2eded',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardBody: {
        paddingVertical: Platform.OS === 'ios' ? 18 : 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: responsiveFontSize(1.7),
        fontFamily: 'Poppins-Regular',
        color: subtleText,
        marginLeft: 10,
    },
    cardFooter: {
        alignItems: 'flex-end',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F4',
    },
    amount: {
        fontSize: responsiveFontSize(2.2),
        fontFamily: 'Poppins-Bold',
        color: primary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: responsiveFontSize(2),
        fontFamily: 'Poppins-Regular',
        color: subtleText,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottieEmpty: {
        width: 250,
        height: 250,
        marginBottom: 10,
    },
    emptyText: {
        fontFamily: 'Poppins-Medium',
        fontSize: responsiveFontSize(2.2),
        color: '#4F4F4F',
        textAlign: 'center',
    },
    emptySubText: {
        fontFamily: 'Poppins-Regular',
        fontSize: responsiveFontSize(1.8),
        color: '#828282',
        textAlign: 'center',
        marginTop: 8,
    }
});