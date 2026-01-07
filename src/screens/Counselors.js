import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';

// Local Imports
import { primary, secondary, background, lightPrimary } from '../utils/colors';
import SlidableSection from '../components/SlidableSection';
import { fetchCounselors } from '../utils/fetchCounselors';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// --- Component: PreferredCounselorCard (Redesigned) ---
const PreferredCounselorCard = React.memo(({ item, navigation, index }) => {
  // Simple fade-in animation on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100, // Staggered entrance
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.prefCardWrapper, { opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => navigation.navigate('CounselorDetails', { counselor: item })}
        style={styles.prefCardContainer}
      >
        {/* "Best Match" Badge */}
        <View style={styles.bestMatchBadge}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.bestMatchText}>Best Match</Text>
        </View>

        <View style={styles.prefCardContent}>
          {/* Avatar Section */}
          <View style={styles.prefAvatarContainer}>
            <Image source={{ uri: item?.counselorId?.pic }} style={styles.prefAvatar} />
            <View style={styles.prefOnlineBadge} />
          </View>

          {/* Info Section */}
          <View style={styles.prefInfo}>
            <Text numberOfLines={1} style={styles.prefName}>{item?.counselorId?.name}</Text>

            <View style={styles.prefRow}>
              <Ionicons name="briefcase-outline" size={14} color="#666" />
              <Text style={styles.prefSubText}>{item?.experience}+ Years Exp.</Text>
            </View>

            <View style={styles.prefRow}>
              <Ionicons name="language-outline" size={14} color="#666" />
              <Text numberOfLines={1} style={styles.prefSubText}>
                {item?.languages?.slice(0, 2).join(', ')}
                {item?.languages?.length > 2 && '...'}
              </Text>
            </View>
          </View>

          {/* Price & Action */}
          <View style={styles.prefAction}>
            <Text style={styles.prefPrice}>₹{item?.priceId?.video}</Text>
            <TouchableOpacity style={styles.prefBookBtn}>
              <Ionicons name="arrow-forward" size={18} color={primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- Component: PreferredCounselorsCarousel (Redesigned) ---
const PreferredCounselorsCarousel = ({ data, navigation, onClear }) => {
  return (
    <View style={styles.carouselContainer}>
      {/* Header Section */}
      <View style={styles.carouselHeader}>
        <View>
          <Text style={styles.carouselTitle}>Recommended for You</Text>
          <Text style={styles.carouselSubtitle}>Based on your preferences</Text>
        </View>

        <TouchableOpacity onPress={onClear} style={styles.clearFilterBtn}>
          <Text style={styles.clearFilterText}>Clear Filters</Text>
          <Ionicons name="close-circle-outline" size={18} color={primary} />
        </TouchableOpacity>
      </View>

      {/* Grid List for Tablet, Horizontal for Mobile */}
      <FlatList
        data={data}
        key={isTablet ? 'pref-grid' : 'pref-list'}
        keyExtractor={(item) => item?._id}
        renderItem={({ item, index }) => (
          <PreferredCounselorCard item={item} navigation={navigation} index={index} />
        )}
        horizontal={!isTablet} // Vertical grid on tablet, Horizontal scroll on phone
        numColumns={isTablet ? 2 : 1} // 2 columns on tablet
        columnWrapperStyle={isTablet ? styles.prefColumnWrapper : null}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselListContent}
        ItemSeparatorComponent={() => <View style={{ width: 15, height: 15 }} />}
      />
    </View>
  );
};

// --- Component: CounselorCard (Standard List) ---
const CounselorCard = React.memo(({ item, navigation }) => {
  const genderIcon = item?.counselorId?.gender === 'male' ? 'mars' : 'venus';
  const genderColor = item?.counselorId?.gender === 'male' ? '#2196F3' : '#E91E63';

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CounselorDetails', { counselor: item })}
        style={styles.cardContainer}>

        {/* Top Section */}
        <View style={styles.cardTop}>
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: item?.counselorId?.pic }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={[styles.genderBadge, { backgroundColor: secondary }]}>
              <FontAwesome name={genderIcon} size={isTablet ? 14 : 12} color={genderColor} />
            </View>
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text allowFontScaling={true} numberOfLines={1} style={styles.cardName}>
                {item?.counselorId?.name}
              </Text>
              <Ionicons name="checkmark-circle" size={isTablet ? 20 : 16} color={primary} style={styles.verifiedIcon} />
            </View>

            <View style={styles.expRow}>
              <View style={styles.expBadge}>
                <Ionicons name="briefcase" size={isTablet ? 14 : 12} color={primary} />
                <Text style={styles.expText}>
                  {item.experience}+ Years Exp.
                </Text>
              </View>
            </View>

            <View style={styles.tagsRow}>
              {item?.speciality?.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{specialty}</Text>
                </View>
              ))}
              {item?.speciality?.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.speciality.length - 3} more</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Session Price</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹500</Text>
              <Text style={styles.oldPrice}>₹600</Text>
            </View>
          </View>

          <LinearGradient
            colors={[primary, '#4DB6AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginRight: 15 }} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
});

