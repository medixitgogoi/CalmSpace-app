import axios from 'axios';

export const getChatHistory = async authToken => {
    try {
        const response = await axios.get('/message/chat-history', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: authToken,
            },
        });

        console.log('chat history response: ', response);

        return response?.data; // Return user data
    } catch (error) {
        console.log('Error fetching online users: ', error?.message);

        return null; // Return null in case of error
    }
};
