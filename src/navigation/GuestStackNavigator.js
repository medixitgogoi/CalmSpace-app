import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import LinearGradient from 'react-native-linear-gradient';

// --- Screen Imports (Same as before) ---
import Home from '../screens/Home';
import ProfileCreation from '../auth/ProfileCreation';
import Welcome from '../auth/Welcome';
import Profile from '../screens/Profile';
import QuizQuestions from '../screens/QuizQuestions';
import PercentageShow from '../screens/PercentageShow';
import Counselors from '../screens/Counselors';
import AiChat from '../screens/AiChat';
import Boost from '../screens/Boost';
import Community from '../screens/Community';
import BlogDetails from '../screens/BlogDetails';
import CounselorDetails from '../screens/CounselorDetails';
import Dashboard from '../screens/counselor/Dashboard';
import UpdateProfile from '../screens/counselor/UpdateProfile';
import QuickBoost from '../screens/counselor/QuickBoost';
import AddDetails from '../screens/counselor/AddDetails';
import CommunityCounselor from '../screens/counselor/CommunityCounselor';
import BoostChat from '../screens/BoostChat';
import QuickBoostChat from '../screens/counselor/QuickBoostChat';
import Slot from '../screens/counselor/Slot';
import Confirmation from '../screens/Confirmation';
import History from '../screens/History';
import CompleteProfile from '../screens/CompleteProfile';
import BoostPayment from '../screens/BoostPayment';
import MeetPaymentScreen from '../screens/MeetPaymentScreen';
import ChatHistory from '../screens/ChatHistory';
import Appointments from '../screens/counselor/Appointments';

// --- Theme Constants ---
const THEME = {
  primary: '#2D9596',
  primaryDark: '#237a7b',
  secondary: '#56b4b5',
  inactive: '#94A3B8',
  white: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  shadowColor: '#0F172A',
};

// --- Helper Functions ---
const getTabBarWidth = (width) => {
  return width > 768 ? 760 : width * 0.92;
};

// --- Components ---

const TabButton = ({ item, onPress, accessibilityState, isTablet }) => {
  const focused = accessibilityState?.selected;
  const viewRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Animation logic for standard tabs
    if (viewRef.current && textRef.current && !item.isCentral) {
      if (focused) {
        viewRef.current.animate({ 0: { scale: 1, translateY: 0 }, 1: { scale: 1.1, translateY: -2 } });
        textRef.current.animate({ 0: { opacity: 0.7, scale: 1 }, 1: { opacity: 1, scale: 1 } });
      } else {
        viewRef.current.animate({ 0: { scale: 1.1, translateY: -2 }, 1: { scale: 1, translateY: 0 } });
        textRef.current.animate({ 0: { opacity: 1 }, 1: { opacity: 0.7 } });
      }
    }
  }, [focused, item.isCentral]);

  // --- MODIFICATION: Central Button Label Handling ---
  if (item.isCentral) {
    // We render a view that takes up space but only displays the text at the bottom.
    // The icon is handled by the absolute Floating Action Button (FAB).
    return (
      <View style={[styles.tabItem, styles.centralTabItemPlaceholder]} pointerEvents="none">
        {/* Push text to the bottom to align with others */}
        <View style={{ flex: 1 }} />
        <Text
          allowFontScaling={false}
          style={[
            styles.tabLabel,
            {
              color: THEME.inactive, // Usually inactive color for the label as the button is the focus
              fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.3),
              marginBottom: isTablet ? 3 : 4, // Fine tune alignment
            }
          ]}
        >
          {item.label}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
      accessibilityRole="button"
    >
      <Animatable.View ref={viewRef} duration={400} style={styles.iconWrapper}>
        <Ionicons
          name={focused ? item.activeIcon : item.icon}
          size={isTablet ? 26 : 22}
          color={focused ? THEME.primary : THEME.inactive}
        />

        {focused && (
          <Animatable.View
            animation="fadeIn"
            duration={300}
            style={styles.activeDot}
          />
        )}
      </Animatable.View>

      <Animatable.Text
        ref={textRef}
        allowFontScaling={false}
        style={[
          styles.tabLabel,
          {
            color: focused ? THEME.primary : THEME.inactive,
            fontSize: isTablet ? responsiveFontSize(1) : responsiveFontSize(1.2)
          }
        ]}
      >
        {item.label}
      </Animatable.Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const tabBarWidth = getTabBarWidth(width);

  const centralItemIndex = state.routes.findIndex(route => descriptors[route.key].options.isCentral);
  const centralItem = state.routes[centralItemIndex];

  // Adjust FAB position based on device
  const fabBottomPosition = Platform.OS === 'ios'
    ? (isTablet ? 60 : 45) // Higher on iOS to clear home indicator/text
    : (isTablet ? 55 : 40); // Adjust for Android

  return (
    <View style={styles.tabBarContainer} pointerEvents="box-none">

      {/* 1. Floating Action Button (Luna Icon) */}
      {centralItem && (
        <View style={[styles.fabWrapper, { bottom: fabBottomPosition }]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => navigation.navigate('AiChat')}
            activeOpacity={0.9}
            style={[
              styles.centralTab,
              {
                width: isTablet ? 85 : 60,
                height: isTablet ? 85 : 60,
                // borderRadius: isTablet ? 0 : 30
              }
            ]}
          >
            <LinearGradient
              colors={[THEME.primary, THEME.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centralTabInner}
            >
              <Feather
                name={descriptors[centralItem.key].options.icon}
                size={isTablet ? 40 : 28}
                color={THEME.white}
                style={Platform.OS === 'ios' && { marginBottom: 3, marginRight: 4 }}
              />
            </LinearGradient>

            {/* <View style={styles.fabShadow} /> */}
          </TouchableOpacity>
        </View>
      )}

      {/* 2. The Main Tab Bar "Pill" */}
      <View
        style={[
          styles.tabBarBackground,
          {
            width: tabBarWidth,
            height: isTablet ? 100 : 65,
            // paddingBottom: Platform.OS === 'ios' && !isTablet ? 0 : 0,
          }
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabButton
              key={index}
              item={{ ...options }}
              onPress={onPress}
              accessibilityState={{ selected: isFocused }}
              isTablet={isTablet}
            />
          );
        })}
      </View>
    </View>
  );
};

