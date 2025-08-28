import { addMessage } from '../redux/chatSlice';
import { store } from '../redux/Store';

export const subscribeToMessages = (socket, id) => {

    console.log('socket: ', socket);

    socket.on('newMessage', (newMessage) => {

        const isMessageSentFromSelectedUser = newMessage.senderId === id;

        if (!isMessageSentFromSelectedUser) return;

        store.dispatch(addMessage(newMessage));
    });
};