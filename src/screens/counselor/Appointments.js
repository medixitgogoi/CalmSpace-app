import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    ToastAndroid,
    Platform,
    Alert,
    useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import moment from 'moment';
import { lightPrimary, primary } from '../../utils/colors';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { getAppointments } from '../../utils/getAppointments';
import Clipboard from '@react-native-clipboard/clipboard';

// --- Constants ---
const MAX_CONTENT_WIDTH = 600;

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
    return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

// Helper function to get initials
const getInitials = name => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// --- AppointmentCard Component ---
const AppointmentCard = React.memo(({ item, isTablet }) => {
    const { width } = useWindowDimensions();
    const fSize = (s) => getAdaptiveFontSize(s, width);

    const startTime = moment(item.schedule_time, "YYYY-MM-DD [at] hh:mm A");
    const endTime = startTime.clone().add(1, 'hour');
    const now = moment();

    const getSessionStatus = () => {
        if (now.isBefore(startTime)) {
            return 'Upcoming';
        } else if (now.isBetween(startTime, endTime)) {
            return 'Ongoing';
        } else {
            return 'Completed';
        }
    };

    const status = getSessionStatus();
    const formattedDateTime = `${startTime.format('MMM D, YYYY')} at ${startTime.format('hh:mm A')}`;

    const statusStyles = {
        Upcoming: { pill: styles.upcomingPill, text: styles.upcomingText },
        Ongoing: { pill: styles.ongoingPill, text: styles.ongoingText },
        Completed: { pill: styles.completedPill, text: styles.completedText },
    };
    const currentStatusStyle = statusStyles[status];

    const handleCopyLink = () => {
        Clipboard.setString(item.meet_link);
        if (Platform.OS === 'android') {
            ToastAndroid.show('Meeting link copied to clipboard', ToastAndroid.SHORT);
        } else {
            Alert.alert('Copied!', 'Meeting link copied to clipboard!');
        }
    };

    return (
        <View style={styles.card}>
            {/* Header: Avatar + Name + Status */}
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { width: isTablet ? 60 : 45, height: isTablet ? 60 : 45 }]}>
                    <Text style={[styles.avatarText, { fontSize: fSize(isTablet ? 1.8 : 2) }]}>{getInitials(item.username)}</Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.primaryName, { fontSize: fSize(2) }]} numberOfLines={1}>
                        {item.username}
                    </Text>
                    <Text style={[styles.dateTime, { fontSize: fSize(1.6) }]}>
                        {formattedDateTime}
                    </Text>
                </View>

                <View style={[styles.statusPill, currentStatusStyle.pill]}>
                    <Text style={[styles.statusText, currentStatusStyle.text, { fontSize: fSize(1.5) }]}>
                        {status}
                    </Text>
                </View>
            </View>

            <View style={styles.separator} />

            {/* Footer: Link + Copy Button */}
            <View style={styles.cardFooter}>
                <View style={styles.linkContainer}>
                    <Ionicons name="link-outline" size={20} color={'#666'} />
                    <Text style={[styles.linkText, { fontSize: fSize(1.7) }]} numberOfLines={1} ellipsizeMode="tail">
                        {item.meet_link}
                    </Text>
                </View>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                    <Ionicons name="copy-outline" size={16} color={primary} />
                    <Text style={[styles.actionButtonText, { fontSize: fSize(1.6) }]}>Copy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// --- Main Component ---
