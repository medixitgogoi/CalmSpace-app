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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import moment from 'moment';
import { lightPrimary, primary } from '../../utils/colors';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { getAppointments } from '../../utils/getAppointments';
import Clipboard from '@react-native-clipboard/clipboard';

// Helper function to get initials from a name
const getInitials = name => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// AppointmentCard Component - UPDATED
const AppointmentCard = React.memo(({ item }) => {
    // 1. Define start time, end time, and current time
    const startTime = moment(item.schedule_time, "YYYY-MM-DD [at] hh:mm A");
    const endTime = startTime.clone().add(1, 'hour');
    const now = moment();

    // 2. Helper function to determine the status
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

    // 3. Map status to styles for cleaner rendering
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
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.primaryName} numberOfLines={1}>
                        {item.username}
                    </Text>
                    <Text style={styles.dateTime}>
                        {formattedDateTime}
                    </Text>
                </View>
                {/* 4. Apply dynamic styles based on the current status */}
                <View style={[styles.statusPill, currentStatusStyle.pill]}>
                    <Text style={[styles.statusText, currentStatusStyle.text]}>
                        {status}
                    </Text>
                </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.cardFooter}>
                <View style={styles.linkContainer}>
                    <Ionicons name="link-outline" size={20} color={'#666'} />
                    <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
                        {item.meet_link}
                    </Text>
                </View>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                    <Ionicons name="copy-outline" size={16} color={primary} />
                    <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const Appointments = ({ navigation }) => {
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

                // --- FIX STARTS HERE ---
                // Check if appointmentsData is an array. If not, default to an empty array.
                // This prevents the app from crashing if the API returns null or undefined.
                if (Array.isArray(appointmentsData)) {
                    setAppointments(appointmentsData.reverse());
                } else {
                    setAppointments([]);
                }
                // --- FIX ENDS HERE ---

            } else {
                // If there are no counselor details, there can be no appointments.
                setAppointments([]);
            }

        } catch (error) {
            // This block will now only run for genuine network or server errors.
            console.log('Error fetching screen data: ', error);
            setAppointments([]); // Set empty array on error to clear the list
            if (Platform.OS === 'android') {
                ToastAndroid.show('A network error occurred. Please try again.', ToastAndroid.SHORT);
            } else {
                Alert.alert('Error', 'A network error occurred. Please try again.');
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
                    <Text style={styles.headerTitle}>My Appointments</Text>
                    <View style={styles.headerButton} />
                </View>

                {loading && !isRefreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={primary} />
                    </View>
                ) : !details ? (
                    <View style={styles.centeredScreen}>
                        <Ionicons name="information-circle-outline" size={80} color="#FF6B6B" />
                        <Text style={styles.noticeText}>
                            Please complete your profile before viewing appointments.
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AddDetails')} style={styles.addDetailsButton}>
                            <Ionicons name="person-add-outline" size={22} color="#fff" />
                            <Text style={styles.addDetailsButtonText}>Go to Profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={appointments}
                        renderItem={({ item }) => <AppointmentCard item={item} />}
                        keyExtractor={(item, index) => `${item.email}-${index}`}
                        contentContainerStyle={styles.listContentContainer}
                        onRefresh={handleRefresh}
                        refreshing={isRefreshing}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="calendar-outline" size={80} color="#CBD5E0" style={{ marginBottom: 20 }} />
                                <Text style={styles.emptyText}>No Appointments Found</Text>
                                <Text style={styles.emptySubText}>Your scheduled appointments will appear here.</Text>
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    )
};

export default Appointments;

// StyleSheet - UPDATED
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 8,
        backgroundColor: '#F8F9FC',
        borderBottomWidth: 0.5,
        borderBottomColor: lightPrimary,
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
        shadowColor: '#9FB0C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: primary,
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2),
    },
    headerTextContainer: {
        flex: 1,
    },
    primaryName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(2),
        color: '#1A1A1A',
    },
    dateTime: {
        fontFamily: 'Poppins-Regular',
        color: '#666',
        fontSize: responsiveFontSize(1.6),
    },
    statusPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        marginLeft: 10,
    },
    // UPDATED STATUS STYLES
    upcomingPill: {
        backgroundColor: 'rgba(52, 152, 219, 0.1)', // Light blue
    },
    ongoingPill: {
        backgroundColor: 'rgba(39, 174, 96, 0.1)', // Light green
    },
    completedPill: {
        backgroundColor: '#E9ECEF', // Light grey
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(1.5),
    },
    upcomingText: {
        color: '#3498DB', // Blue
    },
    ongoingText: {
        color: '#27AE60', // Green
    },
    completedText: {
        color: '#828282', // Grey
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
        flex: 1, // Allow it to take available space
    },
    linkText: {
        fontFamily: 'Poppins-Medium',
        fontSize: responsiveFontSize(1.7),
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
        fontSize: responsiveFontSize(1.6),
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    },
    centeredScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F7FC',
        paddingHorizontal: 20,
    },
    noticeText: {
        fontSize: responsiveFontSize(2),
        color: '#2D3748',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        marginTop: 20,
        marginBottom: 25,
        lineHeight: 28
    },
    addDetailsButton: {
        backgroundColor: '#0ea5e9',
        height: responsiveHeight(6.5),
        paddingHorizontal: 30,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        width: '100%'
    },
    addDetailsButtonText: {
        fontSize: responsiveFontSize(2),
        color: '#fff',
        fontFamily: 'Poppins-SemiBold',
        marginLeft: 10,
    },
});