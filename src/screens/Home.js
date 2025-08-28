import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Alert,
  Platform,
  Image,
  StyleSheet,
  Animated,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { background, primary, secondary } from '../utils/colors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Quiz from '../components/Quiz';
import Features from '../components/Features';
import React, { useCallback, useEffect, useState, memo, useRef } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { fetchUserData } from '../utils/fetchUserData';
import { useDispatch, useSelector } from 'react-redux';
import ProgressBar from '../components/ProgressBar';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { connectSocket } from '../redux/socketSlice';
import { addUser } from '../redux/UserSlice';
import { fetchBlogs } from '../utils/fetchBlogs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Feature Card Component (MODIFIED to accept onPress) ---
const FeatureCard = memo(({ iconName, title, description, colors, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
    <LinearGradient colors={colors} style={styles.featureCard}>
      <Ionicons name={iconName} size={responsiveFontSize(4)} color="#fff" />
      <View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

// --- Service Features Section (MODIFIED to handle navigation) ---
const ServiceFeatures = memo(({ navigation }) => {
  return (
    <View style={styles.serviceFeaturesContainer}>
      <View style={styles.serviceTitleContainer}>
        <View style={styles.titleDecoratorLine} />
        <View>
          <Text style={styles.serviceFeaturesTitle}>Must Try Features</Text>
          <Text style={styles.serviceFeaturesSubtitle}>Explore tools designed for your well-being.</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: Platform.OS === 'ios' ? 0 : 20, paddingRight: 10 }}>
        <FeatureCard
          iconName="sparkles-outline"
          title="Luna AI Chat"
          description="Instant AI support"
          colors={['#6a11cb', '#4d8efd']}
          onPress={() => navigation.navigate('AiChat')}
        />
        <FeatureCard
          iconName="videocam-outline"
          title="Video Session"
          description="1-on-1 with a counselor"
          colors={['#FFB75E', '#ED8F03']}
          onPress={() => navigation.navigate('Counselors')}
        />
        <FeatureCard
          iconName="chatbubbles-outline"
          title="Text Sessions"
          description="3 chats of 20mins each"
          colors={['#4ac8c9', '#6ed2d3']}
          onPress={() => navigation.navigate('Boost')}
        />
      </ScrollView>
    </View>
  );
});

// --- BlogCard Component ---
const BlogCard = memo(({ item, navigation, getTimeAgo }) => {
  const handlePress = useCallback(() => {
    navigation.navigate('BlogDetails', { data: item });
  }, [navigation, item]);

  return (
    <TouchableOpacity style={styles.blogCard} onPress={handlePress}>
      <Image
        source={require('../assets/blog4.jpeg')}
        style={styles.blogImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.metaContainer}>
          <Text style={styles.categoryText}>{item?.category || 'General'}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.timeText}>{getTimeAgo(item?.createdAt)}</Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.authorContainer}>
          <Ionicons name="person-circle-outline" size={responsiveFontSize(2.5)} color="#555" />
          <Text style={styles.authorText} numberOfLines={1}>{item?.author || 'Anonymous'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// --- Shimmer Placeholder Component ---
const ShimmerCard = () => (
  <View style={styles.shimmerCard}>
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={styles.shimmerImage}
    />
    <View style={styles.shimmerContent}>
      <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerMeta} />
      <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerTitle} />
      <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerAuthor} />
    </View>
  </View>
);

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const isFocused = useIsFocused();

  const [userName, setUserName] = useState(null);
  const [profileScore, setProfileScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [blogs, setBlogs] = useState([]);

  // --- DYNAMIC & SAFE ANIMATION SETUP ---
  const { width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_ASPECT_RATIO = 2.1;
  const CONTENT_SAFE_HEIGHT = responsiveHeight(6) + responsiveHeight(1.5) + responsiveHeight(10);
  const idealAspectRatioHeight = width / HEADER_ASPECT_RATIO;
  const HEADER_MAX_HEIGHT = Math.max(CONTENT_SAFE_HEIGHT, idealAspectRatioHeight);
  const HEADER_MIN_HEIGHT = Math.max(HEADER_MAX_HEIGHT * 0.6, responsiveHeight(14));
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: ['#2D9596', '#66d0d1'],
    extrapolate: 'clamp',
  });

  const topContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!isFocused) return;
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to exit?', [
        { text: 'Cancel', onPress: () => null, style: 'cancel' },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isFocused]);

  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        setLoading(true);
        try {
          const userData = await fetchUserData(authToken);
          setUserName(userData?.user?.name);
          setProfileScore(userData?.questionScore);
          setUserId(userData?.user?._id);
          dispatch(addUser(userData?.user));

          const blogsData = await fetchBlogs(authToken);
          setBlogs(blogsData);

        } catch (error) {
          console.log('Error fetching data for Home screen:', error);
        } finally {
          setLoading(false);
        }
      };
      if (authToken) {
        loadAllData();
      }
    }, [authToken, dispatch]),
  );

  useEffect(() => {
    if (userId) {
      dispatch(connectSocket({ userId: userId }));
    }
  }, [dispatch, userId]);

  const getTimeAgo = useCallback((dateString) => {
    if (!dateString) return 'Some time ago';
    const [day, month, year] = dateString.split('/').map(Number);
    const createdAt = new Date(year, month - 1, day);
    if (isNaN(createdAt.getTime())) return 'Invalid date';

    const now = new Date();
    const diffTime = now - createdAt;
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  }, []);

  const renderListHeader = useCallback(() => (
    <>
      {loading ? (
        <View style={{ marginHorizontal: 15, marginTop: 15 }}>
          <ShimmerPlaceHolder LinearGradient={LinearGradient} style={{ width: '100%', height: responsiveHeight(10), borderRadius: 15 }} />
        </View>
      ) : profileScore ? (
        <ProgressBar score={profileScore} navigation={navigation} />
      ) : (
        <Quiz />
      )}
      {/* MODIFIED to pass navigation prop */}
      <ServiceFeatures navigation={navigation} />

      <Features />

      <View style={styles.headerContainer}>
        <View style={styles.headerDecorator} />
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Articles and stories for your well-being.</Text>
        </View>
      </View>
    </>
  ), [loading, profileScore, navigation]); // MODIFIED to include navigation dependency

  const renderBlogItem = useCallback(
    ({ item }) => <BlogCard item={item} navigation={navigation} getTimeAgo={getTimeAgo} />,
    [navigation, getTimeAgo],
  );

  const renderShimmerItem = useCallback(() => <ShimmerCard />, []);

  const keyExtractor = useCallback((item, index) => item._id ? item._id.toString() : index.toString(), []);

  return (
    <View style={styles.fill}>
      <StatusBar animated={true} barStyle={'dark-content'} hidden={false} backgroundColor={'#2D9596'} />

      <Animated.FlatList
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT,
          paddingBottom: responsiveHeight(14)
        }}
        ListHeaderComponent={renderListHeader}
        data={loading ? [1, 2, 3] : blogs}
        renderItem={loading ? renderShimmerItem : renderBlogItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
      />

      <Animated.View
        style={[
          styles.header,
          {
            height: HEADER_MAX_HEIGHT,
            transform: [{ translateY: headerTranslateY }],
            backgroundColor: headerBackgroundColor,
          },
        ]}
      >
        <Animated.View style={[styles.topContentContainer, { opacity: topContentOpacity }]}>
          <View style={styles.greetingContainer}>
            <View>
              <Text style={styles.greetingText}>Hi, {userName?.split(' ')?.[0] || 'User'}</Text>
              <Text style={styles.welcomeText}>Welcome back!</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileButton}
            >
              <Text style={styles.profileInitial}>
                {userName?.slice(0, 1) || 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.searchBarContainer}
          onPress={() => navigation.navigate('Boost')}
          activeOpacity={0.8}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search" size={responsiveFontSize(2.5)} color="#888" />
            <Text style={styles.searchBarText}>Find counselors to connect with</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  // --- UPDATED STYLES FOR SERVICE FEATURES ---
  serviceFeaturesContainer: {
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2.5),
  },
  serviceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: responsiveHeight(2),
  },
  titleDecoratorLine: {
    width: 5,
    height: '80%',
    backgroundColor: primary,
    borderRadius: 5,
    marginRight: 10,
  },
  serviceFeaturesTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(2.1),
    color: '#121212',
  },
  serviceFeaturesSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.5),
    color: '#6c757d',
  },
  featureCard: {
    width: responsiveWidth(Platform.OS == 'ios' ? 50 : 45),
    aspectRatio: 1.6,
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 20,
    marginRight: responsiveWidth(Platform.OS === 'ios' ? 0 : 4),
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: responsiveHeight(1.5),
  },
  featureTitle: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(1.9),
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.4),
    lineHeight: responsiveHeight(2),
  },

  // --- EXISTING STYLES ---
  fill: {
    flex: 1,
    backgroundColor: background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 15,
  },
  topContentContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: responsiveHeight(1),
  },
  greetingText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(2),
  },
  welcomeText: {
    color: secondary,
    fontFamily: 'Poppins-Medium',
    fontSize: responsiveFontSize(1.5),
  },
  profileButton: {
    backgroundColor: secondary,
    width: 36,
    height: 36,
    borderRadius: 100,
    borderColor: '#fff',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: primary,
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
  },
  searchBarContainer: {
    position: 'absolute',
    bottom: responsiveHeight(1.5),
    left: 15,
    right: 15,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBarText: {
    marginLeft: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.7),
    color: '#6c757d',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: responsiveHeight(2.5),
    paddingBottom: responsiveHeight(2),
  },
  headerDecorator: {
    width: 5,
    height: '90%',
    backgroundColor: primary,
    borderRadius: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(2.1),
    color: '#121212',
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.5),
    color: '#6c757d',
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: responsiveHeight(2.5),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 20
  },
  blogImage: {
    width: '100%',
    height: responsiveHeight(20),
    resizeMode: 'cover',
    borderRadius: 20,

  },
  cardContent: {
    padding: responsiveWidth(4),
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.8),
  },
  categoryText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(1.4),
    color: primary,
    textTransform: 'uppercase',
  },
  dotSeparator: {
    color: '#adb5bd',
    marginHorizontal: 8,
  },
  timeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.5),
    color: '#6c757d',
  },
  blogTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(2),
    color: '#212529',
    marginBottom: responsiveHeight(1.5),
    lineHeight: responsiveHeight(3.2),
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: responsiveHeight(1.5),
  },
  authorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: responsiveFontSize(1.5),
    color: '#495057',
    marginLeft: 8,
  },
  shimmerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: responsiveHeight(2.5),
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  shimmerImage: {
    width: '100%',
    height: responsiveHeight(20),
  },
  shimmerContent: {
    padding: responsiveWidth(4),
  },
  shimmerMeta: {
    width: '40%',
    height: responsiveFontSize(1.8),
    borderRadius: 4,
    marginBottom: responsiveHeight(1.5),
  },
  shimmerTitle: {
    width: '90%',
    height: responsiveFontSize(2.5),
    borderRadius: 4,
    marginBottom: responsiveHeight(2),
  },
  shimmerAuthor: {
    width: '60%',
    height: responsiveFontSize(2),
    borderRadius: 4,
  },
});

export default Home;