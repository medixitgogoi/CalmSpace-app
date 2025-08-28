import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  StyleSheet, // Import StyleSheet for optimized styles
  Animated,
  Platform, // Import Animated for UI animations
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';

// Assuming these are defined in your utils/colors.js
// const background = '#F8F8F8';
// const primary = '#0fb8ad'; // Example primary color
// const secondary = '#1fc8db'; // Example secondary color

// Placeholder colors if utils/colors is not available in this environment
const background = '#F8F8F8';
const primary = '#0fb8ad';
const secondary = '#1fc8db';

const { width } = Dimensions.get('window');

const CounselorDetails = ({ route }) => {
  const { counselor } = route.params;
  console.log('counselor details: ', counselor); // Keep for debugging if needed

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const navigation = useNavigation();

  const scrollRef = useRef(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current; // For tab indicator animation

  const [activeTab, setActiveTab] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduleAt, setScheduleAt] = useState(null);
  const [scheduleTimes, setScheduleTimes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (counselor?.schedule) {
      setScheduleAt(counselor.schedule.scheduleAt);
      setScheduleTimes(counselor.schedule.scheduleTimes);
    }
  }, [counselor?.schedule]);

  // Use useCallback for functions that don't need to be recreated on every render
  const toggleModal = useCallback(() => {
    setModalVisible(prev => !prev);
    setSelectedSlot(null); // Reset selected slot when modal is closed
  }, []);

  const handleTabPress = useCallback(index => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: width * index, animated: true });

    // Animate tab indicator
    Animated.spring(tabIndicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      bounciness: 0, // No bounce for a cleaner slide
    }).start();
  }, [width]); // width is constant, but included for completeness

  // Memoize the formatSlotRange function if it were more complex or passed to many children
  const formatSlotRange = useCallback(timeStr => {
    const start = moment(timeStr, ['h:mm A']);
    const end = moment(start).add(1, 'hour');
    return `${start.format('hh:mm A')} - ${end.format('hh:mm A')}`;
  }, []);

  // Memoize formattedSlots to prevent re-calculation on every render
  const formattedSlots = useMemo(() => {
    return scheduleTimes?.map(formatSlotRange) || [];
  }, [scheduleTimes, formatSlotRange]);

  // Memoize formattedDate
  const formattedDate = useMemo(() => {
    return scheduleAt ? moment(scheduleAt).format('MMMM D, YYYY') : '';
  }, [scheduleAt]);

  const confirmBooking = useCallback(async () => {
    if (!selectedSlot) {
      Toast.show({
        type: 'error',
        text1: 'Please select a slot!',
        position: 'top',
        topOffset: 40,
      });

      return;
    }

    const scheduleTime = selectedSlot.split(' - ')[0];

    navigation.navigate('MeetPaymentScreen', { counselor: counselor, scheduleAt: scheduleAt, scheduleTime: scheduleTime, meetLink: counselor?.schedule?.meetLink, selectedSlot: selectedSlot });
    setModalVisible(false);

    // setLoading(true);

    // try {
    //   const scheduleTime = selectedSlot.split(' - ')[0];

    //   const submitData = {
    //     scheduleDate: scheduleAt,
    //     scheduleTime: scheduleTime,
    //     meetLink: counselor?.schedule?.meetLink,
    //     counselorName: counselor?.counselorId?.name,
    //     counselorId: counselor?.counselorId?._id,
    //   };

    //   // In a real app, you'd likely have an axios instance with a base URL and interceptors
    //   // For this example, we'll keep the direct call but note the best practice.
    //   const response = await axios.post(`/auth/book-appointment`, submitData, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: authToken,
    //     },
    //   });

    //   // console.log('booking response: ', response); // Keep for debugging if needed

    //   if (response?.data?.status_code === 201) {
    //     setModalVisible(false);
    //     Toast.show({
    //       type: 'success',
    //       text1: 'Congratulations!',
    //       text2: response?.data?.message,
    //       position: 'top',
    //       topOffset: 40,
    //     });
    //     navigation.navigate('Confirmation', {
    //       selectedSlot: selectedSlot,
    //       scheduleAt: scheduleAt,
    //     });
    //   } else {
    //     Toast.show({
    //       type: 'error',
    //       text1: 'Booking Failed!',
    //       text2: response?.data?.message || 'Something went wrong.',
    //       position: 'top',
    //       topOffset: 40,
    //     });
    //   }
    // } catch (error) {
    //   console.error('Error confirming booking:', error);
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error!',
    //     text2: 'Could not book appointment. Please try again.',
    //     position: 'top',
    //     topOffset: 40,
    //   });
    // } finally {
    //   setLoading(false);
    // }
  }, [selectedSlot, scheduleAt, counselor, authToken, navigation]);

  // Calculate tab indicator width and position for animation
  const tabWidth = width / 3; // Assuming 3 tabs, adjust if more

  const translateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2], // For 3 tabs
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar animated={true} barStyle={'dark-content'} hidden={false} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={27} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Counselor Details</Text>
          <View style={styles.placeholderView} />
        </View>

        {/* Scrollable Info */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Image & Basic Info */}
          <View style={styles.basicInfoContainer}>
            <Image
              source={{ uri: counselor?.counselorId?.pic }}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <Text style={styles.counselorName}>
              {counselor?.counselorId?.name}{' '}
              <Text style={styles.genderPronouns}>
                {counselor?.counselorId?.gender === 'Male' ? `(He/Him)` : `(She/her)`}
              </Text>
            </Text>
            <Text style={styles.counselorPrice}>
              ₹500
            </Text>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCardsContainer}>
            {/* Education */}
            <View style={styles.infoCard}>
              <Ionicons name="school-outline" size={20} color={'#000'} style={styles.infoCardIcon} />
              <View style={styles.infoCardTextContainer}>
                <Text style={styles.infoCardTitle}>Education</Text>
                <Text style={styles.infoCardContent}>
                  {counselor?.degree}
                </Text>
              </View>
            </View>

            {/* Specialties */}
            <View style={styles.infoCard}>
              <Ionicons name="medkit-outline" size={18} color={'#000'} style={styles.infoCardIcon} />
              <View style={styles.infoCardTextContainer}>
                <Text style={styles.infoCardTitle}>Specialties</Text>
                <Text style={styles.infoCardContent}>
                  {counselor?.speciality?.join(', ')}
                </Text>
              </View>
            </View>

            {/* Languages */}
            <View style={styles.infoCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={'#000'} style={styles.infoCardIcon} />
              <View style={styles.infoCardTextContainer}>
                <Text style={styles.infoCardTitle}>Languages</Text>
                <Text style={styles.infoCardContent}>
                  {counselor?.languages?.join(', ')}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {['Therapy', 'Info', 'Expertise'].map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleTabPress(index)}
                  style={styles.tabButton}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === index ? styles.activeTabText : styles.inactiveTabText,
                    ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Animated Tab Indicator */}
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    width: tabWidth,
                    transform: [{ translateX }],
                  },
                ]}
              />
            </View>

            {/* Horizontal ScrollView for Tab Content */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={e => {
                const pageIndex = Math.round(
                  e.nativeEvent.contentOffset.x / width,
                );
                if (pageIndex !== activeTab) {
                  setActiveTab(pageIndex);
                  Animated.spring(tabIndicatorAnim, {
                    toValue: pageIndex,
                    useNativeDriver: true,
                    bounciness: 0,
                  }).start();
                }
              }}
              style={styles.tabContentScrollView}
              contentContainerStyle={styles.tabContentScrollViewContent}>
              <View style={styles.tabContentPage}>
                <Text style={styles.tabContentText}>
                  {counselor?.therapy}
                </Text>
              </View>
              <View style={styles.tabContentPage}>
                <Text style={styles.tabContentText}>
                  {counselor?.info}
                </Text>
              </View>
              <View style={styles.tabContentPage}>
                <Text style={styles.tabContentText}>
                  {counselor?.expertise}
                </Text>
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Schedule Appointment Button */}
        <View style={styles.scheduleButtonWrapper}>
          <TouchableOpacity onPress={toggleModal}>
            <LinearGradient
              colors={['#0fb8ad', '#1fc8db']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scheduleButtonGradient}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#fff"
                style={styles.scheduleButtonIcon}
              />
              <Text style={styles.scheduleButtonText}>
                Schedule Appointment
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modal - Conditionally rendered for performance */}
        {isModalVisible && (
          <Modal
            isVisible={isModalVisible}
            onBackdropPress={toggleModal}
            onBackButtonPress={toggleModal}
            animationIn="zoomIn"
            animationOut="zoomOut"
            backdropTransitionOutTiming={0}
            useNativeDriver={true}
            hideModalContentWhileAnimating={true}
            style={styles.modalStyle}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity onPress={toggleModal} style={styles.modalCloseButton}>
                <Ionicons name="close-circle-outline" size={28} color="#888" />
              </TouchableOpacity>

              {/* Date */}
              {formattedSlots?.length > 0 && (
                <Text style={styles.modalDateText}>
                  Select a Time Slot for {formattedDate}
                </Text>
              )}

              {/* Slots */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalSlotsScrollView}>
                {formattedSlots.length > 0 ? (
                  formattedSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotItem,
                        selectedSlot === slot && styles.selectedSlotItem,
                      ]}>
                      <Text style={styles.slotText}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noSlotsText}>No slots available for this date. Please check back later for new openings.</Text>
                )}
              </ScrollView>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={confirmBooking}
                disabled={!selectedSlot || loading}
                style={[
                  styles.confirmButton,
                  (!selectedSlot || loading) && styles.confirmButtonDisabled,
                ]}>
                {loading ? (
                  <ActivityIndicator size={20} color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
                    <Text style={styles.confirmButtonText}>
                      Pay to confirm slot
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    paddingTop: 2,
  },
  placeholderView: {
    width: 35,
    height: 35,
  },
  scrollViewContent: {
    paddingBottom: 50,
  },
  basicInfoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 75,
    borderWidth: 3, // Added a subtle border
    borderColor: primary, // Border color from theme
  },
  counselorName: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginTop: 10,
  },
  genderPronouns: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Poppins-Medium',
    color: '#555', // Slightly darker for better readability
  },
  counselorPrice: {
    fontSize: responsiveFontSize(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginTop: 5, // Added a small margin
  },
  infoCardsContainer: {
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: '#e5f7f7',
    padding: 15, // Consistent padding
    borderRadius: 18, // Consistent border radius
    elevation: 4, // Increased elevation for better shadow on Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
    marginBottom: 15,
    marginHorizontal: 20,
    alignItems: 'flex-start', // Align icon to top
  },
  infoCardIcon: {
    marginTop: 2,
  },
  infoCardTextContainer: {
    paddingLeft: 10,
    flex: 1,
  },
  infoCardTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginBottom: 5
  },
  infoCardContent: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#555',
    lineHeight: responsiveFontSize(2.5), // Added line height for readability
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10, // Increased margin for spacing
    marginTop: 10,
    position: 'relative', // For absolute positioning of indicator
    borderBottomWidth: 1, // Subtle separator line
    borderColor: '#eee',
    paddingBottom: 5,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 5, // Adjusted padding for better touch target
  },
  tabText: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold', // Changed inactive to SemiBold
  },
  activeTabText: {
    color: primary, // Use primary color for active tab
  },
  inactiveTabText: {
    color: '#999',
  },
  tabIndicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: primary, // Indicator color from theme
    bottom: 0,
    left: 0,
    borderRadius: 2,
  },
  tabContentScrollView: {
    width: width,
  },
  tabContentScrollViewContent: {
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  tabContentPage: {
    width: width,
    paddingHorizontal: 15, // Increased padding
  },
  tabContentText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#333', // Slightly darker for better readability
    lineHeight: responsiveFontSize(2.5), // Added line height
  },
  scheduleButtonWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 20,
    left: 10,
    right: 10,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    height: Platform.OS === 'ios' ? 65 : 55
  },
  scheduleButtonIcon: {
    marginRight: 10, // Increased margin
  },
  scheduleButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(2.2), // Slightly larger font
    color: '#fff',
    paddingTop: 2, // Fine-tune vertical alignment
  },
  modalStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#f1fbfb',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 20,
    width: '88%', // Slightly wider
    maxHeight: '75%', // Allow a bit more height
    shadowColor: '#000', // iOS shadow for modal
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: 40
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },
  modalDateText: {
    fontSize: responsiveFontSize(2.3), // Slightly larger font
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 18, // Increased margin
    marginTop: 25,
    textAlign: 'center',
    color: primary,
  },
  modalSlotsScrollView: {
    paddingBottom: 10, // Reduced padding as confirm button has margin
  },
  slotItem: {
    paddingHorizontal: 16, // Increased padding
    marginVertical: 7, // Increased margin
    borderWidth: 1.5, // Slightly thicker border
    borderColor: '#ccc',
    borderRadius: 15, // Consistent border radius
    backgroundColor: '#fff',
    paddingVertical: 14, // Increased padding
  },
  selectedSlotItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  slotText: {
    fontSize: responsiveFontSize(1.9), // Slightly larger font
    fontFamily: 'Poppins-Medium',
    color: '#333', // Darker for better contrast
  },
  noSlotsText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    height: responsiveHeight(Platform.OS === 'ios' ? 7.5 : 7),
    borderRadius: Platform.OS === 'ios' ? 18 : 15,
    marginTop: 20, // Use marginTop instead of marginVertical
    alignItems: 'center',
    justifyContent: 'center',
    // <<< FIX: Added flexDirection to accommodate the icon
    flexDirection: 'row',
    gap: 8
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    height: responsiveHeight(Platform.OS === 'ios' ? 7.5 : 7), // Slightly taller button
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(2.2), // Slightly larger font
    fontFamily: 'Poppins-SemiBold',
  },
});

export default CounselorDetails;