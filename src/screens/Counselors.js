import React, { useState, useCallback, useRef, useEffect } from 'react'; // Ensure useEffect is imported
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { primary, secondary, background } from '../utils/colors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import SlidableSection from '../components/SlidableSection';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchCounselors } from '../utils/fetchCounselors';
import { useSelector } from 'react-redux';
// useFocusEffect is no longer needed unless for other purposes
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// CounselorCard and PreferredCounselorCard components remain unchanged...
const CounselorCard = ({ item, navigation }) => {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CounselorDetails', { counselor: item })}
      style={{
        backgroundColor: '#fcfcfc',
        padding: 12,
        borderRadius: 22,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginHorizontal: 10
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 15 }}>
        <View style={{ flex: 0.7, backgroundColor: '#dbf4f4', borderRadius: 20 }}>
          <View style={{ width: '100%', aspectRatio: 1 }}>
            <Image
              source={{ uri: item?.counselorId?.pic }}
              style={{ width: '100%', height: '100%', borderRadius: 18 }}
              resizeMode="cover"
            />
            {item?.counselorId?.gender && (
              <View style={{ position: 'absolute', top: 1, left: 0, backgroundColor: secondary, borderRadius: 40, padding: 4 }}>
                <Icon name={item.counselorId.gender === 'male' ? 'mars' : 'venus'} size={18} color="#000" />
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginVertical: 5, marginHorizontal: 4 }}>
            <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-SemiBold', color: '#000', paddingTop: 2 }}>
              {item?.counselorId?.name}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <View style={{ flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
            <View style={{ backgroundColor: primary, width: '100%', justifyContent: 'center', flexDirection: 'row', paddingVertical: 4, borderRadius: 9, borderColor: primary, borderWidth: 0.5 }}>
              <Ionicons name="medkit" size={17} color={'#fff'} style={{ marginRight: 5 }} />
              <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-SemiBold', color: '#fff' }}>
                Expertise
              </Text>
            </View>
            <View style={{ gap: 6, flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' }}>
              {item?.speciality?.map((specialty, index) => (
                <View key={index} style={{ backgroundColor: '#c2ecec', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                  <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.4), fontFamily: 'Poppins-Medium', color: '#000' }}>
                    ✔ {specialty}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
      <LinearGradient colors={[secondary, '#c2e9fb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 100, marginTop: 10, height: 42 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', height: '100%' }}>
          <Ionicons name="wallet" size={17} color="#000" />
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.9), fontFamily: 'Poppins-Regular', color: '#000', paddingTop: 3 }}>
            Book a session at{' '}
            <Text allowFontScaling={true} style={{ fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2), color: '#000' }}>
              ₹500
            </Text>
            {` `}
            <Text allowFontScaling={true} style={{ fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.4), color: '#000', textDecorationLine: 'line-through' }}>
              ₹600
            </Text>
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const PreferredCounselorCard = ({ item, navigation, isActive }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.85)).current;
  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 1 : 0.85,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CounselorDetails', { counselor: item })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: '#fcfcfc',
        padding: 13,
        borderRadius: 20,
        alignSelf: 'center',
        width: width * 0.9,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginHorizontal: responsiveWidth(2),
        opacity: isActive ? 1 : 0.7,
        transform: [{ scale: scaleAnim }],
      }}>
      <View style={{ width: responsiveWidth(32), aspectRatio: 0.9, borderRadius: 20, overflow: 'hidden' }}>
        <Image source={{ uri: item?.counselorId?.pic }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="person" size={17} color="#000" />
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.9), fontFamily: 'Poppins-SemiBold', color: '#000', paddingTop: 2, width: '68%', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
            {item?.counselorId?.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', width: '84%' }}>
          <Ionicons name="chatbubble-ellipses" size={17} color={'#000'} style={{ marginTop: 2 }} />
          <View style={{ gap: 6, flexDirection: 'row', flexWrap: 'wrap', width: '72%' }}>
            {item.languages.map((lang, index) => (
              <View key={index} style={{ backgroundColor: primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 1, paddingBottom: Platform.OS === 'ios' ? 4 : 2 }}>
                <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.4), fontFamily: 'Poppins-Medium', color: '#fff', paddingTop: 3 }}>
                  {lang}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="briefcase" size={17} color="#000" />
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.9), fontFamily: 'Poppins-SemiBold', color: primary, paddingTop: 3 }}>
            {item?.experience}+ years
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="wallet" size={17} color="#000" />
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.9), fontFamily: 'Poppins-SemiBold', color: primary, paddingTop: 3 }}>
            ₹{item?.priceId?.video}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PreferredCounselorsCarousel = ({ data, navigation, onClear }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    setActiveSlide(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
  }, [data]);

  const handleScroll = useCallback(event => {
    const slideSize = width * 0.9 + responsiveWidth(4);
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / slideSize);
    setActiveSlide(index);
  }, []);

  return (
    <View style={{ paddingHorizontal: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', borderRadius: 13, marginHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#beebeb', flex: 1, paddingVertical: 8, borderRadius: 10, paddingHorizontal: 12 }}>
          <MaterialCommunityIcons name="account-star-outline" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text allowFontScaling={true} style={{ fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(1.8), color: '#000', textTransform: 'capitalize', letterSpacing: 0.5, paddingTop: 3 }}>
            Your Matched <Text style={{ color: primary }}>Counselors</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClear}
          style={{ backgroundColor: secondary, borderRadius: 100, width: responsiveWidth(10), flexDirection: 'row', aspectRatio: 1 / 1, alignItems: 'center', justifyContent: 'center', marginLeft: 10, elevation: 1 }}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={item => item?.id}
        renderItem={({ item, index }) => <PreferredCounselorCard item={item} navigation={navigation} isActive={index === activeSlide} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 15, paddingHorizontal: responsiveWidth(4) }}
        snapToInterval={width * 0.9 + responsiveWidth(4)}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {data.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 5 }}>
          {data.map((_, index) => (
            <View key={index} style={{ height: 7, width: 7, borderRadius: 4, backgroundColor: index === activeSlide ? primary : '#ccc', marginHorizontal: 4 }} />
          ))}
        </View>
      )}
    </View>
  );
};


