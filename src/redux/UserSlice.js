import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        addUser: (state, action) => {
            return { ...state, ...action.payload }; // Merge new fields with existing state
        },
        logoutUser: () => {
            return {};
        },
    },
});

export const { addUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;