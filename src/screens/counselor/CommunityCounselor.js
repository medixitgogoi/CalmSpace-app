import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

// Local Imports
import { primary, background, lightPrimary } from '../../utils/colors';
import { fetchPosts } from '../../utils/fetchPosts';
import { fetchReplies } from '../../utils/fetchReplies';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { useContentFilter } from '../../hooks/useContentFilter'; // Import the hook

const CommunityCounselor = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => (width > 768 ? responsiveFontSize(s * 0.7) : responsiveFontSize(s));

  const { checkContent } = useContentFilter(); // Initialize the filter
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const currentUserId = userDetails?._id;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [details, setDetails] = useState(null);

  // Modal States
  const [isWritePostModalVisible, setWritePostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Reporting States
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Safety Notification Helper
  const showSafetyNotice = () => {
    Alert.alert(
      "Community Safety",
      "Your post contains language that violates our community standards. Please keep the conversation supportive and professional.",
      [{ text: "I Understand", onPress: () => { } }]
    );
  };

  const handleReportPost = async () => {
    if (reportReason.trim() === '') {
      if (Platform.OS === 'android') ToastAndroid.show("Please provide a reason.", ToastAndroid.SHORT);
      return;
    }
    setIsReporting(true);
    try {
      const response = await axios.post('/comunity/report-post', {
        postId: String(selectedPostId),
        reason: reportReason.trim()
      }, {
        headers: { "Content-Type": "application/json", Authorization: authToken },
      });
      if (response?.data?.status_code === 201) {
        Alert.alert("Report Submitted", "Thank you for helping us keep the community safe.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit report.");
    } finally {
      setIsReporting(false);
      setReportModalVisible(false);
      setReportReason('');
      setSelectedPostId(null);
      fetchScreenData();
    }
  };

  const PostCard = React.memo(({ post, fetchReplies, authToken, onReportPress }) => {
    const formattedTimestamp = moment(post.createdAt).fromNow();
    const isOwner = post?.userId?._id === currentUserId;

    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [isReplyInputVisible, setIsReplyInputVisible] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [isLiked, setIsLiked] = useState(post?.myLikes || false);
    const [likeCount, setLikeCount] = useState(post.reactionCount || 0);

    const handleLike = async () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
      try {
        await axios.post(`/comunity/add-reaction/${post?._id}`, {}, {
          headers: { Authorization: authToken },
        });
      } catch (error) {
        setIsLiked(post?.myLikes);
        setLikeCount(post.reactionCount);
      }
    };

    const handleReply = async () => {
      const trimmedReply = replyContent.trim();
      if (trimmedReply === '') return;

      // Filter Reply Content
      const isSafe = checkContent(trimmedReply, () => {
        showSafetyNotice();
        setReplyContent('');
      });
      if (!isSafe) return;

      setIsReplying(true);
      try {
        const response = await axios.post(`/comunity/replypost`, { text: trimmedReply, postId: post?._id }, {
          headers: { "Content-Type": "application/json", Authorization: authToken },
        });
        if (response?.data?.status_code === 200) {
          setReplyContent('');
          setIsReplyInputVisible(false);
          const updated = await fetchReplies(post?._id, authToken);
          if (updated) setReplies(updated);
        }
      } finally {
        setIsReplying(false);
      }
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post?.userId?.pic }} style={styles.profilePic} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontSize: fSize(1.9) }]}>{post?.userId?.name || 'User'}</Text>
            <Text style={[styles.timestamp, { fontSize: fSize(1.5) }]}>{formattedTimestamp}</Text>
          </View>
          {!isOwner && (
            <TouchableOpacity onPress={() => onReportPress(post._id)} style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.postContent, { fontSize: fSize(1.8) }]}>{post?.text}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? '#E91E63' : primary} />
            <Text style={[styles.actionText, { color: isLiked ? '#E91E63' : primary, fontSize: fSize(1.6) }]}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsReplyInputVisible(!isReplyInputVisible)} style={styles.actionButton}>
            <Ionicons name="chatbox-outline" size={20} color={primary} />
            <Text style={[styles.actionText, { fontSize: fSize(1.6) }]}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => {
            setShowReplies(!showReplies);
            if (!showReplies && replies.length === 0) {
              setLoadingReplies(true);
              const data = await fetchReplies(post?._id, authToken);
              setReplies(data || []);
              setLoadingReplies(false);
            }
          }} style={styles.actionButton}>
            <Ionicons name={showReplies ? "eye-off-outline" : "eye-outline"} size={20} color={primary} />
            <Text style={[styles.actionText, { fontSize: fSize(1.6) }]}>{showReplies ? 'Hide' : 'View'}</Text>
          </TouchableOpacity>
        </View>

        {isReplyInputVisible && (
          <View style={styles.replyInputSection}>
            <TextInput
              style={styles.replyTextInput}
              placeholder="Write your reply..."
              multiline={true}
              value={replyContent}
              onChangeText={setReplyContent}
            />
            <TouchableOpacity
              style={[styles.submitReplyButton, replyContent.trim() === '' && styles.disabledButton]}
              onPress={handleReply}
              disabled={isReplying || replyContent.trim() === ''}>
              {isReplying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitReplyButtonText}>Submit Reply</Text>}
            </TouchableOpacity>
          </View>
        )}

        {showReplies && (
          <View style={styles.repliesSection}>
            {loadingReplies ? <ActivityIndicator size="small" color={primary} /> :
              replies.map((reply) => (
                <View key={reply._id} style={styles.replyCard}>
                  <Image source={{ uri: reply?.userId?.pic }} style={styles.replyProfilePic} />
                  <View style={styles.replyContentContainer}>
                    <Text style={[styles.replyUserName, { fontSize: fSize(1.7) }]}>{reply?.userId?.name || 'User'}</Text>
                    <Text style={[styles.replyText, { fontSize: fSize(1.6) }]}>{reply?.text}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}
      </View>
    );
  });

  const fetchScreenData = useCallback(async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const [counselorData, postsData] = await Promise.all([
        getCounselorByID(authToken),
        fetchPosts(authToken)
      ]);
      setDetails(counselorData);
      setPosts(postsData || []);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [authToken, isRefreshing]);

  useFocusEffect(useCallback(() => { fetchScreenData(); }, [fetchScreenData]));

  const handleCreatePost = async () => {
    const trimmedPost = postContent.trim();
    if (trimmedPost === '') return;

    // Filter Post Content
    const isSafe = checkContent(trimmedPost, () => {
      showSafetyNotice();
      setPostContent('');
    });
    if (!isSafe) return;

    setIsPosting(true);
    try {
      const response = await axios.post("/comunity/sendpost", { text: trimmedPost }, {
        headers: { "Content-Type": "application/json", Authorization: authToken },
      });
      if (response?.data?.status_code === 200) {
        setPostContent('');
        setWritePostModalVisible(false);
        fetchScreenData();
      }
    } finally {
      setIsPosting(false);
    }
  };

  if (loading && !isRefreshing) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={primary} /></View>;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={'dark-content'} backgroundColor={background} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={'#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fSize(2.3) }]}>Calmspace Community</Text>
          <View style={{ width: 32 }} />
        </View>

        {!details ? (
          <View style={styles.centeredScreen}>
            <Ionicons name="information-circle-outline" size={80} color="#FF6B6B" />
            <Text style={styles.noticeText}>Please complete your profile before engaging.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddDetails')} style={styles.addDetailsButton}>
              <Text style={styles.addDetailsButtonText}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                fetchReplies={fetchReplies}
                authToken={authToken}
                onReportPress={(id) => { setSelectedPostId(id); setReportModalVisible(true); }}
              />
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.postListContainer}
            onRefresh={() => { setIsRefreshing(true); fetchScreenData(); }}
            refreshing={isRefreshing}
          />
        )}

        {details && (
          <TouchableOpacity style={styles.addPostButton} onPress={() => setWritePostModalVisible(true)}>
            <LinearGradient colors={['#0fb8ad', '#1fc8db']} style={styles.addPostButtonGradient}>
              <Ionicons name="add" size={30} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Report Modal */}
        <Modal isVisible={isReportModalVisible} onBackdropPress={() => setReportModalVisible(false)} style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Post</Text>
            <Text style={styles.modalMessage}>Why are you reporting this post?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Offensive content, Misinformation..."
              multiline={true}
              placeholderTextColor={'#000'}
              value={reportReason}
              onChangeText={setReportReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.writePostButton]} onPress={handleReportPost} disabled={isReporting}>
                {isReporting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.writePostButtonText}>Report</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Create Post Modal */}
        <Modal isVisible={isWritePostModalVisible} onBackdropPress={() => setWritePostModalVisible(false)} style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              multiline={true}
              value={postContent}
              placeholderTextColor={'#000'}
              onChangeText={setPostContent}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setWritePostModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.writePostButton]} onPress={handleCreatePost} disabled={isPosting}>
                {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.writePostButtonText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between', backgroundColor: '#fff' },
  headerTitle: { fontFamily: 'Poppins-SemiBold', color: '#000' },
  headerButton: { padding: 4 },
  postListContainer: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 100 },
  postCard: { backgroundColor: '#f6fcfc', borderRadius: 18, padding: 15, marginBottom: 15, elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profilePic: { width: 45, height: 45, borderRadius: 22.5, marginRight: 10, borderWidth: 1.5, borderColor: primary },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'Poppins-SemiBold', color: '#333' },
  timestamp: { fontFamily: 'Poppins-Regular', color: '#888' },
  menuButton: { padding: 5 },
  postContent: { fontFamily: 'Poppins-Regular', color: '#444', marginBottom: 15 },
  postActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 0.5, borderTopColor: lightPrimary },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 5, flex: 1, justifyContent: 'center' },
  actionText: { fontFamily: 'Poppins-Medium', marginLeft: 5, color: primary },
  addPostButton: { position: 'absolute', bottom: 30, right: 20, borderRadius: 35, width: 70, height: 70, elevation: 8 },
  addPostButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 35 },
  modalView: { margin: 0, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: background, borderRadius: 22, padding: 24, alignItems: 'center', width: '90%' },
  modalTitle: { fontFamily: 'Poppins-SemiBold', color: primary, marginBottom: 8 },
  modalMessage: { fontFamily: 'Poppins-Regular', color: '#555', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e0e0e0' },
  writePostButton: { backgroundColor: primary },
  cancelButtonText: { color: '#555', fontFamily: 'Poppins-Medium' },
  writePostButtonText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },
  textInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 15, width: '100%', minHeight: 120, textAlignVertical: 'top', marginBottom: 20, backgroundColor: '#fff' },
  replyInputSection: { marginTop: 15, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: lightPrimary },
  replyTextInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, width: '100%', marginBottom: 10, backgroundColor: '#fff' },
  submitReplyButton: { backgroundColor: primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  submitReplyButtonText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },
  disabledButton: { backgroundColor: '#a0a0a0' },
  repliesSection: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  replyCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, marginBottom: 8 },
  replyProfilePic: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
  replyContentContainer: { flex: 1 },
  replyUserName: { fontFamily: 'Poppins-Medium', color: '#444' },
  replyText: { color: '#666', fontFamily: 'Poppins-Regular' },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noticeText: { fontFamily: 'Poppins-Medium', textAlign: 'center', marginVertical: 25 },
  addDetailsButton: { backgroundColor: '#0ea5e9', height: 50, paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center' },
  addDetailsButtonText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },
});

export default CommunityCounselor;