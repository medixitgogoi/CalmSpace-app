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

// --- NEW MODERN UI ---

const Slot = () => {
  const navigation = useNavigation();

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [meetLink, setMeetLink] = useState('');

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Get tomorrow's date in YYYY-MM-DD
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

  // getCounselorByID
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
    setSelectedDate(tomorrow); // default select tomorrow
  }, []);

  const toggleTimeSlot = time => {
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const confirmBooking = async () => {
    if (!meetLink.trim() || selectedTimes.length === 0) {
      ToastAndroid.showWithGravity(
        'Please provide a meeting link and select at least one time slot.',
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      );
      return;
    }

    try {
      setLoading(true);

      const formattedDate = moment(selectedDate).format(
        'YYYY-MM-DDT00:00:00.000[Z]',
      );
      const formattedTimes = selectedTimes.map(slot => slot.split(' - ')[0]);

      const data = {
        scheduleAt: formattedDate,
        scheduleTimes: formattedTimes,
        meetLink: meetLink.trim(),
      };

      console.log('scheduleTimes: ', formattedTimes);

      const response = await axios.post('/counselor/set-availabilty', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });

      console.log('post response: ', response);

      if (response?.data?.status_code === 201) {
        // This function will now handle showing the message on both platforms
        const showSuccessMessage = () => {
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Your availability has been set successfully! ✅',
              ToastAndroid.SHORT,
            );
            // On Android, Toast is non-blocking, so we can navigate immediately
            navigation.navigate('Dashboard');
          } else {
            // For iOS (and other platforms), use the blocking Alert
            Alert.alert(
              'Success!', // The title of the alert
              'Your availability has been set successfully. ✅', // The message
              [
                {
                  text: 'OK',
                  // Navigate only after the user presses "OK"
                  onPress: () => navigation.navigate('Dashboard'),
                },
              ],
              { cancelable: false } // User must interact with the alert
            );
          }
        };

        showSuccessMessage();

      } else {
        ToastAndroid.showWithGravityAndOffset(
          `${response?.data?.message}`,
          ToastAndroid.LONG,
          ToastAndroid.TOP,
          0,
          40,
        );
      }
    }
    catch (error) {
      console.log('Slot booking error: ', error?.message || error);
      ToastAndroid.show('An error occurred. Please try again.', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F7FC" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={'#1A202C'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Your Availability</Text>
          <View style={{ width: 35 }} />
        </View>

        {!initialLoading && details ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}>
              {/* Meeting Link */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="link-outline" size={responsiveFontSize(2.2)} color="#4A90E2" />  Meeting Link
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="videocam-outline" style={styles.inputIcon} size={22} color="#7A8599" />
                  <TextInput
                    placeholder="Enter Google Meet link"
                    placeholderTextColor={'#7A8599'}
                    onChangeText={setMeetLink}
                    value={meetLink}
                    style={styles.textInput}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Date Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="calendar-outline" size={responsiveFontSize(2.2)} color="#4A90E2" />  Select Date
                </Text>
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={tomorrow}
                    markedDates={{
                      [selectedDate]: {
                        selected: true,
                        disableTouchEvent: true,
                        selectedColor: '#4A90E2',
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
                      selectedDayBackgroundColor: '#4A90E2',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#4A90E2',
                      dayTextColor: '#2d4150',
                      textDisabledColor: '#d9e1e8',
                      arrowColor: '#4A90E2',
                      monthTextColor: '#1A202C',
                      indicatorColor: 'blue',
                      textDayFontFamily: 'Poppins-Medium',
                      textMonthFontFamily: 'Poppins-Bold',
                      textDayHeaderFontFamily: 'Poppins-SemiBold',
                      textDayFontSize: responsiveFontSize(1.8),
                      textMonthFontSize: responsiveFontSize(2.2),
                      textDayHeaderFontSize: responsiveFontSize(1.6),
                    }}
                  />
                </View>
              </View>

              {/* Time Slot Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="time-outline" size={responsiveFontSize(2.2)} color="#4A90E2" /> Select Time Slots
                </Text>
                <FlatList
                  data={timeSlots}
                  keyExtractor={item => item}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.slotListContainer}
                  renderItem={({ item }) => {
                    const isSelected = selectedTimes.includes(item);
                    return (
                      <TouchableOpacity
                        style={[styles.slot, isSelected && styles.selectedSlot]}
                        onPress={() => toggleTimeSlot(item)}>
                        <Text style={[styles.slotText, isSelected && styles.selectedSlotText]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </ScrollView>
            {/* --- Footer Button --- */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={confirmBooking}
                disabled={loading || !meetLink.trim() || selectedTimes.length === 0}
                style={[styles.confirmButton, (loading || !meetLink.trim() || selectedTimes.length === 0) && styles.disabledButton]}>
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirm Availability
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.centeredScreen}>
            <Ionicons name="information-circle-outline" size={80} color="#FF6B6B" />
            <Text style={styles.noticeText}>
              Please complete your profile before setting your availability.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddDetails')}
              style={styles.addDetailsButton}>
              <Ionicons name="person-add-outline" size={22} color="#fff" />
              <Text style={styles.addDetailsButtonText}>
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
    backgroundColor: background,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    paddingTop: 3,
    borderBottomColor: '#999',
    borderBottomWidth: 0.2
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFF',
    elevation: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#1A202C',
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: responsiveHeight(12), // Space for the footer
    paddingTop: 20
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: responsiveHeight(7),
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-Medium',
    color: '#1A202C',
    height: '100%',
  },
  calendarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  slotListContainer: {
    marginTop: 5,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 6,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: responsiveHeight(7),
  },
  selectedSlot: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
    elevation: 3,
  },
  slotText: {
    fontSize: responsiveFontSize(1.8),
    color: '#2D3748',
    fontFamily: 'Poppins-Medium',
  },
  selectedSlotText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F4F7FC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
    height: responsiveHeight(7),
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
    elevation: 0,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-Bold',
  },
  noticeText: {
    fontSize: responsiveFontSize(2),
    color: '#2D3748',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    marginTop: 20,
    marginBottom: 25,
    lineHeight: 28
  },
  addDetailsButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  addDetailsButtonText: {
    fontSize: responsiveFontSize(2),
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
});

export default Slot;