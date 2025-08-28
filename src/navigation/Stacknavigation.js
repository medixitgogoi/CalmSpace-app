import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthStackNavigator from './AuthStackNavigator';
import GuestStackNavigator from './GuestStackNavigator';
import { addUser } from '../redux/UserSlice';
import { useDispatch, useSelector } from 'react-redux';

axios.defaults.baseURL = 'https://api.thecalmspace.in/api/';

const Stacknavigation = () => {
  const dispatch = useDispatch();

  const userDetails = useSelector(state => state.user);
  // console.log('userDetails from Stacknavigation: ', userDetails);

  const [loading, setLoading] = useState(true);

  // Object-based login check
  const isUserLoggedIn = userDetails?.authToken;

  // load login details from Async Storage
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await AsyncStorage.getItem('userDetails');

        if (user) {
          dispatch(addUser(JSON.parse(user)));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1800);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <NavigationContainer>
        <AuthStackNavigator initialRoute="Splashscreen" />
      </NavigationContainer>
    );
  };

  return (
    <NavigationContainer>
      {isUserLoggedIn ? (
        <GuestStackNavigator />
      ) : (
        <AuthStackNavigator initialRoute="Login" />
      )}
    </NavigationContainer>
  );
};

export default Stacknavigation;
