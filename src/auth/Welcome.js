import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { background } from '../utils/colors';
import Icon from 'react-native-vector-icons/Feather';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';

const Welcome = ({ navigation }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#ecf9f9', paddingHorizontal: 8 }}>
        <StatusBar hidden={false} barStyle="dark-content" />

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <View
            style={{
              marginTop: 50,
              paddingHorizontal: 8,
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
            <Image
              source={require('../assets/no_back_logo_color.png')}
              style={{ width: 180, height: 110, resizeMode: 'cover' }}
            />
            <Text
              style={{
                fontSize: responsiveFontSize(2.6),
                fontFamily: 'Poppins-Bold',
                color: '#000',
                marginTop: 20,
              }}>
              Welcome to Calmspace.
            </Text>
            <Text
              style={{
                fontSize: responsiveFontSize(1.6),
                fontFamily: 'Poppins-Medium',
                color: '#5b5b5b',
                textAlign: 'center',
                marginTop: 5,
              }}>
              A safe space just for you. As you step in, take a deep
              breath—you're in a place where you can be yourself, without fear
              or judgment.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 8, marginTop: 20 }}>
            <Text
              style={{
                fontSize: responsiveFontSize(2),
                fontFamily: 'Poppins-SemiBold',
                color: '#000',
                marginTop: 18,
              }}>
              Be yourself.
            </Text>
            <Text
              style={{
                fontSize: responsiveFontSize(1.6),
                fontFamily: 'Poppins-Regular',
                color: '#767676',
                marginTop: 0,
              }}>
              Your thoughts, feelings, and experiences matter. Here, you are
              seen, heard, and valued exactly as you are.
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(2),
                fontFamily: 'Poppins-SemiBold',
                color: '#000',
                marginTop: 18,
              }}>
              You’re Safe Here.
            </Text>
            <Text
              style={{
                fontSize: responsiveFontSize(1.6),
                fontFamily: 'Poppins-Regular',
                color: '#767676',
                marginTop: 0,
              }}>
              Your privacy is important to us. Share at your own pace, knowing
              that this is a space built on trust and care.
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(2),
                fontFamily: 'Poppins-SemiBold',
                color: '#000',
                marginTop: 18,
              }}>
              Kindness is Key.
            </Text>
            <Text
              style={{
                fontSize: responsiveFontSize(1.6),
                fontFamily: 'Poppins-Regular',
                color: '#767676',
                marginTop: 0,
              }}>
              Everyone here is on their own journey. Let’s support each other
              with empathy, understanding, and respect.
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(2),
                fontFamily: 'Poppins-SemiBold',
                color: '#000',
                marginTop: 18,
              }}>
              Take the First Step.
            </Text>
            <Text
              style={{
                fontSize: responsiveFontSize(1.6),
                fontFamily: 'Poppins-Regular',
                color: '#767676',
                marginBottom: 50,
              }}>
              Seeking help is a sign of strength. Whether you're here to talk,
              reflect, or heal, we're with you every step of the way.
            </Text>
          </View>
        </ScrollView>

        {/* Agree button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileCreation')}
          style={{
            backgroundColor: '#2D9596',
            borderRadius: 30,
            height: responsiveHeight(7.2),
            alignItems: 'center',
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 20 : 17,
            width: '100%',
            alignSelf: 'center',
            justifyContent: 'center'
          }}>
          <Text
            style={{
              fontSize: responsiveFontSize(2.2),
              fontFamily: 'Poppins-Bold',
              color: '#fff',
            }}>
            I agree
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Welcome;
