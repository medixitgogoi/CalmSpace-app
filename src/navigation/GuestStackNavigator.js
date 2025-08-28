import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import Feather from 'react-native-vector-icons/Feather';
// --- MODIFICATION: Import Ionicons for solid/outline icon styles ---
import Ionicons from 'react-native-vector-icons/Ionicons';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import LinearGradient from 'react-native-linear-gradient';

// Import Screens (assuming paths are correct)
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

// --- Centralized Theme & Sizing ---
const THEME = {
  primary: '#2D9596',
  inactive: '#6c757d',
  white: '#FFFFFF',
  tabBarBg: '#e8f5f5',
};

const SIZING = {
  tabBarHeight: Platform.OS === 'ios' ? 70 : 60,
  centralButtonSize: responsiveHeight(7),
  centralButtonPopup: responsiveHeight(4.2),
  screenMargin: 8,
  screenMargin2: 12,
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- MODIFICATION: Updated TabButton to handle solid/outline icons ---
const TabButton = ({ item, onPress, accessibilityState }) => {
  const focused = accessibilityState?.selected;
  const viewRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (viewRef.current && textRef.current && !item.isCentral) {
      // The animation remains the same and works on the container view
      const scale = focused ? 1.14 : 1;
      viewRef.current.animate({ 0: { scale: 1 }, 1: { scale } });
      textRef.current.animate({ 0: { scale: 1 }, 1: { scale } });
    }
  }, [focused, item.isCentral]);

  if (item.isCentral) {
    // This part for the central button's placeholder label remains unchanged
    return (
      <View style={[styles.tabItem, { justifyContent: 'flex-end', paddingBottom: Platform.OS === 'ios' ? 12 : 10 }]} pointerEvents="none">
        <Text style={[styles.tabLabel, { color: THEME.inactive }]}>{item.label}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1} style={styles.tabItem}>
      <Animatable.View ref={viewRef} duration={300} style={styles.tabIconContainer}>
        {/*
          * Here is the core change:
          * We now use the Ionicons library.
          * When the tab is 'focused', we use the 'activeIcon' name (solid).
          * When it's not focused, we use the 'icon' name (outline).
        */}
        <Ionicons
          name={focused ? item.activeIcon : item.icon}
          size={18} // Slightly adjusted size for better visual balance with Ionicons
          color={focused ? THEME.primary : THEME.inactive}
        />
      </Animatable.View>
      <Animatable.Text ref={textRef} allowFontScaling={false} style={[styles.tabLabel, { color: focused ? THEME.primary : THEME.inactive }]}>
        {item.label}
      </Animatable.Text>
    </TouchableOpacity>
  );
};


// --- Custom Tab Bar Component with Solid Background (No changes needed here) ---
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const centralItem = state.routes.find(route => descriptors[route.key].options.isCentral);

  return (
    <View style={styles.tabBarContainer}>
      {/* Central Button - Rendered above the bar for the notch effect */}
      {centralItem && (
        <TouchableOpacity
          onPress={() => navigation.navigate('AiChat')}
          activeOpacity={0.9}
          style={styles.centralTab}
        >
          <LinearGradient
            colors={[THEME.primary, '#56b4b5']} // Gradient for the button
            style={styles.centralTabInner}
          >
            {/* The central button still uses Feather, which is fine as it's a standalone design */}
            <Feather name={descriptors[centralItem.key].options.icon} size={25} color={THEME.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* The main tab bar background */}
      <View style={styles.tabBarBackground}>
        <View style={styles.tabBarContent}>
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
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};


const EmptyComponent = () => null;

// --- Tab Navigator using the new CustomTabBar ---
const TabNavigator = () => {
  // --- MODIFICATION: Updated screen definitions to include active (solid) and inactive (outline) icons ---
  const tabScreens = [
    { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home', component: Home },
    { name: 'Counselors', label: 'Counselors', icon: 'people-outline', activeIcon: 'people', component: Counselors },
    // The central button keeps its original Feather icon
    { name: 'AiChatTab', label: 'Luna', icon: 'star', component: EmptyComponent, isCentral: true },
    { name: 'Boost', label: 'Boost', icon: 'flash-outline', activeIcon: 'flash', component: Boost },
    { name: 'Community', label: 'Community', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', component: Community },
  ];

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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

// --- Main Stack Navigator (No changes needed here) ---
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

// --- Styles for the new design (No changes needed here) ---
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SIZING.tabBarHeight + SIZING.centralButtonPopup,
    alignItems: 'center',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: SIZING.screenMargin,
    left: SIZING.screenMargin,
    right: SIZING.screenMargin,
    height: SIZING.tabBarHeight,
    borderRadius: 17,
    backgroundColor: THEME.tabBarBg,
    elevation: 4,
  },
  tabBarContent: {
    flexDirection: 'row',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabIconContainer: {},
  tabLabel: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Poppins-Medium',
  },
  centralTab: {
    position: 'absolute',
    top: 0,
    width: SIZING.centralButtonSize,
    height: SIZING.centralButtonSize,
    borderRadius: SIZING.centralButtonSize / 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  centralTabInner: {
    width: '100%',
    height: '100%',
    borderRadius: SIZING.centralButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuestStackNavigator;
