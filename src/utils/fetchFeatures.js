import axios from "axios";

export const fetchFeatures = async (authToken) => {
    try {
        const response = await axios.get('/feauture', {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('feature response: ', response);

        if (response?.data?.status_code === 201) {
            return response?.data?.data; // Return feature data
        }

    } catch (error) {
        console.log("Error: ", error.message);
        return null; // Return null in case of error
    }
};