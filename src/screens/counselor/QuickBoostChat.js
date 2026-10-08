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
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import { useFocusEffect } from '@react-navigation/native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { primary } from '../../utils/colors';
import { useSelector } from 'react-redux';
import { useChatStore } from '../../hooks/useChatStore';
import { useContentFilter } from '../../hooks/useContentFilter';
import moment from 'moment';
import axios from 'axios';

const COLORS = {
  bg: '#F1F5F9',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#64748B',
  primary: primary || '#2563EB',
  inputBg: '#FFFFFF',
  danger: '#EF4444',
  success: '#10B981',
};

const QuickBoostChat = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const fSize = (s) => (isTablet ? responsiveFontSize(s * 0.7) : responsiveFontSize(s));

  const {
    messages,
    getMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    connectSocket,
    socket,
  } = useChatStore();

  const { checkContent } = useContentFilter();
  const { id, name, pic } = route.params;
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [message, setMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
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

  const getDateLabel = (dateStr) => {
    const date = moment(dateStr);
    if (date.isSame(moment(), 'day')) return 'Today';
    if (date.isSame(moment().subtract(1, 'days'), 'day')) return 'Yesterday';
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
    // Trim the message to remove leading/trailing whitespace
    const trimmedMessage = message.trim();

    // Check if the message is empty after trimming
    if (!trimmedMessage) return;

    // Use the trimmed message for the content filter check
    const isSafe = checkContent(trimmedMessage, () => {
      Alert.alert(
        "Safety Notice",
        "Your message contains language that violates professional standards."
      );
      setMessage('');
    });

    if (!isSafe) return;

    // Send the clean, trimmed message
    await sendMessage({ text: trimmedMessage, userId: id, image: null });

    // Clear the input
    setMessage('');
  };

  const handleBlockUser = async () => {
    setIsBlocking(true);
    try {
      const response = await axios.post(
        "/blockuser",
        { blockUser: id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken,
          },
        }
      );

      if (response?.data?.status_code === 201) {
        setShowConfirmModal(false);
        navigation.navigate('QuickBoost');
      }
    } catch (error) {
      console.log('Block failed:', error);
      Alert.alert("Error", "Could not block user. Please try again.");
    } finally {
      setIsBlocking(false);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeaderContainer}>
          <Text style={[styles.dateHeaderText, { fontSize: fSize(1.3) }]}>{item.label}</Text>
        </View>
      );
    }
    const isMyMessage = item.senderId === userDetails?._id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMsgCont : styles.theirMsgCont]}>
        <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMyMessage && styles.myMsgText, { fontSize: fSize(1.7) }]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMyMessage ? styles.myTime : styles.theirTime, { fontSize: fSize(1.1) }]}>
            {moment(item.createdAt).format('h:mm A')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>

          <View style={styles.headerCore}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: pic }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { fontSize: fSize(1.9) }]} numberOfLines={1}>{name}</Text>
              <Text style={[styles.statusText, { fontSize: fSize(1.3) }]}>Session Active</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* --- KEY FIX: KeyboardAvoidingView configuration --- */}
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatArea}>
            <FlatList
              ref={flatListRef}
              data={formattedMessages}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listPadding}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>

          {/* --- Input Area --- */}
          <View style={[styles.inputWrapper, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 12 }]}>
            <View style={styles.inputBar}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textLight}
                style={[styles.input, { fontSize: fSize(1.7) }]}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: message.trim() ? COLORS.primary : '#E2E8F0' }]}
                onPress={handleSendMessage}
                disabled={!message.trim()}
              >
                <Feather name="send" size={18} color={message.trim() ? "#FFF" : COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* --- Modals --- */}
        <Modal
          isVisible={menuVisible}
          onBackdropPress={() => setMenuVisible(false)}
          animationIn="fadeInRight"
          animationOut="fadeOutRight"
          backdropOpacity={0.15}
          style={styles.menuModal}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => setShowConfirmModal(true), 400);
              }}
            >
              <View style={styles.dangerIconBox}>
                <Ionicons name="ban" size={16} color={COLORS.danger} />
              </View>
              <Text style={styles.menuItemText}>Block User</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          isVisible={showConfirmModal}
          onBackdropPress={() => !isBlocking && setShowConfirmModal(false)}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.3}
        >
          <View style={styles.confirmCard}>
            <Ionicons name="alert-circle" size={50} color={COLORS.danger} />
            <Text style={styles.confirmTitle}>End Session & Block?</Text>
            <Text style={styles.confirmSub}>You won't receive further messages from {name}.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelActionBtn} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelActionText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.blockActionBtn} onPress={handleBlockUser} disabled={isBlocking}>
                {isBlocking ? <ActivityIndicator color="#FFF" /> : <Text style={styles.blockActionText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flexOne: { flex: 1 },
  chatArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    zIndex: 10,
  },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  headerCore: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9' },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  headerInfo: { marginLeft: 12, flex: 1 },
  headerTitle: { fontFamily: 'Poppins-SemiBold', color: COLORS.textDark, marginBottom: -2 },
  statusText: { fontFamily: 'Poppins-Medium', color: COLORS.success },
  listPadding: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  dateHeaderContainer: { alignSelf: 'center', backgroundColor: 'rgba(203, 213, 225, 0.4)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginBottom: 20 },
  dateHeaderText: { fontFamily: 'Poppins-Medium', color: COLORS.textLight },
  messageContainer: { marginVertical: 6, width: '100%' },
  myMsgCont: { alignItems: 'flex-end' },
  theirMsgCont: { alignItems: 'flex-start' },
  bubble: { padding: 12, paddingHorizontal: 16, borderRadius: 20, maxWidth: '82%', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4 },
  msgText: { fontFamily: 'Poppins-Regular', lineHeight: 22 },
  myMsgText: { color: COLORS.white },
  timeText: { fontFamily: 'Poppins-Regular', marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: COLORS.textLight },
  inputWrapper: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 4, borderWidth: 1, borderColor: '#F1F5F9' },
  input: { flex: 1, color: COLORS.textDark, maxHeight: 100, fontFamily: 'Poppins-Regular' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  menuModal: { margin: 0, alignItems: 'flex-end', justifyContent: 'flex-start' },
  menuCard: { marginTop: Platform.OS === 'ios' ? 110 : 70, marginRight: 20, backgroundColor: COLORS.white, borderRadius: 16, width: 170, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dangerIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuItemText: { fontSize: responsiveFontSize(1.7), includeFontPadding: false, fontFamily: 'Poppins-Medium', color: COLORS.danger },
  confirmCard: { backgroundColor: COLORS.white, borderRadius: 28, padding: 24, alignItems: 'center' },
  confirmTitle: { includeFontPadding: false, fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.2), color: COLORS.textDark, marginTop: 12 },
  confirmSub: { fontFamily: 'Poppins-Regular', fontSize: responsiveFontSize(1.6), color: COLORS.textLight, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', width: '100%' },
  cancelActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', marginRight: 10 },
  blockActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.danger, alignItems: 'center' },
  cancelActionText: { fontFamily: 'Poppins-SemiBold', color: COLORS.textLight, includeFontPadding: false },
  blockActionText: { fontFamily: 'Poppins-SemiBold', color: COLORS.white, includeFontPadding: false },
});

export default QuickBoostChat;