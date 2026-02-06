import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  ToastAndroid,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { background } from '../../utils/colors';

// --- Constants ---
const COLORS = {
  primary: '#4A90E2',
  bg: '#F4F7FC',
  textDark: '#1A202C',
  textLight: '#7A8599',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.6) : responsiveFontSize(size);
};

const Slot = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [meetLink, setMeetLink] = useState('');

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Get tomorrow's date
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await getCounselorByID(authToken);
          if (data !== null) setDetails(data);
        } catch (error) {
          console.log('Error fetching counselor: ', error);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchData();
    }, [authToken]),
  );

  // Time slot generator
  const timeSlots = Array.from({ length: 8 }, (_, i) => {
    const hour = 9 + i;
    const start = moment({ hour }).format('hh:00 A');
    const end = moment({ hour }).add(1, 'hour').format('hh:00 A');
    return `${start} - ${end}`;
  });

  useEffect(() => {
    setSelectedDate(tomorrow);
  }, []);

  const toggleTimeSlot = time => {
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const confirmBooking = async () => {
    if (!meetLink.trim() || selectedTimes.length === 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Please provide a meeting link and select a time slot.', ToastAndroid.LONG);
      } else {
        Alert.alert('Missing Information', 'Please provide a meeting link and select at least one time slot.');
      }
      return;
    }

    try {
      setLoading(true);
      const formattedDate = moment(selectedDate).format('YYYY-MM-DDT00:00:00.000[Z]');
      const formattedTimes = selectedTimes.map(slot => slot.split(' - ')[0]);

      const data = {
        scheduleAt: formattedDate,
        scheduleTimes: formattedTimes,
        meetLink: meetLink.trim(),
      };

      const response = await axios.post('/counselor/set-availabilty', data, {
        headers: { 'Content-Type': 'application/json', Authorization: authToken },
      });

      if (response?.data?.status_code === 201) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Availability set successfully! ✅', ToastAndroid.SHORT);
          navigation.navigate('Dashboard');
        } else {
          Alert.alert('Success!', 'Your availability has been set successfully. ✅', [
            { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
          ], { cancelable: false });
        }
      } else {
        const msg = response?.data?.message || 'Error occurred';
        Platform.OS === 'android' ? ToastAndroid.show(msg, ToastAndroid.LONG) : Alert.alert('Error', msg);
      }
    }
    catch (error) {
      console.log('Slot booking error: ', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fSize(2.4) }]}>Set Availability</Text>
          <View style={{ width: 40 }} />
        </View>

        {!initialLoading && details ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}>

              {/* Full Width Container */}
              <View style={{ width: '100%' }}>

                {/* Meeting Link */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontSize: fSize(2.2) }]}>
                    <Ionicons name="link-outline" size={fSize(2.2)} color={COLORS.primary} />  Meeting Link
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="videocam-outline" style={styles.inputIcon} size={22} color={COLORS.textLight} />
                    <TextInput
                      placeholder="Enter Google Meet link"
                      placeholderTextColor={COLORS.textLight}
                      onChangeText={setMeetLink}
                      value={meetLink}
                      style={[styles.textInput, { fontSize: fSize(1.9) }]}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontSize: fSize(2.2) }]}>
                    <Ionicons name="calendar-outline" size={fSize(2.2)} color={COLORS.primary} />  Select Date
                  </Text>
                  <View style={styles.calendarContainer}>
                    <Calendar
                      current={tomorrow}
                      markedDates={{
                        [selectedDate]: {
                          selected: true,
                          disableTouchEvent: true,
                          selectedColor: COLORS.primary,
                          selectedTextColor: '#FFFFFF',
                        },
                      }}
                      minDate={tomorrow}
                      maxDate={tomorrow}
                      onDayPress={day => {
                        if (day.dateString === tomorrow) setSelectedDate(day.dateString);
                      }}
                      disableAllTouchEventsForDisabledDays
                      theme={{
                        backgroundColor: '#FFFFFF',
                        calendarBackground: '#FFFFFF',
                        textSectionTitleColor: '#2d4150',
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: COLORS.primary,
                        dayTextColor: '#2d4150',
                        textDisabledColor: '#d9e1e8',
                        arrowColor: COLORS.primary,
                        monthTextColor: COLORS.textDark,
                        indicatorColor: 'blue',
                        textDayFontFamily: 'Poppins-Medium',
                        textMonthFontFamily: 'Poppins-Bold',
                        textDayHeaderFontFamily: 'Poppins-SemiBold',
                        textDayFontSize: fSize(1.8),
                        textMonthFontSize: fSize(2.2),
                        textDayHeaderFontSize: fSize(1.6),
                      }}
                    />
                  </View>
                </View>

                {/* Time Slot Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontSize: fSize(2.2) }]}>
                    <Ionicons name="time-outline" size={fSize(2.2)} color={COLORS.primary} /> Select Time Slots
                  </Text>

                  <View style={styles.slotGrid}>
                    {timeSlots.map((item) => {
                      const isSelected = selectedTimes.includes(item);
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.slot,
                            isSelected && styles.selectedSlot,
                            // On tablets use 3 columns (approx 32%), on phones use 2 (approx 47%)
                            { width: isTablet ? '32%' : '47%' }
                          ]}
                          onPress={() => toggleTimeSlot(item)}>
                          <Text style={[
                            styles.slotText,
                            isSelected && styles.selectedSlotText,
                            { fontSize: fSize(1.8) }
                          ]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

              </View>
            </ScrollView>

            {/* --- Footer Button --- */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={confirmBooking}
                disabled={loading || !meetLink.trim() || selectedTimes.length === 0}
                style={[
                  styles.confirmButton,
                  (loading || !meetLink.trim() || selectedTimes.length === 0) && styles.disabledButton,
                  // Keep full width logic for the button as well
                  { width: '100%', alignSelf: 'center' }
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.confirmButtonText, { fontSize: fSize(2.1) }]}>
                    Confirm Availability
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.centeredScreen}>
            <Ionicons name="information-circle-outline" size={isTablet ? 100 : 80} color="#FF6B6B" />
            <Text style={[styles.noticeText, { fontSize: fSize(2) }]}>
              Please complete your profile before setting your availability.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddDetails')}
              style={styles.addDetailsButton}>
              <Ionicons name="person-add-outline" size={22} color="#fff" />
              <Text style={[styles.addDetailsButtonText, { fontSize: fSize(2) }]}>
                Go to Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textDark,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textDark,
    height: '100%',
    minHeight: 45,
  },
  calendarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  slotText: {
    color: COLORS.textDark,
    fontFamily: 'Poppins-Medium',
  },
  selectedSlotText: {
    color: COLORS.white,
    fontFamily: 'Poppins-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontFamily: 'Poppins-Bold',
  },
  noticeText: {
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    marginTop: 20,
    marginBottom: 30,
    maxWidth: 400,
    lineHeight: 28,
  },
  addDetailsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  addDetailsButtonText: {
    color: COLORS.white,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
});

export default Slot;