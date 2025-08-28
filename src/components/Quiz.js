import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform,
    Dimensions,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// NOTE: I'm re-introducing react-native-linear-gradient for the button as it's
// the best way to achieve a modern gradient effect. If this is not desired,
// the button can be reverted to a solid color.
import LinearGradient from 'react-native-linear-gradient';

// Using Dimensions API for more robust responsiveness
const { width } = Dimensions.get('window');

// --- Component ---

const QuizCard = () => {
    // Hooks
    const navigation = useNavigation();
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // A "shake" animation for the button to attract attention.
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(2500), // A slightly longer delay
                // The shake sequence
                Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ])
        );

        animation.start();
        return () => animation.stop(); // Cleanup on unmount
    }, [shakeAnim]);

    // Interpolate the animation value to a rotation degree
    const animatedButtonStyle = {
        transform: [
            {
                rotate: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-1deg', '1deg'],
                }),
            },
        ],
    };

    // Render
    return (
        <View style={styles.cardWrapper}>
            <View style={styles.container}>
                {/* Horizontal View for Image and Text */}
                <View style={styles.contentRow}>
                    {/* Image framed in a circle */}
                    <View style={styles.imageFrame}>
                        <Image
                            // NOTE: Make sure this path is correct for your project structure.
                            source={require('../assets/quiz.png')}
                            style={styles.image}
                            resizeMode="cover" // Use 'cover' for circular frames
                        />
                    </View>

                    {/* Text content */}
                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>
                            Check your mental well-being
                        </Text>
                        <Text style={styles.subtitleText}>
                            Take a short, private quiz to get insights.
                        </Text>
                    </View>
                </View>

                {/* Animated gradient button */}
                <Animated.View style={animatedButtonStyle}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('QuizQuestions')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#EC4899']} // Vibrant purple to pink gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>Start the Quiz</Text>
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
        marginHorizontal: width * 0.05,
        marginTop: 20,
        marginBottom: 10,
        // Dark theme shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    container: {
        borderRadius: 26, // More pronounced rounding
        backgroundColor: '#1F2937', // Dark charcoal background
        padding: 15,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24, // Space between the content row and the button
    },
    imageFrame: {
        width: width * 0.25, // Adjusted size for horizontal layout
        height: width * 0.25,
        borderRadius: width * 0.125, // Make it a perfect circle
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 16, // Space between image and text
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1, // Allow text container to fill remaining space
    },
    titleText: {
        fontFamily: 'Poppins-Bold',
        fontSize: width * 0.041,
        color: '#F9FAFB',
        marginBottom: 6,
    },
    subtitleText: {
        fontFamily: 'Poppins-Regular',
        fontSize: width * 0.03,
        color: '#9CA3AF',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50, // Pill-shaped
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins-SemiBold',
        fontSize: width * 0.045,
    },
});

export default QuizCard;
