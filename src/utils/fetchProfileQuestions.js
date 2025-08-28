import axios from "axios";

export const fetchProfileQuestions = async () => { // Pass userDetails as a parameter
    try {
        const response = await axios.get('/questions/getQuestions');

        return response?.data;
    } catch (error) {
        console.log("Error", error.message); // Add a title to the alert
        return null; // Return null in case of error
    }
};