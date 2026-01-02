import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
  Easing,
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { primary, lightPrimary, secondary, background } from '../utils/colors';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

// --- 1. Device Detection ---
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

// --- Data ---
const QUESTIONS = [
  {
    id: 1,
    question: "What is your preferred budget per session?",
    key: 'budget',
    options: [
      { id: 'b1', label: 'Budget-Friendly', subLabel: '₹500 - ₹1000', value: { min: 500, max: 1000 } },
      { id: 'b2', label: 'Standard', subLabel: '₹1000 - ₹1500', value: { min: 1000, max: 1500 } },
      { id: 'b3', label: 'Premium', subLabel: '₹1500 - ₹2000', value: { min: 1500, max: 2000 } },
    ]
  },
  {
    id: 2,
    question: "How experienced should the counselor be?",
    key: 'experience',
    options: [
      { id: 'e1', label: 'Junior', subLabel: '1+ Years Experience', value: 1 },
      { id: 'e2', label: 'Intermediate', subLabel: '2-3 Years Experience', value: 2 },
      { id: 'e3', label: 'Experienced', subLabel: '4+ Years Experience', value: 4 },
      { id: 'e4', label: 'Expert', subLabel: '5+ Years Experience', value: 5 },
    ]
  },
  {
    id: 3,
    question: "Which language do you prefer?",
    key: 'language',
    options: [
      'English', 'Hindi', 'Bengali', 'Marathi',
      'Telugu', 'Tamil', 'Gujarati', 'Urdu',
      'Kannada', 'Odia', 'Malayalam', 'Punjabi'
    ].map((lang, idx) => ({ id: `l${idx}`, label: lang, value: lang }))
  }
];

const SlidableSection = ({ onFinish, setCounselorsLoading }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  // --- State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    budget: null,
    experience: null,
    language: null
  });

  // --- Animations ---
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // --- Logic ---
  const currentQuestion = QUESTIONS[currentStepIndex];
  const selectedAnswer = answers[currentQuestion.key];

  const handleSelect = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.key]: option }));
  };

  const animateTransition = (direction, callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction * -50,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      callback();
      slideAnim.setValue(direction * 50);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStepIndex < QUESTIONS.length - 1) {
      animateTransition(1, () => setCurrentStepIndex(prev => prev + 1));
    } else {
      submitPreferences();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      animateTransition(-1, () => setCurrentStepIndex(prev => prev - 1));
    }
  };

  const submitPreferences = async () => {
    setCounselorsLoading(true);
    try {
      const response = await axios.get('/counselor/preference', {
        params: {
          language: answers.language.value.toLowerCase(),
          minPrice: answers.budget.value.min,
          maxPrice: answers.budget.value.max,
          experience: answers.experience.value,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });
      onFinish(response?.data || []);
    } catch (error) {
      console.log('Error: ', error.message);
      Toast.show({ type: 'error', text1: 'Error finding counselors' });
      onFinish([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, isTablet && styles.cardTablet]}>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {QUESTIONS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx <= currentStepIndex && styles.progressDotActive,
                idx === currentStepIndex && styles.progressDotCurrent
              ]}
            />
          ))}
        </View>

        {/* --- Animated Question Content --- */}
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* Question Text */}
          <Text style={styles.questionText}>
            <Text style={{ color: primary, fontSize: isTablet ? responsiveFontSize(1.8) : responsiveFontSize(2.4) }}>{currentStepIndex + 1}. </Text>
            {currentQuestion.question}
          </Text>

          {/* Options List */}
          <ScrollView
            style={styles.optionsScroll}
            // --- FIX: Changed to false to hide scrollbar on iOS/Android ---
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
            nestedScrollEnabled={true}
            persistentScrollbar={false}
          >
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer?.id === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(option)}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected
                  ]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {option.subLabel && (
                      <Text style={styles.optionSubLabel}>
                        {option.subLabel}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* --- Footer Buttons --- */}
        <View style={styles.footer}>
          {currentStepIndex > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={!selectedAnswer}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={!selectedAnswer ? ['#E0E0E0', '#E0E0E0'] : [primary, lightPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={[styles.nextButtonText, !selectedAnswer && { color: '#999' }]}>
                {currentStepIndex === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <Ionicons
                name={currentStepIndex === QUESTIONS.length - 1 ? "checkmark" : "arrow-forward"}
                size={isTablet ? 20 : 18}
                color={!selectedAnswer ? '#999' : '#fff'}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

export default SlidableSection;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '92%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    height: 450,
  },
  cardTablet: {
    // width: '180%',
    maxWidth: 600,
    paddingHorizontal: 30,
    paddingVertical: 30,
    height: responsiveHeight(45), // Slightly taller on tablet
  },

  // Progress Dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: primary,
    opacity: 0.5,
  },
  progressDotCurrent: {
    backgroundColor: primary,
    opacity: 1,
    width: 20,
  },
  contentContainer: {
    flex: 1, // Take up remaining space in card
  },
  questionText: {
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? responsiveFontSize(1.4) : responsiveFontSize(2.1),
    color: '#1F2937',
    marginBottom: 15,
    // lineHeight: isTablet ? 32 : 28,
  },
  optionsScroll: {
    flex: 1,
  },

  // MCQ Option Row
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  optionRowSelected: {
    borderColor: primary,
    backgroundColor: '#F0FDFA',
  },

  // Radio Button Logic
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: primary,
  },

  // Text Styles
  optionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    color: '#374151',
  },
  optionLabelSelected: {
    color: primary,
  },
  optionSubLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.4),
    color: '#6B7280',
    marginTop: 2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButtonText: {
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.7),
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: responsiveWidth(22),
    height: responsiveHeight(4),
    borderRadius: 11,
    gap: 3,
  },
  nextButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
  },
});