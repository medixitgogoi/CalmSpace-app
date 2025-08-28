import axios from "axios";

export const getOnlineUsers = async (authToken) => {
    try {
        const response = await axios.get('/counselor/getuserforsidebar', {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('online users response: ', response);

        return response?.data; // Return user data

        // if (response?.status === 201) {
        // }

    } catch (error) {
        console.log("Error fetching online users: ", error?.message);
        
        return null; // Return null in case of error
    }
};