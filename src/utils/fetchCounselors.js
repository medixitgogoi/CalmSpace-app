import axios from 'axios';

export const fetchCounselors = async (authToken, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`/counselor`, {
      params: {
        page,
        limit,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
    });

    console.log('Counselor response: ', response);

    if (response?.data?.data?.length > 0) {
      return response?.data?.data;
    }

    return []; // Empty array if no data
  } catch (error) {
    console.log('Error fetching counselors:', error.message);
    return null;
  }
};
