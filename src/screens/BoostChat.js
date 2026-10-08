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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../utils/colors';
import { useSelector } from 'react-redux';
import { useChatStore } from '../hooks/useChatStore';
import { useContentFilter } from '../hooks/useContentFilter';
import moment from 'moment';
import axios from 'axios';

// --- Custom Alert Component ---
const CustomAlert = ({ visible, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel", isDestructive = false }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={alertStyles.overlay}>
      <View style={alertStyles.alertBox}>
        <Text style={alertStyles.title}>{title}</Text>
        <Text style={alertStyles.message}>{message}</Text>
        <View style={alertStyles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity style={alertStyles.button} onPress={onCancel}>
              <Text style={alertStyles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[alertStyles.button, isDestructive ? alertStyles.destructiveBtn : alertStyles.confirmBtn]}
            onPress={onConfirm}
          >
            <Text style={alertStyles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// --- Timer Component ---
const LOW_TIME_THRESHOLD = 3 * 60;

const parseExpiredAt = dateString => {
  const parts = dateString.split(', ');
  const dateParts = parts[0].split('/');
  const timeParts = parts[1].split(':');
  return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
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
    if (remainingTime <= 0) { onTimerEnd(); return; }
    if (remainingTime <= LOW_TIME_THRESHOLD) onLowTime();
    const timer = setInterval(() => {
      setRemainingTime(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= LOW_TIME_THRESHOLD) onLowTime();
        if (newTime <= 0) { clearInterval(timer); onTimerEnd(); return 0; }
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

const BoostChat = ({ navigation, route }) => {
  const { messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, connectSocket, socket } = useChatStore();
  const { checkContent } = useContentFilter();
  const { id, name, pic, expiredAt, sessionNumber } = route.params;

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', onConfirm: () => { }, onCancel: null, confirmText: 'OK', isDestructive: false
  });

  const handleTimerEnd = useCallback(() => {
    setIsSessionActive(false);
    setShowLowTimeWarning(false);
  }, []);

  const handleLowTime = useCallback(() => setShowLowTimeWarning(true), []);

  useEffect(() => { connectSocket(); }, [connectSocket]);

  useEffect(() => {
    if (socket && id) {
      getMessages(id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [socket, id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  const formattedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    let lastDateLabel = null;
    const formatted = [];
    messages.forEach(msg => {
      const date = moment(msg.createdAt);
      const label = date.isSame(moment(), 'd') ? 'Today' : date.isSame(moment().subtract(1, 'd'), 'd') ? 'Yesterday' : date.format('MMMM D, YYYY');
      if (label !== lastDateLabel) {
        formatted.push({ type: 'header', label, _id: `header-${label}` });
        lastDateLabel = label;
      }
      formatted.push({ type: 'message', ...msg });
    });
    return formatted;
  }, [messages]);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [formattedMessages])
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !isSessionActive) return;

    const isSafe = checkContent(message, () => {
      setAlertConfig({
        visible: true,
        title: "Action Required",
        message: "Your message contains language that violates our safety guidelines. Please keep the conversation respectful.",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        confirmText: "Understood"
      });
      setMessage('');
    });

    if (!isSafe) return;

    await sendMessage({ text: message, userId: id, image: null });
    setMessage('');
  };

  const handleBlockUser = async () => {
    setMenuVisible(false);
    setAlertConfig({
      visible: true,
      title: "Block User",
      message: `Are you sure you want to block ${name}?`,
      confirmText: "Block",
      isDestructive: true,
      onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      onConfirm: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        try {
          const response = await axios.post("/blockuser", { blockUser: id }, { headers: { "Content-Type": "application/json", Authorization: authToken } });
          if (response?.data?.status_code === 201) {
            navigation.navigate('Main', { screen: 'Boost' });
          }
        } catch (error) {
          console.log('Blocking failed: ', error);
        }
      }
    });
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') return <View style={styles.dateHeaderContainer}><Text style={styles.dateHeaderText}>{item.label}</Text></View>;
    const isMyMessage = item.senderId === userDetails?._id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.text}</Text>
        </View>
        <Text style={styles.messageTime}>{moment(item.createdAt).format('h:mm A')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <CustomAlert {...alertConfig} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}><Ionicons name="chevron-back" size={20} color="#333" /></TouchableOpacity>
            <Image source={{ uri: pic }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{name}</Text>
              <Timer expiredAt={expiredAt} onTimerEnd={handleTimerEnd} onLowTime={handleLowTime} />
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}><Ionicons name="ellipsis-vertical" size={22} color="#333" /></TouchableOpacity>
          </View>
        </View>

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
            showsVerticalScrollIndicator={false}
          />

          {isSessionActive && (
            <View style={styles.inputContainer}>
              <TextInput value={message} onChangeText={setMessage} placeholder="Type a message..." placeholderTextColor={'#888'} style={styles.textInput} multiline />
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

const alertStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 340, alignItems: 'center' },
  title: { fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.2), color: '#111', marginBottom: 10, textAlign: 'center' },
  message: { fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.7), color: '#666', textAlign: 'center', marginBottom: 25 },
  buttonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  confirmBtn: { backgroundColor: primary },
  destructiveBtn: { backgroundColor: '#DC2626' },
  confirmText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(1.7) },
  cancelText: { color: '#666', fontFamily: 'Poppins-SemiBold', fontSize: responsiveFontSize(1.7) },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexGrow: { backgroundColor: '#F7F9FC', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 5 },
  menuButton: { padding: 8, marginLeft: 5 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  headerInfo: { justifyContent: 'center', flex: 1 },
  headerTitle: { fontSize: responsiveFontSize(2.1), fontFamily: 'Poppins-SemiBold', color: '#111' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  menuCard: { position: 'absolute', top: Platform.OS === 'ios' ? 110 : 60, right: 20, backgroundColor: '#fff', borderRadius: 12, width: 160, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  menuItemText: { fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Medium', color: '#DC2626', marginLeft: 10, includeFontPadding: false },
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
});

const timerStyles = StyleSheet.create({
  timerContainer: { backgroundColor: '#E0F2F1', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start', marginTop: 2 },
  timerText: { fontSize: responsiveFontSize(1.5), fontFamily: 'Poppins-SemiBold', color: '#047857' },
  timerContainerWarning: { backgroundColor: '#FEF2F2' },
  timerTextWarning: { color: '#B91C1C' },
});

export default BoostChat;