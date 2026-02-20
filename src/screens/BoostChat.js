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
  Modal,
  TouchableWithoutFeedback,
  Alert,
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
import axios from 'axios';

// --- Timer Component ---
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
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
    <View style={[timerStyles.timerContainer, isLowTime && timerStyles.timerContainerWarning]}>
      <Text style={[timerStyles.timerText, isLowTime && timerStyles.timerTextWarning]}>
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

  // const { id, name, pic, expiredAt, sessionNumber } = route.params;
  // Test Data
  const id = "668bf83f4dff15c7125a153f";
  const name = "Radhika Juneja";
  const expiredAt = "21/02/2026, 18:00:00";
  const pic = "https://res.cloudinary.com/dpgjafewx/image/upload/v1720517538/mmmg2pdwj09rw2xcdhuo.jpg";
  const sessionNumber = 1;

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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
    if (!message.trim() || !isSessionActive) return;
    await sendMessage({ text: message, userId: id, image: null });
    setMessage('');
  };

  const handleBlockUser = async () => {
    setMenuVisible(false);
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              // Replace with your actual base URL
              const response = await axios.post(
                "/blockuser",
                {
                  blockUser: "668bf6d44dff15c7125a151f", // ID of the user to block
                  reason: "test"
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: authToken,
                  },
                }
              );

              console.log('Block User Response: ', response);

              if (response.data.status_code === 201) {
                Alert.alert("Blocked", "This user has been blocked.");
                navigation.navigate('Boost');
              }
            } catch (error) {
              console.log('Blocking failed: ', error);
            }
          }
        }
      ]
    );
  };

  const handleUnblockUser = async () => {

  };

  const handleExtendPress = () => {
    navigation.navigate('BoostPayment', { id, name, pic, amount: 199 });
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
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.text}</Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Updated Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={20} color="#333" />
            </TouchableOpacity>
            <Image source={{ uri: pic }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{name}</Text>
              <Timer expiredAt={expiredAt} onTimerEnd={handleTimerEnd} onLowTime={handleLowTime} />
            </View>
          </View>

          <View style={styles.headerRight}>
            {showLowTimeWarning && isSessionActive && sessionNumber < 3 && (
              <TouchableOpacity style={styles.extendHeaderButton} onPress={handleExtendPress}>
                <Text style={styles.extendHeaderButtonText}>Extend</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
                  <Ionicons name="ban-outline" size={18} color="#DC2626" />
                  <Text style={styles.menuItemText}>Block User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <KeyboardAvoidingView style={styles.flexGrow} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={flatListRef}
            data={formattedMessages}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.chatContentContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />

          {!isSessionActive && (
            <View style={styles.endedBanner}>
              <View>
                <Text style={styles.endedTitle}>Session Ended</Text>
                <Text style={styles.endedSubtitle}>Your session has expired.</Text>
              </View>
              {sessionNumber < 3 && (
                <TouchableOpacity style={styles.extendButton} onPress={handleExtendPress}>
                  <Text style={styles.extendButtonText}>Extend</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
                style={[styles.sendButton, { backgroundColor: message.trim() ? primary : '#B0C4DE' }]}
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 5 },
  menuButton: { padding: 8, marginLeft: 5 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  headerInfo: { justifyContent: 'center', flex: 1 },
  headerTitle: { fontSize: responsiveFontSize(2.1), fontFamily: 'Poppins-SemiBold', color: '#111' },
  extendHeaderButton: { backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  extendHeaderButtonText: { color: '#fff', fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(1.6) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  menuCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 60,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 160,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  menuItemText: { fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Medium', color: '#DC2626', marginLeft: 10 },
  chatContentContainer: { paddingTop: 10, paddingBottom: 5, paddingHorizontal: 12, flexGrow: 1 },
  dateHeaderContainer: { alignSelf: 'center', marginVertical: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#E5E7EB' },
  dateHeaderText: { fontSize: responsiveFontSize(1.5), fontFamily: 'Poppins-Medium', color: '#4B5563' },
  messageContainer: { marginVertical: 4 },
  myMessageContainer: { alignItems: 'flex-end' },
  theirMessageContainer: { alignItems: 'flex-start' },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, maxWidth: '80%' },
  myMessageBubble: { backgroundColor: primary, borderBottomRightRadius: 5 },
  theirMessageBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5, elevation: 1 },
  messageText: { fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Regular', color: '#111' },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: responsiveFontSize(1.3), fontFamily: 'Poppins-Regular', color: '#A0A0A0', marginTop: 4, marginHorizontal: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  textInput: { flex: 1, backgroundColor: '#F7F9FC', borderRadius: 100, paddingHorizontal: 22, paddingVertical: 12, fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Regular', color: '#111', marginRight: 10 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  endedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFBEB', padding: 14, borderTopWidth: 1, borderTopColor: '#FDE68A' },
  endedTitle: { fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2), color: '#B45309' },
  endedSubtitle: { fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.6), color: '#D97706' },
  extendButton: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11 },
  extendButtonText: { color: '#fff', fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(1.7) },
});

export default BoostChat;