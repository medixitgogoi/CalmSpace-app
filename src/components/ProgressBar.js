import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { primary } from '../utils/colors';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const ProgressBar = ({ score, navigation }) => {
  let level = '';
  let colors = [];
  let suggestionContent = null;

  // This logic remains the same
  if (score >= 75) {
    level = '💚 Calm & Collected';
    colors = ['#9dd49f', '#2e8b57'];
    suggestionContent = (
      <>
        You're in a great zone! Keep it up, and if you’d like, explore the{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Boost')}>
          Quick Boost
        </Text>
        {' '}feature for an extra lift.
      </>
    );
  } else if (score >= 50) {
    level = '💙 Needs a Boost';
    colors = ['#7bc0f8', '#0057b7'];
    suggestionContent = (
      <>
        You're doing well, but a little extra support might help! Try the{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Boost')}>
          Quick Boost
        </Text>
        {' '}feature or talk to a{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Counselors')}>
          therapist
        </Text>.
      </>
    );
  } else if (score >= 25) {
    level = '🧡 Feeling Overwhelmed';
    colors = ['#ffbe5e', '#ff6a00'];
    suggestionContent = (
      <>
        Feeling a bit overwhelmed? It’s okay. The{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Boost')}>
          Quick Boost
        </Text>
        {' '}feature can help, or consider reaching out to a{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Counselors')}>
          therapist
        </Text>.
      </>
    );
  } else {
    level = '❤️ In the Storm';
    colors = ['#f6695f', '#b22222'];
    suggestionContent = (
      <>
        You're going through a tough time. Please take care—try the{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Boost')}>
          Quick Boost
        </Text>
        {' '}feature and talk to a{' '}
        <Text style={styles.highlightText} onPress={() => navigation.navigate('Counselors')}>
          therapist
        </Text>
        {' '}for guidance.
      </>
    );
  }

  return (
    // --- 2. Width Constraint Wrapper ---
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Title */}
        <LinearGradient
          colors={['#f0fdfd', '#dcf5f6', '#f0fdfd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="progress-check"
            size={isTablet ? 24 : responsiveFontSize(2.5)}
            color={primary}
          />
          <Text allowFontScaling={true} style={styles.titleText}>
            Your Personalized Progress Bar
          </Text>
        </LinearGradient>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${score}%` }]}
          />
          <Text
            allowFontScaling={true}
            style={[styles.progressText, { color: score < 50 ? '#333' : '#fff' }]}>
            {score}%
          </Text>
        </View>

        {/* Level Description */}
        <View style={styles.levelContainer}>
          <Text allowFontScaling={false} style={styles.levelText}>
            You are in the '
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.levelHighlight, { color: colors[1] }]}>
            {level}
          </Text>
          <Text allowFontScaling={true} style={styles.levelText}>
            ' zone
          </Text>
        </View>

        {/* Suggestion */}
        <Text allowFontScaling={true} style={styles.suggestionText}>
          {suggestionContent}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Wrapper to handle centering on wide screens
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
    paddingBottom: 15,
    // Tablet: Restrict width to 80% to look cleaner
    width: isTablet ? '80%' : '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    paddingVertical: Platform.OS === 'ios' ? 0 : 10,
    paddingHorizontal: 15,
    gap: 8,
    height: Platform.OS == 'ios' && responsiveHeight(5.5),
  },
  titleText: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  progressBarContainer: {
    width: '100%',
    height: isTablet ? 40 : 30, // Slightly taller on tablet
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    borderRadius: 15,
    position: 'absolute',
  },
  progressText: {
    fontSize: isTablet ? responsiveFontSize(1.3) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    width: '100%',
    position: 'absolute',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  levelText: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  levelHighlight: {
    fontSize: isTablet ? responsiveFontSize(1.3) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Bold',
  },
  suggestionText: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: isTablet ? responsiveFontSize(2.0) : responsiveFontSize(2.5),
  },
  highlightText: {
    fontFamily: 'Poppins-Bold',
    color: primary,
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.6),
  },
});

export default ProgressBar;