const EmptyComponent = () => null;

// --- Navigator Configurations ---
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const tabScreens = [
    { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home', component: Home },
    { name: 'Counselors', label: 'Experts', icon: 'people-outline', activeIcon: 'people', component: Counselors },
    // Central Button Placeholder with Label
    { name: 'AiChatTab', label: 'Luna', icon: 'star', component: EmptyComponent, isCentral: true },
    { name: 'Boost', label: 'Boost', icon: 'flash-outline', activeIcon: 'flash', component: Boost },
    { name: 'Community', label: 'Social', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', component: Community },
  ];

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      {tabScreens.map((item, index) => (
        <Tab.Screen
          key={index}
          name={item.name}
          component={item.component}
          options={{ ...item }}
        />
      ))}
    </Tab.Navigator>
  );
};

const GuestStackNavigator = () => {
  const userDetails = useSelector(state => state.user);
  const isProfileCreationDone = userDetails?.profileStatus;
  const isCounselor = userDetails?.role === 'counselor';

  return (
    <View style={{ flex: 1, backgroundColor: THEME.white }}>
      <Stack.Navigator
        initialRouteName={isCounselor ? 'Dashboard' : isProfileCreationDone ? 'Main' : 'Welcome'}
        screenOptions={{
          gestureEnabled: true,
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="ProfileCreation" component={ProfileCreation} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="QuizQuestions" component={QuizQuestions} />
        <Stack.Screen name="PercentageShow" component={PercentageShow} />
        <Stack.Screen name="BlogDetails" component={BlogDetails} />
        <Stack.Screen name="BoostChat" component={BoostChat} />
        <Stack.Screen name="CounselorDetails" component={CounselorDetails} />
        <Stack.Screen name="Confirmation" component={Confirmation} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
        <Stack.Screen name="BoostPayment" component={BoostPayment} />
        <Stack.Screen name="MeetPaymentScreen" component={MeetPaymentScreen} />
        <Stack.Screen name="ChatHistory" component={ChatHistory} />
        <Stack.Screen name="AiChat" component={AiChat} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="UpdateProfile" component={UpdateProfile} />
        <Stack.Screen name="QuickBoost" component={QuickBoost} />
        <Stack.Screen name="QuickBoostChat" component={QuickBoostChat} />
        <Stack.Screen name="AddDetails" component={AddDetails} />
        <Stack.Screen name="Slot" component={Slot} />
        <Stack.Screen name="CommunityCounselor" component={CommunityCounselor} />
        <Stack.Screen name="Appointments" component={Appointments} />
      </Stack.Navigator>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabBarBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.tabBarBg,
    borderRadius: 55,
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
    shadowColor: THEME.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralTabItemPlaceholder: {
    justifyContent: 'flex-end', // Ensure text stays at bottom
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },
  tabLabel: {
    fontFamily: 'Poppins-Medium',
    // --- MODIFICATION: Removed Line Height as requested ---
    // lineHeight: undefined,
    includeFontPadding: false, // Helps remove extra vertical space on Android
  },
  fabWrapper: {
    position: 'absolute',
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centralTab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  centralTabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    // paddingBottom: 3
  },
});

export default GuestStackNavigator;