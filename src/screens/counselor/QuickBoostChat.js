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
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../../utils/colors'; // Ensure this path is correct
import { useSelector } from 'react-redux';
import { useChatStore } from '../../hooks/useChatStore';
import moment from 'moment';

// --- Constants ---
const COLORS = {
  bg: '#F7F9FC',
  white: '#FFFFFF',
  textDark: '#111827',
  textLight: '#6B7280',
  primary: primary || '#2563EB',
  inputBg: '#F3F4F6',
};

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const QuickBoostChat = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

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

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendMessage({ text: message, userId: id, image: null });
    setMessage('');
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeaderContainer}>
          <Text style={[styles.dateHeaderText, { fontSize: fSize(1.5) }]}>{item.label}</Text>
        </View>
      );
    }
    const isMyMessage = item.senderId === userDetails?._id;
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isMyMessage && styles.myMessageText,
              { fontSize: fSize(1.8) }
            ]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, { fontSize: fSize(1.3) }]}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <Image
              source={{ uri: pic }}
              style={[styles.avatar, { width: isTablet ? 48 : 42, height: isTablet ? 48 : 42 }]}
            />

            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { fontSize: fSize(2) }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.headerStatus, { fontSize: fSize(1.5) }]}>Online</Text>
            </View>
          </View>
        </View>

        {/* Chat Body */}
        <KeyboardAvoidingView
          style={styles.flexGrow}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

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

          {/* Input Area */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>

              {/* Text Input */}
              <View style={[styles.textInputContainer, { borderRadius: isTablet ? 50 : 28, paddingHorizontal: isTablet ? 30 : 16 }]}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type a message..."
                  placeholderTextColor={'#9CA3AF'}
                  style={[styles.textInput, { fontSize: fSize(1.8) }]}
                  multiline
                />
              </View>

              {/* Send Button (Outside) */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: message.trim() ? COLORS.primary : '#E5E7EB' },
                ]}
                onPress={handleSendMessage}
                disabled={!message.trim()}>
                <Feather name="send" size={20} color={message.trim() ? "#fff" : "#9CA3AF"} />
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flexGrow: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },

  // --- Header Styles ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 50,
  },
  avatar: {
    borderRadius: 50,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.textDark,
  },
  headerStatus: {
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
  },

  // --- Chat List Styles ---
  chatContentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  dateHeaderContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 231, 235, 0.6)',
  },
  dateHeaderText: {
    fontFamily: 'Poppins-Medium',
    color: COLORS.textLight,
  },

  // --- Message Bubbles ---
  messageContainer: {
    marginVertical: 6,
    width: '100%',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    maxWidth: '85%',
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4
  },
  theirMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  messageText: {
    fontFamily: 'Poppins-Regular',
    color: '#111',
  },
  myMessageText: {
    color: '#fff'
  },
  messageTime: {
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    marginTop: 4,
    marginHorizontal: 4,
  },

  // --- Input Styles ---
  inputWrapper: {
    backgroundColor: COLORS.white,
    // backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from flex-end to center
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    paddingVertical: 8,
    marginRight: 10,
  },
  textInput: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.textDark,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickBoostChat;