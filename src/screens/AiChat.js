import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Pressable,
  Modal,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { DEEPSEEK_API_KEY } from '@env';
import axios from 'axios';
import { useSelector } from 'react-redux';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const REPORT_REASONS = ['Harmful Advice', 'Not about mental health', 'Inaccurate Information'];

const AiChat = ({ navigation }) => {

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  // Initial welcome message
  const initialMessage = {
    id: 'welcome-msg',
    text: 'Hi there! I\'m Luna, your personal AI mental health companion. How are you feeling today?',
    type: 'bot'
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [otherReportText, setOtherReportText] = useState('');
  const [messageToReport, setMessageToReport] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportedMessages, setReportedMessages] = useState({});
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // --- Fetch Chat History on Mount ---
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get('/luna/get', {
          headers: { Authorization: authToken },
        });

        if (response?.data?.status_code === 200 && Array.isArray(response.data.data)) {
          const historyData = response.data.data.reverse();
          const formattedMessages = [];

          formattedMessages.push(initialMessage);

          historyData.forEach((item) => {
            formattedMessages.push({
              id: `${item._id}_user`,
              text: item.userPrompt,
              type: 'user',
              createdAt: item.createdAt,
            });
            formattedMessages.push({
              id: `${item._id}_ai`,
              text: item.aiPrompt,
              type: 'bot',
              createdAt: item.createdAt,
            });
          });

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (authToken) {
      fetchChatHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [authToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [messages]);

  // --- Save Chat to Backend ---
  const saveChatToBackend = async (userText, aiText) => {
    try {
      await axios.post(
        '/luna/send',
        {
          userPrompt: userText,
          aiPrompt: aiText,
        },
        {
          headers: { Authorization: authToken },
        }
      );
      console.log('Chat saved successfully');
    } catch (error) {
      console.error('Failed to save chat to backend:', error);
    }
  };

  const handleSend = useCallback(async () => {
    const cleanInput = input.replace(/^\s+|\s+$/g, '');

    if (cleanInput === '' || isAwaitingResponse) return;

    setIsAwaitingResponse(true);
    setInput('');

    const userMessage = { id: Date.now().toString(), text: cleanInput, type: 'user' };

    setMessages(prev => [...prev, userMessage, { id: 'typing', type: 'typing' }]);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "tngtech/deepseek-r1t2-chimera:free",
          messages: [
            {
              role: 'system',
              content:
                'You are Luna, an AI assistant specialized only in mental health support. You must respond only to questions about mental well-being, mental health issues like stress, anxiety, depression, self-care, and emotional support. For anything outside this domain, politely state that you can only assist with mental health topics. Do not use asterisks in your responses.',
            },
            { role: 'user', content: cleanInput },
          ],
        }),
      });

      const data = await res.json();
      let botReply = data?.choices?.[0]?.message?.content?.trim().replace(/\*/g, '');

      if (!botReply) {
        botReply = "I'm sorry, I couldn't generate a response. Could you please try rephrasing?";
      }

      const botMessage = { id: (Date.now() + 1).toString(), text: botReply, type: 'bot' };

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(botMessage));
      saveChatToBackend(cleanInput, botReply);

    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = { id: Date.now().toString(), text: 'Oops! I\'m having trouble connecting. Please try again in a moment.', type: 'bot' };
      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(errorMessage));
    } finally {
      setIsAwaitingResponse(false);
    }
  }, [input, isAwaitingResponse, authToken]);

  const handleLongPressMessage = (message) => {
    if (message.type === 'bot' && message.id !== 'welcome-msg') {
      setMessageToReport(message);
      setReportModalVisible(true);
    }
  };

  const handleReportSubmit = async () => {
    setIsSubmittingReport(true);

    const reportData = {
      report: selectedReportReason ? selectedReportReason : otherReportText
    };

    try {
      const response = await axios.post("/auth/report", reportData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      });

      if (response?.data?.status_code == 200) {
        setReportedMessages(prev => ({ ...prev, [messageToReport.id]: true }));
        closeReportModal();

        if (Platform.OS === 'android') {
          ToastAndroid.show(response?.data?.message, ToastAndroid.LONG);
        } else {
          Alert.alert("Info", response?.data?.message);
        }
      }

    } catch (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Failed to report response. Please try again.", ToastAndroid.LONG);
      } else {
        Alert.alert("Error", "Failed to report response. Please try again.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setMessageToReport(null);
    setSelectedReportReason('');
    setOtherReportText('');
  };

  const renderItem = ({ item }) => {
    if (item.type === 'typing') {
      return (
        <View style={styles.botMessageContainer}>
          <LottieView
            source={require('../assets/animations/typing.json')}
            autoPlay
            loop
            style={styles.typingAnimation}
          />
        </View>
      );
    }

    const isUser = item.type === 'user';
    const isReportedBotMessage = item.type === 'bot' && reportedMessages?.[item.id];

    if (isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <Pressable style={[styles.messageBubble, styles.userBubble]}>
            <Text style={[styles.messageText, { color: '#000' }]}>{item.text}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.botMessageContainer}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={isTablet ? 22 : 18} color="#FFFFFF" />
        </View>
        <Pressable
          onLongPress={() => handleLongPressMessage(item)}
          style={[
            styles.messageBubble,
            styles.botBubble,
            isReportedBotMessage && styles.reportedBotBubble
          ]}
          android_ripple={item.id === 'welcome-msg' ? null : { color: '#E5E7EB' }}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </Pressable>
        {isReportedBotMessage && (
          <View style={styles.flagContainer}>
            <Ionicons name="flag" size={16} color="#B91C1C" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle='dark-content' backgroundColor='#fff' />

        {/* --- Info Modal --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isInfoModalVisible}
          onRequestClose={() => setInfoModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>How to Use</Text>
              <View style={styles.infoPoint}>
                <View style={[styles.iconBackground, styles.iconBackground1]}>
                  <Ionicons name="chatbubble-ellipses" size={isTablet ? 32 : responsiveFontSize(2.8)} color="#0369A1" />
                </View>
                <Text style={styles.modalText}>Talk to Luna about your feelings, stress, or anything on your mind.</Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={[styles.iconBackground, styles.iconBackground2]}>
                  <Ionicons name="shield-checkmark" size={isTablet ? 32 : responsiveFontSize(2.8)} color="#047857" />
                </View>
                <Text style={styles.modalText}>Your conversations are private and designed to be a safe space.</Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={[styles.iconBackground, styles.iconBackground3]}>
                  <Ionicons name="flag" size={isTablet ? 32 : responsiveFontSize(2.8)} color="#B45309" />
                </View>
                <Text style={styles.modalText}>Long-press on a message from Luna to report any issues or inaccuracies.</Text>
              </View>
              <Pressable
                style={[styles.modalButton, styles.modalButtonClose]}
                onPress={() => setInfoModalVisible(false)}>
                <Text style={styles.modalButtonText}>Got It</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* --- Report Modal --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isReportModalVisible}
          onRequestClose={closeReportModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Report Message</Text>
              <Text style={styles.modalSubText}>Why are you reporting this message? Your feedback helps us improve.</Text>
              {REPORT_REASONS.map((reason) => (
                <Pressable key={reason} style={[styles.reportOption, selectedReportReason === reason && styles.reportOptionSelected]} onPress={() => setSelectedReportReason(reason)}>
                  <Text style={[styles.reportOptionText, selectedReportReason === reason && styles.reportOptionTextSelected]}>{reason}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.reportOption, selectedReportReason === 'Others' && styles.reportOptionSelected]} onPress={() => setSelectedReportReason('Others')}>
                <Text style={[styles.reportOptionText, selectedReportReason === 'Others' && styles.reportOptionTextSelected]}>Others</Text>
              </Pressable>
              {selectedReportReason === 'Others' && (
                <TextInput style={styles.reportInput} placeholder="Please specify the reason..." placeholderTextColor="#9CA3AF" value={otherReportText} onChangeText={setOtherReportText} multiline />
              )}
              <Pressable style={[styles.modalButton, styles.submitButton, (!selectedReportReason || (selectedReportReason === 'Others' && !otherReportText.trim())) && styles.disabledSendButton]} onPress={handleReportSubmit} disabled={!selectedReportReason || (selectedReportReason === 'Others' && !otherReportText.trim())}>
                {isSubmittingReport ? <ActivityIndicator color={'#fff'} size={'small'} /> : <Text style={styles.modalButtonText}>Submit</Text>}
              </Pressable>

              <Pressable onPress={closeReportModal} style={{ marginTop: responsiveHeight(1.5) }}>
                <Text style={{ textAlign: 'center', fontFamily: 'Poppins-Medium', color: '#6B7280', fontSize: isTablet ? responsiveFontSize(1.2) : undefined }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={isTablet ? 30 : responsiveFontSize(2.8)} color={'#1F2937'} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Ionicons name="sparkles" size={isTablet ? 24 : responsiveFontSize(2.8)} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Luna</Text>
              <Text style={styles.headerSubtitle}>AI Mental Health Companion</Text>
            </View>
            <TouchableOpacity onPress={() => setInfoModalVisible(true)}>
              <Ionicons name="information-circle" size={isTablet ? 40 : responsiveFontSize(3.2)} color={'#1F2937'} />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          {isLoadingHistory ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Input Area */}
          <View style={styles.inputWrapper}>
            {/* Wrapper enables centering and sizing on tablets */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Ask about your well-being ..."
                value={input}
                onChangeText={setInput}
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Pressable
                onPress={handleSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!input.trim() || isAwaitingResponse) && styles.disabledSendButton,
                  pressed && styles.sendButtonPressed
                ]}
                disabled={!input.trim() || isAwaitingResponse}
              >
                <Ionicons name="send" size={isTablet ? 24 : 20} color={'#FFFFFF'} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: isTablet ? responsiveHeight(7.5) : undefined,
    paddingBottom: 8
  },
  backButton: {
    padding: 5,
    marginRight: isTablet ? 20 : 10,
  },
  headerAvatar: {
    width: isTablet ? 45 : 35,
    height: isTablet ? 45 : 35,
    borderRadius: isTablet ? 22.5 : 20,
    marginRight: 15,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.0),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  listContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 5,
  },
  botMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 5,
    alignItems: 'flex-end'
  },
  avatar: {
    width: isTablet ? 40 : 30,
    height: isTablet ? 40 : 30,
    borderRadius: isTablet ? 20 : 16,
    marginRight: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    padding: 20,
    borderRadius: 20,
    // Tablet Fix: Restrict max width so bubbles don't stretch too far
    maxWidth: isTablet ? '65%' : '80%',
  },
  userBubble: {
    backgroundColor: '#bdd0f9',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
  },
  reportedBotBubble: {
    backgroundColor: '#FEE2E2',
  },
  messageText: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Medium',
    // lineHeight: isTablet ? 0 : 0,
    color: '#111827',
  },
  typingAnimation: {
    width: isTablet ? 35 : 25,
    height: isTablet ? 35 : 25,
    marginLeft: 40,
  },
  flagContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  // New Wrapper for Input to handle centering on Tablet
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Tablet Fix: Center and restrict width, float slightly
    width: isTablet ? '75%' : '100%',
    alignSelf: 'center',
    backgroundColor: isTablet ? '#F3F4F6' : 'transparent',
    borderRadius: isTablet ? 30 : 0,
    paddingHorizontal: isTablet ? 10 : 0,
    paddingVertical: isTablet ? 5 : 0,
    marginBottom: isTablet ? 10 : 0, // Float slightly on iPad
  },
  textInput: {
    flex: 1,
    backgroundColor: isTablet ? 'transparent' : '#F3F4F6', // Transparent if container is already colored
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: isTablet ? 18 : 14,
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonPressed: {
    backgroundColor: '#1D4ED8',
  },
  disabledSendButton: {
    backgroundColor: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    margin: responsiveWidth(5),
    backgroundColor: 'white',
    borderRadius: isTablet ? 30 : 20,
    padding: responsiveWidth(6),
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    // Tablet Fix: Constrain Modal Width
    width: isTablet ? '70%' : '90%'
  },
  modalTitle: {
    marginBottom: responsiveHeight(3),
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? responsiveFontSize(1.6) : responsiveFontSize(2.2),
    color: '#111827'
  },
  modalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    color: '#4B5563',
    flexShrink: 1
  },
  modalSubText: {
    marginBottom: responsiveHeight(2),
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.6),
    color: '#6B7280'
  },
  infoPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2.5)
  },
  iconBackground: {
    width: isTablet ? 50 : responsiveHeight(5.5),
    height: isTablet ? 50 : responsiveHeight(5.5),
    borderRadius: isTablet ? 25 : responsiveHeight(2.75),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth(4)
  },
  iconBackground1: { backgroundColor: '#E0F2FE' },
  iconBackground2: { backgroundColor: '#D1FAE5' },
  iconBackground3: { backgroundColor: '#FEF3C7' },
  modalButton: {
    borderRadius: 10,
    padding: responsiveHeight(1.5),
    elevation: 2,
    marginTop: responsiveHeight(2)
  },
  modalButtonClose: { backgroundColor: '#2563EB' },
  modalButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8)
  },
  reportOption: {
    backgroundColor: '#F3F4F6',
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 8,
    marginVertical: responsiveHeight(0.6),
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  reportOptionSelected: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  reportOptionText: {
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7)
  },
  reportOptionTextSelected: { color: '#1E40AF' },
  reportInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.7),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    minHeight: responsiveHeight(10),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: responsiveHeight(1.2)
  },
  submitButton: { backgroundColor: '#2563EB' },
});

export default AiChat;