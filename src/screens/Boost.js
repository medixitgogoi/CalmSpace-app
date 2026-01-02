import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  StatusBar,
  TouchableOpacity,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  TextInput,
  Platform,
  Alert,
  Dimensions, // Import Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { connectSocket } from '../redux/socketSlice';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchCounselors } from '../utils/fetchCounselors';
import { primary } from '../utils/colors';
import axios from 'axios';
import InfoModal from '../components/InfoModal';
import ConfirmationModal from '../components/ConfirmationModal';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// A custom hook for debouncing input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Boost = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const flatListRef = useRef(null);
  const isInitialMount = useRef(true);

  const [allCounselors, setAllCounselors] = useState([]);
  const [onlineCounselors, setOnlineCounselors] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLimitModalVisible, setLimitModalVisible] = useState(false);
  const [isExpiredModalVisible, setExpiredModalVisible] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);

  const [loadingCounselorId, setLoadingCounselorId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    dispatch(connectSocket({ userId: userDetails?._id }));
  }, [dispatch, userDetails?._id]);

  // Effect to filter counselors
  useEffect(() => {
    const online = allCounselors.filter(c => c.status === 'online');
    if (debouncedSearchQuery) {
      const filtered = online.filter(c =>
        c.counselorId?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setOnlineCounselors(filtered);
    } else {
      setOnlineCounselors(online);
    }
  }, [debouncedSearchQuery, allCounselors]);

  // Effect to scroll to top when a search is performed
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [debouncedSearchQuery]);

  const fetchCounselorsPage = async (pageNumber) => {
    try {
      const data = await fetchCounselors(authToken, pageNumber, 10);
      return data || [];
    } catch (error) {
      console.error("Error in fetchCounselorsPage:", error);
      return [];
    }
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setHasMore(true);
    const initialPage = 1;
    const data = await fetchCounselorsPage(initialPage);
    setAllCounselors(data);
    setPage(initialPage + 1);
    setHasMore(data.length === 10);
    setLoading(false);
  }, [authToken]);

  const loadMoreCounselors = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const data = await fetchCounselorsPage(page);
    if (data.length > 0) {
      setAllCounselors(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
      setHasMore(data.length === 10);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [page, hasMore, loadingMore, authToken]);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery('');
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  const renderHighlightedName = (name, query) => {
    if (!query || !name) {
      return <Text style={styles.counselorName} numberOfLines={1}>{name}</Text>;
    }
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = name.split(regex);
    return (
      <Text style={styles.counselorName} numberOfLines={1}>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  const renderCounselor = ({ item }) => {
    const id = item?.counselorId?._id;
    const isCurrentlyLoading = loadingCounselorId === id;

    const onPayToChatButtonPressed = async () => {
      setLoadingCounselorId(id);
      setSelectedCounselor(item?.counselorId);

      try {
        const url = `/payment/paymentstatus/${id}`;
        const response = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken,
          },
        });

        console.log('responseData: ', response);

        const responseData = response?.data;
        let hasPassed24Hours = false;

        // Check if firstSessionTime exists in the response
        if (responseData?.firstSessionTime) {
          const firstSessionTimeStr = responseData.firstSessionTime;
          const [datePart, timePart] = firstSessionTimeStr.split(', ');
          const [day, month, year] = datePart.split('/');

          const isoDateString = `${year}-${month}-${day}T${timePart}`;
          const firstSessionDate = new Date(isoDateString);

          if (!isNaN(firstSessionDate.getTime())) {
            const now = new Date();
            const differenceInMs = now.getTime() - firstSessionDate.getTime();
            const twentyFourHoursInMs = 86400000;
            hasPassed24Hours = differenceInMs > twentyFourHoursInMs;
          } else {
            console.error("Failed to parse the date:", firstSessionTimeStr);
          }
        }

        console.log('hasPassed24Hours: ', hasPassed24Hours);

        if (responseData) {
          if (hasPassed24Hours) {
            navigation.navigate('BoostPayment', {
              id: id,
              name: item?.counselorId?.name,
              pic: item?.counselorId?.pic,
              amount: 99
            });
          } else {
            if (!responseData?.isExpired) {
              navigation.navigate('BoostChat', {
                id: id,
                name: item?.counselorId?.name,
                pic: item?.counselorId?.pic,
                expiredAt: responseData.expiredAt,
                sessionNumber: responseData.sessionNumber,
              });
            } else {
              if (responseData?.sessionNumber >= 3) {
                setLimitModalVisible(true);
              } else {
                setExpiredModalVisible(true);
              }
            }
          }
        } else {
          Alert.alert("Error", "Could not retrieve session details. Please try again.");
        }
      } catch (error) {
        console.log('error: ', error);

        if (error?.response && error?.response?.status === 404) {
          navigation.navigate('BoostPayment', {
            id: id,
            name: item?.counselorId?.name,
            pic: item?.counselorId?.pic,
            amount: 99
          });
        } else {
          console.error("An error occurred during payment status check:", error);
          Alert.alert("Error", "Could not check payment status. Please try again later.");
        }
      } finally {
        setLoadingCounselorId(null);
      }
    };

    return (
      // --- 2. Card Wrapper for Tablet Constraint ---
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image
              source={{ uri: item?.counselorId?.pic }}
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              {renderHighlightedName(item?.counselorId?.name, debouncedSearchQuery)}
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="sparkles-outline" style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={2}>
                {item.speciality?.join(', ') || 'General Wellness'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Quick Boost Session: <Text style={{ fontFamily: 'Poppins-Bold' }}>₹99</Text>
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.chatButton, pressed && styles.chatButtonPressed]}
            onPress={onPayToChatButtonPressed}
            disabled={loadingCounselorId !== null}
          >
            {isCurrentlyLoading ? <ActivityIndicator size={'small'} color={'#fff'} /> : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={isTablet ? 24 : 22} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Initiate Session</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const renderListFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={primary} />;
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name={searchQuery ? "search-outline" : "moon-outline"} size={isTablet ? 120 : 80} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{searchQuery ? "No Match Found" : "No Counselors Online"}</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? "Try a different name or clear the search." : "Please check back later or pull down to refresh."}
      </Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle='dark-content' backgroundColor='#F9FAFB' />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 22} color={'#1F2937'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Boost</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by counselor name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centeredScreen}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={onlineCounselors}
            renderItem={renderCounselor}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreCounselors}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[primary]}
                tintColor={'#2563EB'}
              />
            }
          />
        )}

        <InfoModal
          visible={isLimitModalVisible}
          title="Daily Limit Reached"
          message="You have reached your daily session quota. You can purchase a new session 24 hours after your first session."
          onClose={() => setLimitModalVisible(false)}
        />

        <ConfirmationModal
          visible={isExpiredModalVisible}
          title="Session Expired"
          message="Your 20-minute session has ended. Please make another payment to start a new session."
          confirmText="Pay Now"
          cancelText="Later"
          onCancel={() => setExpiredModalVisible(false)}
          onConfirm={() => {
            setExpiredModalVisible(false);
            if (selectedCounselor) {
              navigation.navigate('BoostPayment', {
                id: selectedCounselor._id,
                name: selectedCounselor.name,
                pic: selectedCounselor.pic,
                amount: 199
              });
            }
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 3,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: isTablet ? 70 : undefined,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.3),
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  searchContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 15 : 13,
    paddingHorizontal: Platform.OS === 'ios' ? 15 : 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // --- Tablet Fix: Constrain Search Width ---
    width: isTablet ? '70%' : '100%',
    alignSelf: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.9),
    fontFamily: 'Poppins-Regular',
    color: '#1F2937',
  },
  clearButton: {
    paddingLeft: 8,
  },
  listContainer: {
    paddingHorizontal: isTablet ? 0 : 16, // Tablet handles horizontal spacing via wrapper
    paddingTop: 15,
    paddingBottom: responsiveHeight(13),
  },
  // --- Tablet Fix: Card Wrapper ---
  cardWrapper: {
    width: isTablet ? '70%' : '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: isTablet ? 20 : 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'red',
    marginBottom: isTablet ? 10 : 0,
  },
  avatar: {
    width: isTablet ? 80 : 64,
    height: isTablet ? 80 : 64,
    borderRadius: isTablet ? 40 : 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  counselorName: {
    fontSize: isTablet ? responsiveFontSize(1.3) : responsiveFontSize(2.1),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  highlightedText: {
    backgroundColor: '#A7F3D0',
    fontFamily: 'Poppins-Bold',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#047857',
  },
  cardBody: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: isTablet ? 20 : 10,
    marginTop: isTablet ? 10 : 0,
  },
  infoIcon: {
    fontSize: isTablet ? 22 : 18,
    color: primary,
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    lineHeight: isTablet ? 26 : 22,
  },
  chatButton: {
    backgroundColor: primary,
    borderRadius: 14,
    height: isTablet ? responsiveHeight(5) : responsiveHeight(6),
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  chatButtonPressed: {
    backgroundColor: '#38babb',
  },
  chatButtonText: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: responsiveHeight(50),
  },
  emptyTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Boost;