import axios from "axios";

export const getBlockedUsers = async (authToken) => {
    try {
        const response = await axios.get('/blockuser', {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('blocked users list response: ', response);

        if (response?.data?.data) {
            return response?.data?.data; // Return feature data
        }

    } catch (error) {
        console.log("Error: ", error.message);
        return null; // Return null in case of error
    }
};