const Appointments = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const fSize = (s) => getAdaptiveFontSize(s, width);

    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [details, setDetails] = useState(null);

    const fetchScreenData = useCallback(async () => {
        if (!isRefreshing) {
            setLoading(true);
        }
        try {
            const counselorDetails = await getCounselorByID(authToken);
            setDetails(counselorDetails);

            if (counselorDetails) {
                const appointmentsData = await getAppointments(authToken, counselorDetails.counselorId._id);
                if (Array.isArray(appointmentsData)) {
                    setAppointments(appointmentsData.reverse());
                } else {
                    setAppointments([]);
                }
            } else {
                setAppointments([]);
            }
        } catch (error) {
            console.log('Error fetching screen data: ', error);
            setAppointments([]);
            if (Platform.OS === 'android') {
                ToastAndroid.show('A network error occurred.', ToastAndroid.SHORT);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [authToken, isRefreshing]);

    useFocusEffect(
        useCallback(() => {
            fetchScreenData();
        }, [fetchScreenData])
    );

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchScreenData();
    }, [fetchScreenData]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar
                    animated={true}
                    barStyle={'dark-content'}
                    backgroundColor={'#F8F9FC'}
                />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={25} color={'#333'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontSize: fSize(2.3) }]}>My Appointments</Text>
                    <View style={styles.headerButtonPlaceholder} />
                </View>

                {loading && !isRefreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={primary} />
                    </View>
                ) : !details ? (
                    // --- Empty State / No Profile ---
                    <View style={styles.centeredScreen}>
                        <Ionicons name="information-circle-outline" size={isTablet ? 100 : 80} color="#FF6B6B" />
                        <Text style={[styles.noticeText, { fontSize: fSize(2) }]}>
                            Please complete your profile before viewing appointments.
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddDetails')}
                            style={[styles.addDetailsButton, { width: isTablet ? 300 : '100%' }]}
                        >
                            <Ionicons name="person-add-outline" size={22} color="#fff" />
                            <Text style={[styles.addDetailsButtonText, { fontSize: fSize(2) }]}>Go to Profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // --- List of Appointments ---
                    <View style={{ flex: 1, width: isTablet ? MAX_CONTENT_WIDTH : '100%', alignSelf: 'center' }}>
                        <FlatList
                            data={appointments}
                            renderItem={({ item }) => <AppointmentCard item={item} isTablet={isTablet} />}
                            keyExtractor={(item, index) => `${item.email}-${index}`}
                            contentContainerStyle={styles.listContentContainer}
                            onRefresh={handleRefresh}
                            refreshing={isRefreshing}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="calendar-outline" size={isTablet ? 100 : 80} color="#CBD5E0" style={{ marginBottom: 20 }} />
                                    <Text style={[styles.emptyText, { fontSize: fSize(2.2) }]}>No Appointments Found</Text>
                                    <Text style={[styles.emptySubText, { fontSize: fSize(1.8) }]}>Your scheduled appointments will appear here.</Text>
                                </View>
                            )}
                        />
                    </View>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    )
};

export default Appointments;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 10,
        backgroundColor: '#F8F9FC',
        borderBottomWidth: 0.5,
        borderBottomColor: lightPrimary,
    },
    headerButton: {
        padding: 5,
    },
    headerButtonPlaceholder: {
        width: 35, // Matches icon size + padding roughly
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: '#1A1A1A',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FC',
    },
    listContentContainer: {
        flexGrow: 1,
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        // Modern Shadow
        shadowColor: '#9FB0C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 99,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: primary,
        fontFamily: 'Poppins-Bold',
    },
    headerTextContainer: {
        flex: 1,
    },
    primaryName: {
        fontFamily: 'Poppins-SemiBold',
        color: '#1A1A1A',
    },
    dateTime: {
        fontFamily: 'Poppins-Regular',
        color: '#666',
        marginTop: 5
    },
    statusPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        marginLeft: 10,
    },
    upcomingPill: {
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
    },
    ongoingPill: {
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
    },
    completedPill: {
        backgroundColor: '#E9ECEF',
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
    },
    upcomingText: {
        color: '#3498DB',
    },
    ongoingText: {
        color: '#27AE60',
    },
    completedText: {
        color: '#828282',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        flex: 1,
    },
    linkText: {
        fontFamily: 'Poppins-Medium',
        color: '#333',
        marginLeft: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    actionButtonText: {
        color: primary,
        fontFamily: 'Poppins-SemiBold',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyText: {
        fontFamily: 'Poppins-Medium',
        color: '#4F4F4F',
        textAlign: 'center',
    },
    emptySubText: {
        fontFamily: 'Poppins-Regular',
        color: '#828282',
        textAlign: 'center',
        marginTop: 8,
    },
    centeredScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F7FC',
        paddingHorizontal: 20,
    },
    noticeText: {
        color: '#2D3748',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        marginTop: 20,
        marginBottom: 25,
        lineHeight: 28,
        maxWidth: 400
    },
    addDetailsButton: {
        backgroundColor: '#0ea5e9',
        height: 50,
        paddingHorizontal: 30,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    addDetailsButtonText: {
        color: '#fff',
        fontFamily: 'Poppins-SemiBold',
        marginLeft: 10,
    },
});