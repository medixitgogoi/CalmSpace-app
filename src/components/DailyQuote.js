import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { secondary } from '../utils/colors';

const quotes = [
    "Your feelings are valid. Take one step at a time. 🌱",
    "Breathe in, breathe out. You got this. 💙",
    "It's okay to rest. You deserve peace. ☀️",
    "You are stronger than your thoughts. 💪",
    "Every day may not be good, but there's something good in every day. 🌿",
    "You are enough, just as you are. ✨"
];

const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];

const DailyQuote = () => {

    const [quote, setQuote] = useState(getRandomQuote());

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        const animateQuote = () => {
            // Fade In & Slide Down
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start();

            Animated.timing(translateY, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.out(Easing.exp),
            }).start();

            // Keep Quote Visible for 4s, then fade out & slide up
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }).start();

                Animated.timing(translateY, {
                    toValue: -20,
                    duration: 800,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.exp),
                }).start(() => {
                    // Get new quote & restart animation
                    setQuote(getRandomQuote());
                    fadeAnim.setValue(0);
                    translateY.setValue(10);
                    animateQuote();
                });
            }, 3000); // 4s visible
        };

        animateQuote();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <Animated.Text
                style={{
                    color: '#fff',
                    fontSize: responsiveFontSize(1.7),
                    fontFamily: 'Poppins-SemiBoldItalic',
                    textAlign: 'center',
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                }}
            >
                "{quote}"
            </Animated.Text>
        </View>
    );
};

export default DailyQuote;