// --- Main Counselors Component ---
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

  // FIX: Changed useFocusEffect to useEffect to prevent re-fetching on focus.
  // This hook now runs only once when the component mounts.
  useEffect(() => {
    // We only fetch if the counselor list is empty to avoid re-fetching on mount
    // if data already exists from a previous state.
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
  }, [authToken]); // Dependency array ensures it runs if the user logs in/out.

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
      console.log('Error loading more counselors: ', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, authToken, page]);

  const renderHeader = useCallback(() => {
    return (
      <View style={{ paddingBottom: 20 }}>
        {counselorsLoading ? (
          <View style={{ height: responsiveHeight(25), justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : preferredCounselors ? (
          <PreferredCounselorsCarousel
            data={preferredCounselors}
            navigation={navigation}
            onClear={() => setPreferredCounselors(null)}
          />
        ) : (
          <SlidableSection onFinish={handleListUpdate} setCounselorsLoading={setCounselorsLoading} counselors={counselors} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 15 : 10, paddingHorizontal: 10, marginTop: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
          <Text allowFontScaling={true} style={{ marginHorizontal: 10, fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(1.8), color: '#888' }}>Or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 5 }}>
          <MaterialCommunityIcons name="book-search-outline" size={30} color={primary} style={{ marginRight: 8 }} />
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Medium', color: '#333', flex: 1 }}>
            Browse through our list of expert counselors and book a session that fits your needs.
          </Text>
        </View>
      </View>
    );
  }, [counselorsLoading, preferredCounselors, navigation, counselors, handleListUpdate]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: background, paddingBottom: 0 }}>
        <StatusBar animated={true} barStyle={'dark-content'} hidden={false} backgroundColor={'#fff'} />

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35, height: 35, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={20} color={'#333'} />
          </TouchableOpacity>
          <Text allowFontScaling={true} style={{ fontSize: responsiveFontSize(2.2), fontFamily: 'Poppins-SemiBold', color: '#000', paddingTop: 2 }}>
            Find Your Counselor
          </Text>
          <View style={{ width: 35, height: 35 }}></View>
        </View>

        <FlatList
          data={counselors}
          keyExtractor={(item) => item?._id}
          renderItem={({ item }) => <CounselorCard item={item} navigation={navigation} />}
          ListHeaderComponent={renderHeader}
          onEndReached={loadMoreCounselors}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingTop: 5, paddingHorizontal: 0, paddingBottom: Platform.OS === 'android' ? 90 : 70 }}
          ListFooterComponent={
            <>
              {loadingMore && <ActivityIndicator size="small" />}
              {!loadingMore && hasMore && counselors.length > 0 && (
                <TouchableOpacity onPress={loadMoreCounselors} style={{ padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: primary, fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(2) }}>
                    Load more data
                  </Text>
                </TouchableOpacity>
              )}
            </>
          }
          ListEmptyComponent={
            loading ? (
              // Still show loader when fetching initial data
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              // Show fallback UI with inline styles
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, marginTop: -50 }}>
                <Ionicons name="search" size={responsiveFontSize(8)} color="#A9A9A9" />

                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(2.2), color: '#333333', marginTop: 20 }}>
                  No Counselors Found
                </Text>

                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.8), color: '#666666', textAlign: 'center', marginTop: 8 }}>
                  Please try adjusting your search filters or check back later.
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Counselors;