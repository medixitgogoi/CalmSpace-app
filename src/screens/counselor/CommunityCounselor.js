import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import { primary, secondary, background, lightPrimary } from '../../utils/colors';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { fetchPosts } from '../../utils/fetchPosts';
import { useFocusEffect } from '@react-navigation/native';
import { fetchReplies } from '../../utils/fetchReplies';
import { getCounselorByID } from '../../utils/getCounselorByID';

const { width } = Dimensions.get('window');

const CommunityCounselor = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [isWritePostModalVisible, setWritePostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [details, setDetails] = useState(null);

  // Memoized ReplyCard component (No changes needed)
  const ReplyCard = React.memo(({ reply }) => {
    return (
      <View style={styles.replyCard}>
        <Image source={{ uri: reply?.userId?.pic }} style={styles.replyProfilePic} />
        <View style={styles.replyContentContainer}>
          <Text style={styles.replyUserName}>{reply?.userId?.name || 'User'}</Text>
          <Text style={styles.replyText}>{reply?.text}</Text>
        </View>
      </View>
    );
  });

  // --- FIX STARTS HERE: PostCard with full Like/Dislike functionality ---
  const PostCard = React.memo(({ post, fetchReplies, authToken, onPostReplied }) => {
    const formattedTimestamp = moment(post.createdAt).fromNow();

    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [isReplyInputVisible, setIsReplyInputVisible] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // State for Like/Dislike feature
    const [isLiked, setIsLiked] = useState(post?.myLikes || false);
    const [likeCount, setLikeCount] = useState(post.reactionCount || 0);
    const [isUpdatingLike, setIsUpdatingLike] = useState(false);

    // Sync state with props
    useEffect(() => {
      setIsLiked(post?.myLikes || false);
      setLikeCount(post.reactionCount || 0);
    }, [post.myLikes, post.reactionCount]);

    // Handle Like/Dislike action
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
        console.log('Error liking post: ', error);
        setIsLiked(previousLikedState);
        setLikeCount(previousLikeCount);
        if (Platform.OS === 'android') {
          ToastAndroid.show("Action failed. Please try again.", ToastAndroid.SHORT);
        } else {
          Alert.alert("Error", "Action failed. Please try again.");
        }
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
          ToastAndroid.show(response?.data?.message || "Reply sent!", ToastAndroid.LONG);
          setReplyContent('');
          setIsReplyInputVisible(false);
          if (showReplies) {
            const updatedReplies = await fetchReplies(post?._id, authToken);
            if (updatedReplies) setReplies(updatedReplies);
          }
          if (onPostReplied) onPostReplied(post._id);
        } else {
          ToastAndroid.show(response?.data?.message || "Failed to send reply.", ToastAndroid.LONG);
        }
      } catch (error) {
        console.error('Error sending reply: ', error);
        ToastAndroid.show("Failed to send reply. Please try again.", ToastAndroid.LONG);
      } finally {
        setIsReplying(false);
      }
    }, [replyContent, post?._id, authToken, showReplies, onPostReplied]);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post?.userId?.pic }} style={styles.profilePic} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post?.userId?.name || 'User'}</Text>
            <Text style={styles.timestamp}>{formattedTimestamp}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{post?.text}</Text>

        <View style={styles.postActions}>
          {/* Functional Like Button */}
          <TouchableOpacity
            style={[styles.actionButton, isUpdatingLike && { opacity: 0.5 }]}
            onPress={handleLike}
            disabled={isUpdatingLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? '#E91E63' : primary} />
            <Text style={[styles.actionText, { color: isLiked ? '#E91E63' : primary }]}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsReplyInputVisible(prev => !prev)} style={styles.actionButton}>
            <Ionicons name="chatbox-outline" size={20} color={primary} />
            <Text style={[styles.actionText, { color: primary }]}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewReplies} style={styles.actionButton}>
            <Ionicons name={showReplies ? "eye-off-outline" : "eye-outline"} size={20} color={primary} />
            <Text style={[styles.actionText, { color: primary }]}>
              {showReplies ? `Hide replies` : `View replies`}
            </Text>
          </TouchableOpacity>
        </View>

        {isReplyInputVisible && (
          <View style={styles.replyInputSection}>
            <TextInput
              style={styles.replyTextInput}
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
              {isReplying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitReplyButtonText}>Submit Reply</Text>}
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
    if (isWritePostModalVisible && postContent.trim() !== '') {
      setPostContent('');
    }
  }, [isWritePostModalVisible, postContent]);

  const handleCreatePost = async () => {
    if (postContent.trim() === '') {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Post content cannot be empty.", ToastAndroid.SHORT);
      } else {
        Alert.alert("Validation Error", "Post content cannot be empty.");
      }
      return;
    }

    setIsPosting(true);
    const data = { text: postContent };

    try {
      const response = await axios.post("/comunity/sendpost", data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      });
      if (response?.data?.status_code === 200) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response?.data?.message, ToastAndroid.LONG);
        } else {
          Alert.alert("Info", response?.data?.message);
        }
        fetchData();
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response?.data?.message || "Failed to create post.", ToastAndroid.LONG);
        } else {
          Alert.alert("Error", response?.data?.message || "Failed to create post.");
        }
      }
    } catch (error) {
      console.log('post error: ', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show("Failed to create post. Please try again.", ToastAndroid.LONG);
      } else {
        Alert.alert("Error", "Failed to create post. Please try again.");
      }
    } finally {
      setIsPosting(false);
      setWritePostModalVisible(false);
      setPostContent('');
    }
  };

  const fetchScreenData = useCallback(async () => {
    // For pull-to-refresh, don't show the main loader, only the refresh indicator
    if (!isRefreshing) {
      setLoading(true);
    }

    try {
      // Fetch counselor details and posts at the same time
      const [counselorData, postsData] = await Promise.all([
        getCounselorByID(authToken),
        fetchPosts(authToken)
      ]);

      if (counselorData) setDetails(counselorData);
      if (postsData) setPosts(postsData);

    } catch (error) {
      console.log('Error fetching screen data: ', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show("Failed to load data.", ToastAndroid.LONG);
      } else {
        Alert.alert("Error", "Failed to load data.");
      }
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

  // Initial Loading state
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
            <Ionicons name="arrow-back" size={20} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>The Calmspace Community</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {!details ? (
          <View style={styles.centeredScreen}>
            <Ionicons name="information-circle-outline" size={80} color="#FF6B6B" />
            <Text style={styles.noticeText}>
              Please complete your profile before engaging with the community.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddDetails')} style={styles.addDetailsButton}>
              <Ionicons name="person-add-outline" size={22} color="#fff" />
              <Text style={styles.addDetailsButtonText}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
            {/* ... (Modal and Add Post Button remain the same) ... */}
          </>
        )}

        <TouchableOpacity
          style={styles.addPostButton}
          onPress={toggleWritePostModal}>
          <LinearGradient
            colors={['#0fb8ad', '#1fc8db']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addPostButtonGradient}>
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Modal
          isVisible={isWritePostModalVisible}
          onBackdropPress={toggleWritePostModal}
          onBackButtonPress={toggleWritePostModal}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropTransitionOutTiming={0}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <Text style={styles.modalMessage}>Ready to share your thoughts with the community? Start typing your post!</Text>
            <TextInput
              style={styles.textInput}
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
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.writePostButton]}
                onPress={handleCreatePost}
                disabled={isPosting || postContent.trim() === ''}>
                {isPosting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.writePostButtonText}>Create Post</Text>
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
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: lightPrimary,
    marginBottom: 10
  },
  headerButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPlaceholder: {
    width: 35,
    height: 35,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    paddingTop: 2,
  },
  postListContainer: {
    paddingHorizontal: 15,
    paddingBottom: responsiveHeight(10),
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
    marginTop: 5,
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
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  timestamp: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },
  postContent: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#444',
    lineHeight: responsiveHeight(2.5),
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
    borderRadius: 20,
    flex: 1,
  },
  actionText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Poppins-Medium',
    color: primary,
    marginLeft: 5,
  },
  addPostButton: {
    position: 'absolute',
    bottom: responsiveHeight(6),
    right: 15,
    borderRadius: 100,
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
    justifyContent: Platform.OS === 'ios' ? 'flex-start' : 'center',
    paddingTop: Platform.OS === 'ios' ? 110 : 0,
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: background,
    borderRadius: 22,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
  },
  writePostButton: {
    backgroundColor: primary,
  },
  writePostButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-SemiBold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    minHeight: responsiveHeight(15),
    textAlignVertical: 'top',
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 20,
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
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fcfaf5',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: secondary,
  },
  replyProfilePic: {
    width: 35,
    height: 35,
    borderRadius: 150,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  replyContentContainer: {
    flex: 1,
    gap: 0
  },
  replyUserName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#444',
  },
  replyText: {
    fontSize: 12,
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
    minHeight: responsiveHeight(8),
    textAlignVertical: 'top',
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 10,
  },
  submitReplyButton: {
    backgroundColor: primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  submitReplyButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Poppins-SemiBold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  noticeText: {
    fontSize: responsiveFontSize(2),
    color: '#2D3748',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    marginTop: 20,
    marginBottom: 25,
    lineHeight: 28
  },
  addDetailsButton: {
    backgroundColor: '#0ea5e9',
    height: responsiveHeight(6),
    paddingHorizontal: 30,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    width: '100%'
  },
  addDetailsButtonText: {
    fontSize: responsiveFontSize(2),
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
});