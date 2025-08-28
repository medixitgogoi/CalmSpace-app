import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../auth/Login';
import SignUp from '../auth/SignUp';
import OnboardingScreen from '../auth/OnboardingScreen';
import Splashscreen from '../auth/Splashscreen';
import ForgotPassword from '../auth/ForgotPassword';

const AuthStackNavigator = ({initialRoute}) => {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}>
      <Stack.Screen name="Splashscreen" component={Splashscreen} />
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
};

export default AuthStackNavigator;
