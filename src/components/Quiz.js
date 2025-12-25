import React, { useEffect, useRef, useMemo } from 'react';
import {
    Animated,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform,
    Image,
    PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveHeight } from 'react-native-responsive-dimensions';

// --- Utility for Responsive Scaling ---
// Scales font size based on screen pixel density for better readability on all devices
const getFontScale = () => {
    const scale = PixelRatio.getFontScale();
    return scale > 1 ? 1 : scale; // Prevent text from becoming massive on large accessibility settings if layout breaks
};

const QuizCard = () => {
    const navigation = useNavigation();

    // Use scale animation (Pulse) instead of rotation (Shake)
    // Pulse is more inviting; Shake often signifies "Error".
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(3000),
                Animated.timing(pulseAnim, {
                    toValue: 1.05, // Scale up slightly
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1, // Scale back down
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [pulseAnim]);

    const animatedButtonStyle = {
        transform: [{ scale: pulseAnim }],
    };

    // Memoize navigation handler
    const handlePress = useMemo(() => () => {
        navigation.navigate('QuizQuestions');
    }, [navigation]);

    return (
        <View style={styles.cardWrapper}>
            <View style={styles.container}>
                {/* Top Section: Image & Text */}
                <View style={styles.contentRow}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/quiz.png')}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.titleText} numberOfLines={2} adjustsFontSizeToFit>
                            Check your mental well-being
                        </Text>
                        <Text style={styles.subtitleText}>
                            Take a short, private quiz to get insights.
                        </Text>
                    </View>
                </View>

                {/* Bottom Section: Action Button */}
                <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
                    <TouchableOpacity
                        onPress={handlePress}
                        activeOpacity={0.9}
                        style={styles.touchable}
                    >
                        <LinearGradient
                            // Using a more vibrant "Cyberpunk" or "Modern Health" gradient
                            colors={['#6366f1', '#a855f7', '#ec4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Start the Quiz</Text>
                            {/* Optional: Add an icon here if you have an icon library installed */}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
};

// --- Styles ---

const styles = StyleSheet.create({
    cardWrapper: {
        width: '90%', // Occupy 90% of screen width regardless of device size
        alignSelf: 'center',
        marginVertical: 20,
        // High-end Shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#4f46e5', // Colored shadow matches the theme
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
                shadowColor: '#4f46e5',
            },
        }),
    },
    container: {
        backgroundColor: '#111827', // Deep Grey/Black (Modern Dark Theme)
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', // Subtle border for definition
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
        // Neumorphic inner shadow effect logic for image frame
        backgroundColor: '#1f2937',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1, // Takes up remaining space
        justifyContent: 'center',
    },
    titleText: {
        fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Roboto', // Fallback font for safety
        fontWeight: '700',
        fontSize: 18 / getFontScale(),
        color: '#F3F4F6', // Off-white for less eye strain than pure white
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    subtitleText: {
        fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Roboto',
        fontSize: 13 / getFontScale(),
        color: '#9CA3AF', // Cool Gray
        lineHeight: 18,
    },
    buttonWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    touchable: {
        width: '100%',
    },
    gradientButton: {
        // paddingVertical: 14,
        height: responsiveHeight(6), // Fixed height for consistency
        borderRadius: 16, // Slightly softer rect than a full pill
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // Inner shadow hack for button depth
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 16 / getFontScale(),
        letterSpacing: 0.5,
    },
});

// Memoize the component to prevent re-renders on parent state changes
export default React.memo(QuizCard);