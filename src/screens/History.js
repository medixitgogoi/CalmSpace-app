import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ToastAndroid,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getHistory } from '../utils/getHistory';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { background, primary } from '../utils/colors';
import Clipboard from '@react-native-clipboard/clipboard';
import LottieView from 'lottie-react-native';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const getInitials = name => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getSessionStatus = (scheduleDate, scheduleTime) => {
  if (!scheduleDate || !scheduleTime) return 'Completed';

  const datePart = new Date(scheduleDate);
  const timeMatch = scheduleTime.match(/(\d+):(\d+)\s(AM|PM)/);
  if (!timeMatch) return 'Completed';

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const meridian = timeMatch[3];

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;

  const scheduleDateTime = new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes);
  const currentTime = new Date();
  const sessionEndTime = new Date(scheduleDateTime.getTime() + 60 * 60 * 1000);

  if (currentTime < scheduleDateTime) return 'Upcoming';
  else if (currentTime >= scheduleDateTime && currentTime <= sessionEndTime) return 'Ongoing';
  else return 'Completed';
};


const History = ({ navigation }) => {
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
      const result = await getHistory(authToken);
      setData(result);
    } catch (error) {
      console.log('Error fetching history data: ', error);
      ToastAndroid.show('Failed to fetch history', ToastAndroid.SHORT);
    }
  }, [authToken]);

  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        setLoading(true);
        await fetchHistory();
        setLoading(false);
      };
      loadInitialData();
    }, [fetchHistory]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  }, [fetchHistory]);

  const handleCopyLink = link => {
    Clipboard.setString(link);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Meeting link copied to clipboard', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Meeting link copied to clipboard');
    }
  };

  const renderItem = ({ item }) => {
    const status = getSessionStatus(item.scheduleDate, item.scheduleTime);

    const statusStyles = {
      Upcoming: { pill: styles.upcomingPill, text: styles.upcomingText },
      Ongoing: { pill: styles.ongoingPill, text: styles.ongoingText },
      Completed: { pill: styles.completedPill, text: styles.completedText },
    };

    const currentStatusStyle = statusStyles[status] || statusStyles.Completed;

    const formattedDate = new Date(item?.scheduleDate).toLocaleDateString(
      'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' },
    );

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.counselorName)}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.counselorName} numberOfLines={1}>
                {item.counselorName}
              </Text>
              <Text style={styles.dateTime}>
                {formattedDate} at {item.scheduleTime}
              </Text>
            </View>
            <View style={[styles.statusPill, currentStatusStyle.pill]}>
              <Text style={[styles.statusText, currentStatusStyle.text]}>
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.linkContainer}>
              <Ionicons name="link-outline" size={isTablet ? 22 : 20} color={'#666'} />
              <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
                {item.meetLink}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCopyLink(item.meetLink)}>
              <Ionicons name="copy-outline" size={isTablet ? 18 : 16} color={primary} />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 20} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking History</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primary} />
            <Text style={styles.loadingText}>Fetching History...</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.orderId}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
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
                <Text style={styles.emptyText}>No booking history found.</Text>
                <Text style={styles.emptySubText}>Please check back later.</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

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
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEE',
    height: isTablet ? 70 : 60,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A1A1A',
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
    color: '#6c757d',
  },
  // --- FIX: List Layout ---
  listContentContainer: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 20,
    // Phones: Horizontal padding for spacing
    // Tablets: No horizontal padding here; we control width in the wrapper
    paddingHorizontal: isTablet ? 0 : 15,
  },
  // --- FIX: Card Layout ---
  cardWrapper: {
    // Phones: Take full width of the container (which has padding)
    // Tablets: Take 92% of the screen width and center itself
    width: isTablet ? '65%' : '100%',
    alignSelf: 'center',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: isTablet ? 55 : 45,
    height: isTablet ? 55 : 45,
    borderRadius: isTablet ? 27.5 : 22.5,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet || Platform.OS === 'android' ? 20 : 15,
  },
  avatarText: {
    color: primary,
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(2),
  },
  headerTextContainer: {
    flex: 1,
  },
  counselorName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(2),
    color: '#1A1A1A',
  },
  dateTime: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.6),
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: isTablet ? responsiveFontSize(0.9) : responsiveFontSize(1.5),
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  linkText: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.7),
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
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.6),
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isTablet ? 50 : 0,
  },
  lottieEmpty: {
    width: isTablet ? 350 : 250,
    height: isTablet ? 350 : 250,
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? responsiveFontSize(1.4) : responsiveFontSize(2.2),
    color: '#4F4F4F',
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    color: '#828282',
    textAlign: 'center',
    marginTop: 8,
  }
});

export default History;