import React, {
  useEffect,
  useRef,
  useState,
  memo,
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
import { primary } from '../utils/colors';
import { useSelector } from 'react-redux';
import { useChatStore } from '../hooks/useChatStore';
import moment from 'moment';

// --- Timer Component (No Changes) ---
const LOW_TIME_THRESHOLD = 3 * 60;
const parseExpiredAt = dateString => {
  const parts = dateString.split(', ');
  const dateParts = parts[0].split('/');
  const timeParts = parts[1].split(':');
  return new Date(
    dateParts[2],
    dateParts[1] - 1,
    dateParts[0],
    timeParts[0],
    timeParts[1],
    timeParts[2],
  );
};
const formatTimer = totalSeconds => {
  if (totalSeconds <= 0) return '00:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
};
const Timer = memo(({ expiredAt, onTimerEnd, onLowTime }) => {
  const [remainingTime, setRemainingTime] = useState(() => {
    const expiryDate = parseExpiredAt(expiredAt);
    const now = new Date();
    return Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
  });
  useEffect(() => {
    if (remainingTime <= 0) {
      onTimerEnd();
      return;
    }
    if (remainingTime <= LOW_TIME_THRESHOLD) {
      onLowTime();
    }
    const timer = setInterval(() => {
      setRemainingTime(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= LOW_TIME_THRESHOLD) {
          onLowTime();
        }
        if (newTime <= 0) {
          clearInterval(timer);
          onTimerEnd();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const isLowTime = remainingTime < LOW_TIME_THRESHOLD && remainingTime > 0;
  return (
    <View
      style={[
        timerStyles.timerContainer,
        isLowTime && timerStyles.timerContainerWarning,
      ]}>
      <Text
        style={[timerStyles.timerText, isLowTime && timerStyles.timerTextWarning]}>
        Time remaining: {formatTimer(remainingTime)}
      </Text>
    </View>
  );
});
const timerStyles = StyleSheet.create({
  timerContainer: {
    backgroundColor: '#E0F2F1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  timerText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#047857',
  },
  timerContainerWarning: { backgroundColor: '#FEF2F2' },
  timerTextWarning: { color: '#B91C1C' },
});

// --- Main BoostChat Component ---
const BoostChat = ({ navigation, route }) => {
  const {
    messages,
    getMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    connectSocket,
    socket,
  } = useChatStore();
  const { id, name, pic, expiredAt, sessionNumber } = route.params;
  const userDetails = useSelector(state => state.user);
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);

  const handleTimerEnd = useCallback(() => {
    setIsSessionActive(false);
    setShowLowTimeWarning(false);
  }, []);
  const handleLowTime = useCallback(() => {
    setShowLowTimeWarning(true);
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      const task = setTimeout(() => {
        if (formattedMessages.length > 0 && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      return () => clearTimeout(task);
    }, [formattedMessages]), // <-- 3. UPDATED DEPENDENCY
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !isSessionActive) return;
    await sendMessage({ text: message, userId: id, image: null });
    setMessage('');
  };

  const handleExtendPress = () => {
    navigation.navigate('BoostPayment', {
      id: id,
      name: name,
      pic: pic,
      amount: 199,
    });
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
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  const SessionEndedBanner = () => (
    <View style={styles.endedBanner}>
      <View>
        <Text style={styles.endedTitle}>Session Ended</Text>
        <Text style={styles.endedSubtitle}>
          Your 20-minute session has ended.
        </Text>
      </View>
      {sessionNumber < 3 && (
        <TouchableOpacity
          style={styles.extendButton}
          onPress={handleExtendPress}>
          <Text style={styles.extendButtonText}>Extend Session</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const DailyLimitBanner = () => (
    <View style={styles.endedBanner}>
      <View>
        <Text style={styles.endedTitle}>Daily Limit Reached</Text>
        <Text style={styles.endedSubtitle}>
          You can purchase a new session tomorrow.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.okButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.extendButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooterBanner = () => {
    if (isSessionActive) {
      return null;
    }
    if (sessionNumber >= 3) {
      return <DailyLimitBanner />;
    }
    return <SessionEndedBanner />;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerButton}>
              <Ionicons name="chevron-back" size={20} color="#333" />
            </TouchableOpacity>
            <Image source={{ uri: pic }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{name}</Text>
              <Timer
                expiredAt={expiredAt}
                onTimerEnd={handleTimerEnd}
                onLowTime={handleLowTime}
              />
            </View>
          </View>
          <View style={styles.headerRight}>
            {showLowTimeWarning && isSessionActive && sessionNumber < 3 && (
              <TouchableOpacity
                style={styles.extendHeaderButton}
                onPress={handleExtendPress}>
                <Text style={styles.extendHeaderButtonText}>Extend</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flexGrow}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={flatListRef}
            data={formattedMessages}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.chatContentContainer}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />

          {renderFooterBanner()}

          {isSessionActive && (
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
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// Styles (No Changes)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexGrow: { backgroundColor: '#F7F9FC', flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { paddingLeft: 10 },
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
  extendHeaderButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  extendHeaderButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(1.6),
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
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 13,
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
    backgroundColor: 'white',
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
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  endedTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(2),
    color: '#B45309',
  },
  endedSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: responsiveFontSize(1.6),
    color: '#D97706',
  },
  extendButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  okButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  extendButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: responsiveFontSize(1.7),
  },
});
export default BoostChat;