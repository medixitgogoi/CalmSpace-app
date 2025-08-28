import axios from "axios";

export const fetchBlogs = async (authToken) => {
    try {
        const response = await axios.get('/blogs', {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            }
        });

        console.log('blogs response: ', response);
        
        if (response?.data?.status_code === 201) {
            return response?.data?.data; // Return user data
        }

    } catch (error) {
        console.log("Error: ", error.message);
        return null; // Return null in case of error
    }
};