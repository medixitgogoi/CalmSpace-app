import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import React, { useEffect, useState, useCallback, memo } from 'react';
import { primary, secondary } from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { fetchBlogs } from '../utils/fetchBlogs';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';

// --- Helper Function (Place this above your component) ---
const getTimeAgo = (dateString) => {
  if (!dateString) {
    return 'A while ago';
  }

  let createdAt;

  // First, try to parse the specific "DD/MM/YYYY" format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    // Note: month - 1 because months are 0-indexed in JavaScript's Date
    const parsedDate = new Date(year, month - 1, day);
    if (!isNaN(parsedDate.getTime())) {
      createdAt = parsedDate;
    }
  }

  // If the specific parse failed, try a general parse as a fallback
  if (!createdAt) {
    const directDate = new Date(dateString);
    if (!isNaN(directDate.getTime())) {
      createdAt = directDate;
    }
  }

  // If we still don't have a valid date, exit
  if (!createdAt) {
    console.error('[getTimeAgo] Failed to parse date:', dateString);
    return 'Invalid date';
  }

  const now = new Date();
  const diffTime = now - createdAt;

  if (diffTime < 0) return 'In the future';

  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffYears = Math.floor(diffDays / 365.25);

  if (diffYears > 0) return `${diffYears}y ago`;
  if (diffMonths > 0) return `${diffMonths}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;

  return 'Just now';
};

const BlogCard = memo(({ item, navigation }) => { // No longer need to pass getTimeAgo
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
          <Text style={styles.categoryText}>
            {item?.category || 'General'}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.timeText}>
            {getTimeAgo(item?.createdAt)}
          </Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.authorContainer}>
          <Ionicons name="person-circle-outline" size={responsiveFontSize(2.5)} color="#555" />
          <Text style={styles.authorText} numberOfLines={1}>
            {item?.author || 'Anonymous'}
          </Text>
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

// --- Blogs Main Component ---
const Blogs = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchBlogs(authToken);
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs: ', error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // The old getTimeAgo function is removed from here

  const renderBlogItem = useCallback(
    ({ item }) => (
      <BlogCard item={item} navigation={navigation} /> // No longer need to pass getTimeAgo
    ),
    [navigation], // Dependency array is now simpler
  );

  const keyExtractor = useCallback((item, index) => item._id ? item._id.toString() : index.toString(), []);

  return (
    <View style={styles.container}>
      {/* Header with Decorative Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerDecorator} />
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Articles and stories for your well-being.</Text>
        </View>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.toString()}
          renderItem={() => <ShimmerCard />}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <FlatList
          data={blogs}
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderBlogItem}
          contentContainerStyle={styles.listContentContainer}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(2.5),
    paddingBottom: responsiveHeight(2),
  },
  headerDecorator: {
    width: 5,
    height: '90%',
    backgroundColor: primary,
    borderRadius: 5,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(2.3),
    color: '#121212',
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.6),
    color: '#6c757d',
  },
  listContentContainer: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(10),
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: responsiveHeight(2.5),
    overflow: 'hidden',
    borderColor: '#e9ecef',
    borderWidth: 1,
  },
  blogImage: {
    width: '100%',
    height: responsiveHeight(20),
    resizeMode: 'cover',
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
    fontSize: responsiveFontSize(2.2),
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
    fontSize: responsiveFontSize(1.6),
    color: '#495057',
    marginLeft: 8,
  },
  // Shimmer Styles
  shimmerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: responsiveHeight(2.5),
    overflow: 'hidden',
    borderColor: '#e9ecef',
    borderWidth: 1,
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

export default Blogs;