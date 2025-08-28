import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { primary } from '../utils/colors'; // Adjust if needed

const FallbackPrompt = () => {
  const navigation = useNavigation();

  return (
    <View
      style={{
        flex: 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#f9f9f9',
      }}>
      <LottieView
        source={require('../assets/animations/fallback_2.json')} // Replace with your actual Lottie file path
        autoPlay
        loop
        style={{ width: 220, height: 220, marginBottom: 20 }}
      />

      <Text
        style={{
          fontSize: responsiveFontSize(2.3),
          fontFamily: 'Poppins-SemiBold',
          color: '#333',
          textAlign: 'center',
          marginBottom: 10,
        }}>
        Complete Your Profile
      </Text>

      <Text
        style={{
          fontSize: responsiveFontSize(1.7),
          fontFamily: 'Poppins-Regular',
          color: '#666',
          textAlign: 'center',
          marginBottom: 25,
        }}>
        Let's get to know you better. Completing your profile helps us support
        you more personally.
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('CompleteProfile', { data: 1 })}
        style={{
          backgroundColor: primary,
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 30,
          elevation: 2,
        }}>
        <Text
          style={{
            color: '#fff',
            fontSize: responsiveFontSize(1.9),
            fontFamily: 'Poppins-Medium',
          }}>
          Complete Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FallbackPrompt;
