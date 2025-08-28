import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Easing,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import { primary } from '../utils/colors';
import { fetchFeatures } from '../utils/fetchFeatures';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const SPACING = 10;
const CAROUSEL_ITEM_FULL_WIDTH = CARD_WIDTH + SPACING;

const FeatureCardSkeleton = () => {
  // This component remains the same as the previous version
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: animatedOpacity }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonTextLarge} />
      <View style={styles.skeletonTextSmall} />
    </Animated.View>
  );
};


const Features = () => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState([]);

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchFeatures(authToken);
        setFeatures(data);
      } catch (error) {
        console.log('Error fetching features: ', error);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    };
    fetchData();
  }, [authToken]);

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_FULL_WIDTH,
      index * CAROUSEL_ITEM_FULL_WIDTH,
      (index + 1) * CAROUSEL_ITEM_FULL_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}>
        <LinearGradient
          colors={['#e1f6f6', '#a4e3e4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* --- FIX: Wrap Image in a View for stable responsive sizing --- */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/features.png')}
              style={styles.cardImage} // This style is now simplified
            />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerDecorator} />
        <View>
          <Text style={styles.headerTitle}>Upcoming Features</Text>
          <Text style={styles.headerSubtitle}>Exciting new updates coming soon!</Text>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        {loading ? (
          <FlatList
            data={[1, 2, 3]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.toString()}
            contentContainerStyle={styles.carouselContentContainer}
            renderItem={() => <FeatureCardSkeleton />}
          />
        ) : (
          <Animated.FlatList
            data={features}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContentContainer}
            snapToInterval={CAROUSEL_ITEM_FULL_WIDTH}
            decelerationRate="fast"
            renderItem={renderItem}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: responsiveHeight(2),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 20,
  },
  headerDecorator: {
    width: 5,
    height: '80%',
    backgroundColor: primary,
    borderRadius: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  carouselContainer: {},
  carouselContentContainer: {
    paddingHorizontal: (width - CARD_WIDTH) / 2 - SPACING / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
  },
  cardGradient: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: Platform.OS === 'android' ? 20 : 5,
    paddingHorizontal: 10,
  },
  imageContainer: {
    width: '55%',
    aspectRatio: 1.2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  cardSubtitle: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 5,
    marginBottom: Platform.OS === 'ios' ? 25 : 0
  },
  skeletonCard: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  skeletonImage: {
    width: '55%',
    aspectRatio: 1,
    backgroundColor: '#cccccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonTextLarge: {
    height: responsiveFontSize(2),
    width: '70%',
    backgroundColor: '#cccccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonTextSmall: {
    height: responsiveFontSize(1.5),
    width: '50%',
    backgroundColor: '#cccccc',
    borderRadius: 4,
  },
});

export default Features;