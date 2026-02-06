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
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

// Local Imports
import { primary, secondary, background, lightPrimary } from '../../utils/colors';
import { fetchPosts } from '../../utils/fetchPosts';
import { fetchReplies } from '../../utils/fetchReplies';
import { getCounselorByID } from '../../utils/getCounselorByID';

// --- Constants ---
const MAX_CONTENT_WIDTH = 600;

// Helper for adaptive font sizing
const getAdaptiveFontSize = (size, width) => {
  return width > 768 ? responsiveFontSize(size * 0.7) : responsiveFontSize(size);
};

const CommunityCounselor = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fSize = (s) => getAdaptiveFontSize(s, width);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [isWritePostModalVisible, setWritePostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [details, setDetails] = useState(null);

  // Memoized ReplyCard
  const ReplyCard = React.memo(({ reply }) => {
    return (
      <View style={styles.replyCard}>
        <Image source={{ uri: reply?.userId?.pic }} style={styles.replyProfilePic} />
        <View style={styles.replyContentContainer}>
          <Text style={[styles.replyUserName, { fontSize: fSize(1.7) }]}>{reply?.userId?.name || 'User'}</Text>
          <Text style={[styles.replyText, { fontSize: fSize(1.6) }]}>{reply?.text}</Text>
        </View>
      </View>
    );
  });

  // Memoized PostCard
  const PostCard = React.memo(({ post, fetchReplies, authToken, onPostReplied }) => {
    const formattedTimestamp = moment(post.createdAt).fromNow();

    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [isReplyInputVisible, setIsReplyInputVisible] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // Like State
    const [isLiked, setIsLiked] = useState(post?.myLikes || false);
    const [likeCount, setLikeCount] = useState(post.reactionCount || 0);
    const [isUpdatingLike, setIsUpdatingLike] = useState(false);

    useEffect(() => {
      setIsLiked(post?.myLikes || false);
      setLikeCount(post.reactionCount || 0);
    }, [post.myLikes, post.reactionCount]);

    const handleLike = async () => {
      if (isUpdatingLike) return;
      setIsUpdatingLike(true);
      const previousLikedState = isLiked;
      const previousLikeCount = likeCount;

      setIsLiked(!isLiked);
      setLikeCount(prevCount => (isLiked ? prevCount - 1 : prevCount + 1));

      try {
        await axios.post(`/comunity/add-reaction/${post?._id}`, {}, {
          headers: { "Content-Type": "application/json", Authorization: authToken },
        });
      } catch (error) {
        setIsLiked(previousLikedState);
        setLikeCount(previousLikeCount);
        if (Platform.OS === 'android') ToastAndroid.show("Action failed.", ToastAndroid.SHORT);
      } finally {
        setIsUpdatingLike(false);
      }
    };

    const handleViewReplies = useCallback(async () => {
      setShowReplies(prev => !prev);
      if (!showReplies && replies.length === 0 && !loadingReplies) {
        setLoadingReplies(true);
        try {
          const data = await fetchReplies(post?._id, authToken);
          if (data) setReplies(data);
        } catch (error) {
          console.error('Error fetching replies: ', error);
        } finally {
          setLoadingReplies(false);
        }
      }
    }, [showReplies, replies.length, loadingReplies, post?._id, authToken]);

    const handleReply = useCallback(async () => {
      if (replyContent.trim() === '') return;
      setIsReplying(true);
      try {
        const response = await axios.post(`/comunity/replypost`, { text: replyContent, postId: post?._id }, {
          headers: { "Content-Type": "application/json", Authorization: authToken },
        });
        if (response?.data?.status_code === 200) {
          ToastAndroid.show("Reply sent!", ToastAndroid.LONG);
          setReplyContent('');
          setIsReplyInputVisible(false);
          if (showReplies) {
            const updatedReplies = await fetchReplies(post?._id, authToken);
            if (updatedReplies) setReplies(updatedReplies);
          }
          if (onPostReplied) onPostReplied(post._id);
        } else {
          ToastAndroid.show("Failed to send reply.", ToastAndroid.LONG);
        }
      } catch (error) {
        ToastAndroid.show("Failed to send reply.", ToastAndroid.LONG);
      } finally {
        setIsReplying(false);
      }
    }, [replyContent, post?._id, authToken, showReplies, onPostReplied]);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post?.userId?.pic }} style={styles.profilePic} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontSize: fSize(1.9) }]}>{post?.userId?.name || 'User'}</Text>
            <Text style={[styles.timestamp, { fontSize: fSize(1.5) }]}>{formattedTimestamp}</Text>
          </View>
        </View>

        <Text style={[styles.postContent, { fontSize: fSize(1.8) }]}>{post?.text}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, isUpdatingLike && { opacity: 0.5 }]}
            onPress={handleLike}
            disabled={isUpdatingLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? '#E91E63' : primary} />
            <Text style={[styles.actionText, { color: isLiked ? '#E91E63' : primary, fontSize: fSize(1.6) }]}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsReplyInputVisible(prev => !prev)} style={styles.actionButton}>
            <Ionicons name="chatbox-outline" size={20} color={primary} />
            <Text style={[styles.actionText, { color: primary, fontSize: fSize(1.6) }]}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewReplies} style={styles.actionButton}>
            <Ionicons name={showReplies ? "eye-off-outline" : "eye-outline"} size={20} color={primary} />
            <Text style={[styles.actionText, { color: primary, fontSize: fSize(1.6) }]}>
              {showReplies ? `Hide` : `View`}
            </Text>
          </TouchableOpacity>
        </View>

        {isReplyInputVisible && (
          <View style={styles.replyInputSection}>
            <TextInput
              style={[styles.replyTextInput, { fontSize: fSize(1.7) }]}
              placeholder="Write your reply..."
              placeholderTextColor="#888"
              multiline={true}
              value={replyContent}
              onChangeText={setReplyContent}
              editable={!isReplying}
            />
            <TouchableOpacity
              style={[styles.submitReplyButton, isReplying || replyContent.trim() === '' ? styles.disabledButton : {}]}
              onPress={handleReply}
              disabled={isReplying || replyContent.trim() === ''}>
              {isReplying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.submitReplyButtonText, { fontSize: fSize(1.7) }]}>Submit Reply</Text>}
            </TouchableOpacity>
          </View>
        )}

        {showReplies && (
          <View style={styles.repliesSection}>
            {loadingReplies ? <Text style={styles.loadingText}>Loading replies...</Text> : replies.length > 0 ? (
              replies.map((reply) => <ReplyCard key={reply._id} reply={reply} />)
            ) : <Text style={styles.noRepliesText}>No replies yet.</Text>}
          </View>
        )}
      </View>
    );
  });

  const toggleWritePostModal = useCallback(() => {
    setWritePostModalVisible(prev => !prev);
    if (isWritePostModalVisible && postContent.trim() !== '') setPostContent('');
  }, [isWritePostModalVisible, postContent]);

  const handleCreatePost = async () => {
    if (postContent.trim() === '') {
      if (Platform.OS === 'android') ToastAndroid.show("Post cannot be empty.", ToastAndroid.SHORT);
      else Alert.alert("Error", "Post cannot be empty.");
      return;
    }

    setIsPosting(true);
    try {
      const response = await axios.post("/comunity/sendpost", { text: postContent }, {
        headers: { "Content-Type": "application/json", Authorization: authToken },
      });
      if (response?.data?.status_code === 200) {
        if (Platform.OS === 'android') ToastAndroid.show(response?.data?.message, ToastAndroid.LONG);
        fetchScreenData();
      } else {
        if (Platform.OS === 'android') ToastAndroid.show(response?.data?.message || "Failed.", ToastAndroid.LONG);
      }
    } catch (error) {
      if (Platform.OS === 'android') ToastAndroid.show("Failed to create post.", ToastAndroid.LONG);
    } finally {
      setIsPosting(false);
      setWritePostModalVisible(false);
      setPostContent('');
    }
  };

  const fetchScreenData = useCallback(async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const [counselorData, postsData] = await Promise.all([
        getCounselorByID(authToken),
        fetchPosts(authToken)
      ]);
      if (counselorData) setDetails(counselorData);
      if (postsData) setPosts(postsData);
    } catch (error) {
      if (Platform.OS === 'android') ToastAndroid.show("Failed to load data.", ToastAndroid.LONG);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [authToken, isRefreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchScreenData();
    }, [fetchScreenData])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchScreenData();
  }, [fetchScreenData]);

  if (loading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={'large'} color={primary} />
      </View>
    )
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={'dark-content'} backgroundColor={background} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={'#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fSize(2.3) }]}>The Calmspace Community</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {!details ? (
          <View style={styles.centeredScreen}>
            <Ionicons name="information-circle-outline" size={isTablet ? 100 : 80} color="#FF6B6B" />
            <Text style={[styles.noticeText, { fontSize: fSize(2) }]}>
              Please complete your profile before engaging with the community.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddDetails')} style={[styles.addDetailsButton, { width: isTablet ? 300 : '100%' }]}>
              <Ionicons name="person-add-outline" size={22} color="#fff" />
              <Text style={[styles.addDetailsButtonText, { fontSize: fSize(2) }]}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, alignSelf: 'center' }}>
            <FlatList
              data={posts}
              renderItem={({ item }) => (
                <PostCard
                  post={item}
                  fetchReplies={fetchReplies}
                  authToken={authToken}
                />
              )}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.postListContainer}
              showsVerticalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
            />
          </View>
        )}

        {/* --- Floating Action Button --- */}
        {details && (
          <TouchableOpacity
            style={[
              styles.addPostButton,
              // Adjust position for tablets so it doesn't float too far right
              isTablet && { right: 40, bottom: 50 }
            ]}
            onPress={toggleWritePostModal}>
            <LinearGradient
              colors={['#0fb8ad', '#1fc8db']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addPostButtonGradient}>
              <Ionicons name="add" size={30} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* --- Modal --- */}
        <Modal
          isVisible={isWritePostModalVisible}
          onBackdropPress={toggleWritePostModal}
          onBackButtonPress={toggleWritePostModal}
          animationIn="zoomIn"
          animationOut="zoomOut"
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          style={styles.modalView}>
          <View style={[styles.modalContent, { width: isTablet ? 500 : '90%' }]}>
            <Text style={[styles.modalTitle, { fontSize: fSize(2.5) }]}>Create New Post</Text>
            <Text style={[styles.modalMessage, { fontSize: fSize(1.8) }]}>Ready to share your thoughts?</Text>
            <TextInput
              style={[styles.textInput, { fontSize: fSize(1.8) }]}
              placeholder="What's on your mind?"
              placeholderTextColor="#888"
              multiline={true}
              numberOfLines={6}
              value={postContent}
              onChangeText={setPostContent}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={toggleWritePostModal}>
                <Text style={[styles.cancelButtonText, { fontSize: fSize(1.8) }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.writePostButton]}
                onPress={handleCreatePost}
                disabled={isPosting || postContent.trim() === ''}>
                {isPosting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.writePostButtonText, { fontSize: fSize(1.8) }]}>Create Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default CommunityCounselor;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: lightPrimary,
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 4,
  },
  headerButtonPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  postListContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100, // Space for FAB
  },
  postCard: {
    backgroundColor: '#f6fcfc',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eefcfc'
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  timestamp: {
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },
  postContent: {
    fontFamily: 'Poppins-Regular',
    color: '#444',
    // lineHeight: 24,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: lightPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
    flex: 1,
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    marginLeft: 5,
  },
  addPostButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 35,
    width: 70,
    height: 70,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addPostButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: background,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Poppins-Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#555',
    fontFamily: 'Poppins-Medium',
  },
  writePostButton: {
    backgroundColor: primary,
  },
  writePostButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  repliesSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
  noRepliesText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  replyProfilePic: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  replyContentContainer: {
    flex: 1,
  },
  replyUserName: {
    fontFamily: 'Poppins-Medium',
    color: '#444',
  },
  replyText: {
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  replyInputSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: lightPrimary,
    alignItems: 'center',
  },
  replyTextInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    minHeight: 60,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  submitReplyButton: {
    backgroundColor: primary,
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  submitReplyButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  noticeText: {
    color: '#2D3748',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    marginTop: 20,
    marginBottom: 25,
    // lineHeight: 28,
    maxWidth: 400,
  },
  addDetailsButton: {
    backgroundColor: '#0ea5e9',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  addDetailsButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
});