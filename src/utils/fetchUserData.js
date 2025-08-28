import axios from 'axios';

export const fetchUserData = async token => {
  try {
    const response = await axios.get('/auth/user-data', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    console.log('user data response: ', response);
    return response?.data; // Return user data
  } catch (error) {
    console.log('Error: ', error.message);
    return null; // Return null in case of error
  }
};
