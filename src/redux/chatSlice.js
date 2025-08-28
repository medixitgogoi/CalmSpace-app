import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    messages: [],
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage(state, action) {
            state.messages.push(action.payload);
        },
        clearMessages(state) {
            state.messages = [];
        },
    },
});

export const { addMessage, clearMessages } = chatSlice.actions;

export default chatSlice.reducer;








































// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//     messages: [],
//     selectedUser: null,
//     socket: null,
// };

// const chatSlice = createSlice({
//     name: 'chat',
//     initialState,
//     reducers: {
//         setSelectedUser(state, action) {
//             state.selectedUser = action.payload;
//         },
//         setSocket(state, action) {
//             state.socket = action.payload;
//         },
//         addMessage(state, action) {
//             state.messages.push(action.payload);
//         },
//         clearMessages(state) {
//             state.messages = [];
//         },
//     },
// });

// export const { setSelectedUser, setSocket, addMessage, clearMessages } = chatSlice.actions;

// // Thunk for subscribing
// export const subscribeToMessages = () => (dispatch, getState) => {

//     console.log('entry');

//     const { chat } = getState();
//     const { selectedUser, socket } = chat;

//     if (!selectedUser || !socket) return;

//     socket.on('newMessage', (newMessage) => {
//         const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
//         if (!isMessageSentFromSelectedUser) return;

//         dispatch(addMessage(newMessage));
//     });
// };

// // Thunk for unsubscribing
// export const unsubscribeFromMessages = () => (dispatch, getState) => {
//     const { chat } = getState();
//     const { socket } = chat;

//     if (socket) {
//         socket.off('newMessage');
//     }
// };

// export default chatSlice.reducer;