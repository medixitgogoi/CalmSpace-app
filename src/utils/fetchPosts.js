import axios from "axios";

export const fetchPosts = async (authToken) => {
    try {
        const response = await axios.get('/comunity/post', {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('posts get response: ', response?.data);
        
        if (response?.data?.length>0) {
            return response?.data || [];
        }

    } catch (error) {
        console.log("Error: ", error.message);
        return null;
    }
};