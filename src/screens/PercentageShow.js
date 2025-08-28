import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, BackHandler, Animated } from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';

const PercentageShow = ({ route, navigation }) => {

    const { percentage } = route.params;

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [showResults, setShowResults] = useState(false);

    let level, message, color, heartEmoji;

    // Determine level, message, and color based on percentage
    if (percentage >= 75) {
        heartEmoji = '💚';
        level = 'Level 1 – Calm & Collected';
        message = "You're in a good headspace! Let's keep the balance.";
        color = '#d3ecd4';
    } else if (percentage >= 50) {
        heartEmoji = '💙';
        level = 'Level 2 – Managing, but Need a Boost';
        message = "You're holding up well, but a little support could help!";
        color = '#b6dcfb';
    } else if (percentage >= 25) {
        heartEmoji = '🧡';
        level = 'Level 3 – Feeling Overwhelmed';
        message = "You're carrying a lot. Let's work through it together.";
        color = '#ffe1b4';
    } else {
        heartEmoji = '❤️';
        level = 'Level 4 – In the Storm';
        message = "It’s okay to feel this way. We’re here to help you through it.";
        color = '#fcc7c3';
    }

    // Heartbeat animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true })
            ])
        ).start();
    }, []);

    // Fade-in effect when showing results
    const revealResults = () => {
        setShowResults(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    };

    // Handle back button press
    useEffect(() => {
        const backAction = () => {
            navigation.navigate('Main');
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [navigation]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: color, paddingHorizontal: 20, flexDirection: 'column', justifyContent: 'center' }}>
            {/* Show "View Quiz Results" initially */}
            {!showResults && (
                <TouchableOpacity
                    onPress={revealResults}
                    style={{ paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#000', borderRadius: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: responsiveFontSize(2), color: '#fff', fontFamily: 'Poppins-SemiBold', marginRight: 8 }}>
                        View My Quiz Results
                    </Text>
                    <AntDesign name="eyeo" size={23} color={'#fff'} />
                </TouchableOpacity>
            )}

            {/* Show results with animation */}
            {showResults && (
                <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                    {/* Animated Heart */}
                    <Animated.Text style={{ fontSize: responsiveFontSize(4), transform: [{ scale: scaleAnim }] }}>
                        {heartEmoji}
                    </Animated.Text>

                    <Text style={{ fontSize: responsiveFontSize(2.8), color: '#000', textAlign: 'center', fontFamily: 'Poppins-Bold', marginTop: 10 }}>
                        {level}
                    </Text>

                    <Text style={{ fontSize: responsiveFontSize(2), color: '#000', textAlign: 'center', marginTop: 5, fontFamily: 'Poppins-Medium', marginBottom: 20 }}>
                        {message}
                    </Text>

                    {/* Extra static information */}
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#555', marginTop: 20, fontFamily: 'Poppins-Italic', width: '100%', textAlign: 'center' }}>
                        This percentage has been carefully assessed by mental health experts based on your inputs.
                        Remember, your feelings are valid, and seeking support is a sign of strength. ❤️
                    </Text>
                </Animated.View>
            )}

            {/* Home screen button */}
            <TouchableOpacity
                onPress={() => navigation.navigate('Main')}
                style={{ marginTop: 30, paddingVertical: 12, paddingHorizontal: 20, width: '100%', borderRadius: 25, position: 'absolute', bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', alignSelf: 'center' }}
            >
                <Text style={{ fontSize: responsiveFontSize(2.1), color: '#666', fontFamily: 'Poppins-SemiBold' }}>
                    Take me to the Home screen
                </Text>
                <AntDesign name="arrowright" size={23} color={'#666'} />
            </TouchableOpacity>
        </SafeAreaView >
    );
};

export default PercentageShow;