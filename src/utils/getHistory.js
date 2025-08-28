import axios from 'axios';

export const getHistory = async authToken => {
  try {
    const response = await axios.get('/auth/appointment', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
    });

    console.log('history response: ', response);

    return response?.data?.data; // Return user data
  } catch (error) {
    console.log('Error fetching online users: ', error?.message);

    return null; // Return null in case of error
  }
};
