import axios from 'axios';

export const getAppointments = async (authToken) => {
    try {
        const url = `/counselor/get-order`;
        const response = await axios.get(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            },
        });

        console.log('appointment response: ', response);

        return response?.data; // Return user data
    } catch (error) {
        console.log('Error fetching appointments: ', error);

        return null; // Return null in case of error
    }
};
