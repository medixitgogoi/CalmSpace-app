import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';

// --- Constants & Helpers ---
const COLORS = {
  background: '#F8F9FA',
  white: '#FFFFFF',
  primary: '#0fb8ad',
  primaryDark: '#0C968D',
  secondary: '#1fc8db',
  textDark: '#1A1A1A',
  textGrey: '#6C757D',
  border: '#E9ECEF',
  success: '#4CAF50',
  successBg: '#E8F5E9',
};

// Helper to prevent huge fonts on tablets
const getAdaptiveFontSize = (size, width) => {
  const isTablet = width > 768;
  // If tablet, scale down slightly relative to screen size to look natural
  return isTablet ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const CounselorDetails = ({ route }) => {
  const { counselor } = route.params;
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const userDetails = useSelector(state => state.user);

  // --- Responsive Logic ---
  const isTablet = width >= 768;
  const MAX_CONTENT_WIDTH = 630;
  // The content width is either the full screen (mobile) or the max width (tablet)
  const contentWidth = isTablet ? Math.min(width, MAX_CONTENT_WIDTH) : width;
  const tabWidth = contentWidth / 3;

  // --- State & Refs ---
  const scrollRef = useRef(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduleAt, setScheduleAt] = useState(null);
  const [scheduleTimes, setScheduleTimes] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (counselor?.schedule) {
      setScheduleAt(counselor.schedule.scheduleAt);
      setScheduleTimes(counselor.schedule.scheduleTimes);
    }
  }, [counselor?.schedule]);

  // --- Callbacks ---
  const toggleModal = useCallback(() => {
    setModalVisible(prev => !prev);
    setSelectedSlot(null);
  }, []);

  const handleTabPress = useCallback(index => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: contentWidth * index, animated: true });
    Animated.spring(tabIndicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [contentWidth, tabIndicatorAnim]);

  const onMomentumScrollEnd = useCallback((e) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
    if (pageIndex !== activeTab) {
      setActiveTab(pageIndex);
      Animated.spring(tabIndicatorAnim, {
        toValue: pageIndex,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    }
  }, [activeTab, contentWidth, tabIndicatorAnim]);

  const formatSlotRange = useCallback(timeStr => {
    const start = moment(timeStr, ['h:mm A']);
    const end = moment(start).add(1, 'hour');
    return `${start.format('hh:mm A')} - ${end.format('hh:mm A')}`;
  }, []);

  const formattedSlots = useMemo(() => scheduleTimes?.map(formatSlotRange) || [], [scheduleTimes, formatSlotRange]);
  const formattedDate = useMemo(() => scheduleAt ? moment(scheduleAt).format('MMMM D, YYYY') : '', [scheduleAt]);

  const confirmBooking = useCallback(async () => {
    if (!selectedSlot) {
      Toast.show({ type: 'error', text1: 'Please select a slot!', position: 'top', topOffset: 40 });
      return;
    }
    const scheduleTime = selectedSlot.split(' - ')[0];
    navigation.navigate('MeetPaymentScreen', {
      counselor,
      scheduleAt,
      scheduleTime,
      meetLink: counselor?.schedule?.meetLink,
      selectedSlot
    });
    setModalVisible(false);
  }, [selectedSlot, scheduleAt, counselor, navigation]);

  // --- Animation Interpolation ---
  const translateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  // --- Render Helpers ---
  const renderInfoRow = (icon, title, value) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.infoTitle, { fontSize: getAdaptiveFontSize(1.6, width) }]}>{title}</Text>
        <Text style={[styles.infoValue, { fontSize: getAdaptiveFontSize(1.8, width) }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* Top Navigation */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: getAdaptiveFontSize(2, width) }]}>
            Counselor Profile
          </Text>
          <View style={styles.iconButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
        >
          {/* Main Content Container (Constrained Width) */}
          <View style={{ width: contentWidth }}>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: counselor?.counselorId?.pic }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                </View>
              </View>

              <Text style={[styles.nameText, { fontSize: getAdaptiveFontSize(2.6, width) }]}>
                {counselor?.counselorId?.name}
              </Text>

              <Text style={[styles.subText, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                {counselor?.degree} • {counselor?.counselorId?.gender === 'Male' ? 'He/Him' : 'She/Her'}
              </Text>

              <View style={styles.priceTag}>
                <Text style={[styles.priceText, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                  ₹500 <Text style={{ fontSize: getAdaptiveFontSize(1.4, width), fontWeight: '400' }}>/ session</Text>
                </Text>
              </View>
            </View>

            {/* Stats Grid - Redesigned Info Cards */}
            <View style={[
              styles.statsContainer,
              isTablet && { padding: 40, width: '100%' } // <--- Add this condition
            ]}>
              {renderInfoRow('briefcase-outline', 'Experience', `${counselor?.experience}+ Years`)}
              {renderInfoRow('language-outline', 'Languages', counselor?.languages?.join(', '))}
              {renderInfoRow('medkit-outline', 'Specialties', counselor?.speciality?.join(', '))}
            </View>

            {/* Tabs Header */}
            <View style={styles.tabHeaderContainer}>
              {['Therapy', 'Info', 'Expertise'].map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleTabPress(index)}
                  style={[styles.tabButton, { width: tabWidth }]}
                >
                  <Text style={[
                    styles.tabText,
                    {
                      fontSize: getAdaptiveFontSize(1.8, width),
                      color: activeTab === index ? COLORS.primary : COLORS.textGrey,
                      fontFamily: activeTab === index ? 'Poppins-SemiBold' : 'Poppins-Medium'
                    }
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
              <Animated.View
                style={[
                  styles.tabIndicator,
                  { width: tabWidth, transform: [{ translateX }] }
                ]}
              />
            </View>

            {/* Horizontal Scrollable Content */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={onMomentumScrollEnd}
              style={{ width: contentWidth }}
            >
              {[counselor?.therapy, counselor?.info, counselor?.expertise].map((text, idx) => (
                <View key={idx} style={[styles.tabContentPage, { width: contentWidth }]}>
                  <Text style={[styles.textContent, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                    {text || "No information provided."}
                  </Text>
                </View>
              ))}
            </ScrollView>

          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <View style={[styles.fabContainer, { width: isTablet ? MAX_CONTENT_WIDTH : '100%' }]}>
          <TouchableOpacity onPress={toggleModal} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButton}
            >
              <Ionicons name="calendar" size={isTablet ? 35 : 20} color={COLORS.white} />
              <Text style={[styles.bookButtonText, { fontSize: getAdaptiveFontSize(2, width) }]}>
                Book Appointment
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Booking Modal */}
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={toggleModal}
          onBackButtonPress={toggleModal}
          animationIn="fadeInUp"
          animationOut="fadeOutDown"
          useNativeDriver
          style={styles.modal}
        >
          <View style={[styles.modalContainer, { width: isTablet ? 500 : '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: getAdaptiveFontSize(2, width) }]}>
                Available Slots
              </Text>
              <TouchableOpacity onPress={toggleModal} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={COLORS.textGrey} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { fontSize: getAdaptiveFontSize(1.6, width) }]}>
              {formattedDate}
            </Text>

            <ScrollView style={{ maxHeight: height * 0.4 }} showsVerticalScrollIndicator={false}>
              {formattedSlots.length > 0 ? (
                <View style={styles.slotsGrid}>
                  {formattedSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotChip,
                        selectedSlot === slot && styles.slotChipSelected
                      ]}
                    >
                      <Text style={[
                        styles.slotText,
                        selectedSlot === slot && styles.slotTextSelected,
                        { fontSize: getAdaptiveFontSize(1.6, width) }
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySlots}>
                  <Ionicons name="calendar-outline" size={40} color={COLORS.border} />
                  <Text style={styles.emptySlotsText}>No slots available</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={confirmBooking}
              disabled={!selectedSlot || loading}
              style={[
                styles.confirmBtn,
                (!selectedSlot || loading) && styles.confirmBtnDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={[styles.confirmBtnText, { fontSize: getAdaptiveFontSize(1.8, width) }]}>
                  Proceed to Pay
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 5,
    backgroundColor: COLORS.background,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textDark,
  },
  // --- Profile Styles ---
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 2,
  },
  nameText: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  subText: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.textGrey,
    marginTop: 4,
    textAlign: 'center',
  },
  priceTag: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  priceText: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.success,
  },
  // --- Stats / Info Styles ---
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.textGrey,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textDark,
    // lineHeight: 22,
  },
  // --- Tabs Styles ---
  tabHeaderContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    position: 'relative',
  },
  tabButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContentPage: {
    paddingHorizontal: 24,
  },
  textContent: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.textGrey,
    // lineHeight: 28,
    textAlign: 'left',
  },
  // --- Floating Button Styles ---
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'rgba(248, 249, 250, 0.9)', // Semi-transparent bg
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 16,
    height: responsiveHeight(6),
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButtonText: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.white,
    includeFontPadding: false, // killer learning to remove the extra space around text on Android
  },
  // --- Modal Styles ---
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
    marginBottom: 20,
  },
  closeModalBtn: {
    padding: 4,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minWidth: '45%',
    alignItems: 'center',
  },
  slotChipSelected: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  slotText: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.textDark,
  },
  slotTextSelected: {
    color: COLORS.success,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySlots: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  emptySlotsText: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.textGrey,
  },
  confirmBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  confirmBtnText: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.white,
  },
});

export default CounselorDetails;