import axios from "axios";

export const isBlocked = async (authToken, id) => {
    try {
        // Use backticks (`) and ${id} to pass the actual ID variable
        const response = await axios.get(`/blockuser/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('is blocked response: ', response);

        // Usually, you'll want to return the boolean status or the data
        if (response?.data) {
            return response.data.isBlocked;
        }

        // return response?.data;

    } catch (error) {
        console.log("Error checking block status: ", error?.response?.data || error?.message);
        return null;
    }
};