// --- Main Screen ---
const Counselors = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [counselors, setCounselors] = useState([]);
  const [preferredCounselors, setPreferredCounselors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counselorsLoading, setCounselorsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleListUpdate = useCallback((data) => {
    setPreferredCounselors(data);
    setCounselorsLoading(false);
  }, []);

  useEffect(() => {
    if (counselors.length === 0) {
      const fetchInitialData = async () => {
        setLoading(true);
        setHasMore(true);
        setPage(1);
        try {
          const data = await fetchCounselors(authToken, 1, 10);
          setCounselors(data || []);
          setPage(2);
          setHasMore(data?.length === 10);
        } catch (error) {
          console.log('Error fetching counselors:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [authToken]);

  const loadMoreCounselors = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchCounselors(authToken, page, 10);
      if (data && data?.length > 0) {
        setCounselors(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        setHasMore(data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log('Error loading more: ', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, authToken, page]);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.listHeaderContainer}>
        {counselorsLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : preferredCounselors ? (
          <PreferredCounselorsCarousel
            data={preferredCounselors}
            navigation={navigation}
            onClear={() => setPreferredCounselors(null)}
          />
        ) : (
          <SlidableSection
            onFinish={handleListUpdate}
            setCounselorsLoading={setCounselorsLoading}
            counselors={counselors}
          />
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text allowFontScaling={true} style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.browseHeader}>
          {/* <MaterialCommunityIcons name="book-search-outline" size={isTablet ? 32 : 28} color={primary} style={{ marginRight: 8 }} /> */}
          <Text allowFontScaling={true} style={styles.browseText}>
            Browse our expert counselors and book a session.
          </Text>
        </View>
      </View>
    );
  }, [counselorsLoading, preferredCounselors, navigation, counselors, handleListUpdate]);

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="search" size={isTablet ? responsiveFontSize(6) : responsiveFontSize(8)} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>No Counselors Found</Text>
        <Text style={styles.emptySubtitle}>
          Please try adjusting your search filters or check back later.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar animated={true} barStyle={'dark-content'} backgroundColor="#fff" />

        <View style={styles.screenHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={'#333'} />
          </TouchableOpacity>
          <Text allowFontScaling={true} style={styles.headerTitle}>
            Find Your Counselor
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && counselors.length === 0 ? (
          <View style={styles.fullScreenLoader}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : (
          <FlatList
            key={'counselor-list'}
            data={counselors}
            keyExtractor={(item) => item?._id}
            renderItem={({ item }) => <CounselorCard item={item} navigation={navigation} />}

            // Force 1 column for main list (cards are full width in their container)
            numColumns={1}

            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            onEndReached={loadMoreCounselors}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            contentContainerStyle={isTablet ? styles.tabletListContent : styles.listContent}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={primary} style={{ marginVertical: 20 }} />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    height: isTablet ? 70 : undefined,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A1A1A',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 90 : 70,
  },
  tabletListContent: {
    paddingTop: 16,
    paddingBottom: 100,
    width: '70%',
    alignSelf: 'center',
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeaderContainer: {
    paddingBottom: 10,
  },
  loaderContainer: {
    height: responsiveHeight(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.4) : responsiveFontSize(1.8),
    color: '#9E9E9E',
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  browseText: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#424242',
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.8) : responsiveFontSize(2.2),
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.4) : responsiveFontSize(1.8),
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // --- Preferred Section Styles (Redesigned) ---
  carouselContainer: {
    marginBottom: 10,
    paddingTop: 10,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  carouselTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.0),
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  carouselSubtitle: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  clearFilterText: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.4),
    fontFamily: 'Poppins-Medium',
    color: primary,
  },
  carouselListContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  prefColumnWrapper: {
    justifyContent: 'space-between',
  },

  // --- Preferred Card (Redesigned) ---
  prefCardWrapper: {
    width: isTablet ? '48%' : responsiveWidth(80), // Fixed width on mobile for carousel
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  prefCardContainer: {
    // padding: 12,
  },
  bestMatchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  bestMatchText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    includeFontPadding: false,
  },
  prefCardContent: {
    padding: 14,
    paddingTop: 35, // Space for badge
  },
  prefAvatarContainer: {
    alignSelf: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  prefAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  prefOnlineBadge: {
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  prefInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  prefName: {
    fontSize: isTablet ? responsiveFontSize(1.3) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  prefSubText: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  prefAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  prefPrice: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Bold',
    color: primary,
  },
  prefBookBtn: {
    backgroundColor: '#F0FDFA',
    padding: 8,
    borderRadius: 10,
  },

  // --- Standard Card Styles ---
  cardWrapper: {
    width: '100%',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: isTablet ? 0 : 16,
    padding: isTablet ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  cardImageContainer: {
    width: isTablet ? 100 : 85,
    height: isTablet ? 100 : 85,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  genderBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: isTablet ? responsiveFontSize(1.4) : responsiveFontSize(2),
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  expRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  expText: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.4),
    fontFamily: 'Poppins-Medium',
    color: primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  tagText: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#757575',
  },
  moreTagsText: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#757575',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#757575',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  currentPrice: {
    fontSize: isTablet ? responsiveFontSize(1.6) : responsiveFontSize(2.2),
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
  },
  oldPrice: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: responsiveHeight(5.2),
    borderRadius: 25,
    gap: 8,
  },
  bookButtonText: {
    fontSize: isTablet ? responsiveFontSize(1.3) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 20
  },
});

export default Counselors;