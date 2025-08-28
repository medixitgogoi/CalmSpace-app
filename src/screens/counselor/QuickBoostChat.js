import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../../utils/colors';
import { useSelector } from 'react-redux';
import { useChatStore } from '../../hooks/useChatStore';
import moment from 'moment';

const QuickBoostChat = ({ navigation, route }) => {
  const {
    messages,
    getMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    connectSocket,
    socket,
  } = useChatStore();

  const { id, name, pic, email } = route.params;
  const userDetails = useSelector(state => state.user);
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  useEffect(() => {
    if (socket && id) {
      getMessages(id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [socket, id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  const formatTime = dateStr => moment(dateStr).format('h:mm A');

  const getDateLabel = dateStr => {
    const date = moment(dateStr);
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    if (date.isSame(today, 'd')) return 'Today';
    if (date.isSame(yesterday, 'd')) return 'Yesterday';
    return date.format('MMMM D, YYYY');
  };

  // --- 2. UPDATED formattedMessages CALCULATION ---
  const formattedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    let lastDateLabel = null;
    const formatted = [];
    messages.forEach(msg => {
      const currentDateLabel = getDateLabel(msg.createdAt);
      if (currentDateLabel !== lastDateLabel) {
        formatted.push({
          type: 'header',
          label: currentDateLabel,
          _id: `header-${currentDateLabel}`,
        });
        lastDateLabel = currentDateLabel;
      }
      formatted.push({ type: 'message', ...msg });
    });
    return formatted;
  }, [messages]);
  // ---------------------------------------------

  // --- 3. ADDED useFocusEffect HOOK ---
  useFocusEffect(
    useCallback(() => {
      const task = setTimeout(() => {
        if (formattedMessages.length > 0 && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      return () => clearTimeout(task);
    }, [formattedMessages]),
  );
  // ------------------------------------

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendMessage({ text: message, userId: id, image: null });
    setMessage('');
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeaderContainer}>
          <Text style={styles.dateHeaderText}>{item.label}</Text>
        </View>
      );
    }
    const isMyMessage = item.senderId === userDetails?._id;
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.theirMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}>
          <Text
            style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Image source={{ uri: pic }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.headerSubtitle}>{email}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flexGrow}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <FlatList
            ref={flatListRef}
            data={formattedMessages}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.chatContentContainer}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={'#888'}
              style={styles.textInput}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: message.trim() ? primary : '#B0C4DE' },
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim()}>
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexGrow: { backgroundColor: '#F7F9FC', flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerButton: { padding: 5 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  headerInfo: { justifyContent: 'center', flex: 1 },
  headerTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  chatContentContainer: {
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  dateHeaderContainer: {
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
  },
  dateHeaderText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#4B5563',
  },
  messageContainer: { marginVertical: 4 },
  myMessageContainer: { alignItems: 'flex-end' },
  theirMessageContainer: { alignItems: 'flex-start' },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    maxWidth: '80%',
  },
  myMessageBubble: { backgroundColor: primary, borderBottomRightRadius: 5 },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  messageText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#111',
  },
  myMessageText: { color: '#fff' },
  messageTime: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#A0A0A0',
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 100,
    paddingHorizontal: 22,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#111',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickBoostChat;