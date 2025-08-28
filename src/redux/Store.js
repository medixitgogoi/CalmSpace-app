import { configureStore } from '@reduxjs/toolkit';
import userReducer from './UserSlice';
// import socketUserReducer from './socket/userSocketSlice';
// import socketReducer from './socketSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        // userSocket: socketUserReducer,
        // socket: socketReducer,
        chat: chatReducer,
    },
})