import { create } from 'zustand';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,
  unsubscribeHandler: null,

  connectSocket: async () => {
    if (get().socket) {
      return;
    }

    try {
      const userData = await AsyncStorage.getItem('userDetails');
      const parsedUser = JSON.parse(userData);
      const token = parsedUser?.authToken;

      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Missing Token',
          text2: 'Authentication token not available.',
        });
        return;
      }

      const socket = io('https://api.thecalmspace.in/', {
        auth: { token },
        query: { userId: parsedUser?._id },
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        set({ selectedUser: parsedUser });
      });

      socket.on('connect_error', err => {
        Toast.show({
          type: 'error',
          text1: 'Socket Connection Failed',
          text2: err.message,
        });
      });

      set({ socket });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Socket Error', text2: error.message });
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get('/message/users');
      set({ users: res.data });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load users',
        text2: error?.response?.data?.message || error.message,
      });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async userId => {
    set({ isMessagesLoading: true });
    try {
      const userData = await AsyncStorage.getItem('userDetails');
      const token = JSON.parse(userData)?.authToken;
      const res = await axios.get(`/message/getmessage/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      });
      set({ messages: res.data });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load messages',
        text2: error?.response?.data?.message || error.message,
      });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async messageData => {
    try {
      const userData = await AsyncStorage.getItem('userDetails');
      const token = JSON.parse(userData)?.authToken;

      const res = await axios.post(
        `/message/send/${messageData.userId}`,
        messageData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        },
      );

      console.log('send message response: ', res);

      set(state => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      console.log('send message error: ', error);

      Toast.show({
        type: 'error',
        text1: 'Failed to send message',
        text2: error?.response?.data?.message || error.message,
      });
    }
  },

  subscribeToMessages: () => {
    const socket = get().socket;
    if (!socket) {
      return;
    }

    const handleNewMessage = newMessage => {
      set(state => ({
        messages: [...state.messages, newMessage],
      }));
    };

    socket.on('newMessage', handleNewMessage);
    set({ unsubscribeHandler: () => socket.off('newMessage', handleNewMessage) });
  },

  unsubscribeFromMessages: () => {
    const unsubscribe = get().unsubscribeHandler;
    if (unsubscribe) {
      unsubscribe();
    }
    set({ unsubscribeHandler: null });
  },

  setSelectedUser: selectedUser => set({ selectedUser }),
  setMessages: messages => set({ messages }), // helper if needed
}));
