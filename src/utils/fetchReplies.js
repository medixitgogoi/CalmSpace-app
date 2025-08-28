import axios from "axios";

export const fetchReplies = async (id,authToken) => {
    try {
        const response = await axios.get(`/comunity/replies/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('replies response: ', response);
    
        if (response?.data?.data?.length>0) {
            return response?.data?.data || [];
        }

    } catch (error) {
        console.log("Error: ", error.message);
        return null; // Return null in case of error
    }
};