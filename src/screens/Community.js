import React, { useCallback, useState, useEffect, useMemo } from 'react';
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
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import { primary, secondary, background, lightPrimary } from '../utils/colors';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { fetchPosts } from '../utils/fetchPosts';
import { useFocusEffect } from '@react-navigation/native';
import { fetchReplies } from '../utils/fetchReplies';
import { useContentFilter } from '../hooks/useContentFilter';

// --- 1. Tablet Detection ---
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const Community = ({ navigation }) => {
  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;
  const { checkContent } = useContentFilter();

  const [isWritePostModalVisible, setWritePostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  // Memoized ReplyCard component
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

  // Memoized PostCard component
  const PostCard = React.memo(({ post, fetchReplies, authToken, onReportPress, loggedInUserId }) => {
    const formattedTimestamp = moment(post?.createdAt).fromNow();
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const [isLiked, setIsLiked] = useState(post?.myLikes || false);
    const [likeCount, setLikeCount] = useState(post.reactionCount || 0);
    const [isUpdatingLike, setIsUpdatingLike] = useState(false);

    // Check if the post was created by the logged-in user
    const isOwnPost = post?.userId?._id === loggedInUserId;

    useEffect(() => {
      setIsLiked(post?.myLikes || false);
      setLikeCount(post.reactionCount || 0);
    }, [post.myLikes, post.reactionCount]);

    const handleLike = async () => {
      if (isUpdatingLike) {
        return;
      }
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
    }, [showReplies, replies.length, loadingReplies, post?._id, fetchReplies, authToken]);

    return (
      <View style={styles.postCardWrapper}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Image source={{ uri: post?.userId?.pic }} style={styles.profilePic} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{post?.userId?.name || 'User'}</Text>
              <Text style={styles.timestamp}>{formattedTimestamp}</Text>
            </View>

            {/* Condition: Only show three-dots if it's NOT the user's own post */}
            {!isOwnPost && (
              <TouchableOpacity onPress={() => onReportPress(post?._id)} style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.postContent}>{post?.text}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[styles.actionButton, isUpdatingLike && { opacity: 0.5 }]}
              onPress={handleLike}
              disabled={isUpdatingLike}
            >
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={isTablet ? 24 : 20} color={isLiked ? '#E91E63' : primary} />
              <Text style={[styles.actionText, { color: isLiked ? '#E91E63' : primary }]}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleViewReplies} style={styles.actionButton}>
              <Ionicons name={showReplies ? "eye-off-outline" : "eye-outline"} size={isTablet ? 24 : 20} color={primary} />
              <Text style={[styles.actionText, { color: primary }]}>
                {showReplies ? `Hide replies` : `View replies`}
              </Text>
            </TouchableOpacity>
          </View>
          {showReplies && (
            <View style={styles.repliesSection}>
              {loadingReplies ? (
                <Text style={styles.loadingText}>Loading replies...</Text>
              ) : replies.length > 0 ? (
                replies.map((reply) => <ReplyCard key={reply._id} reply={reply} />)
              ) : (
                <Text style={styles.noRepliesText}>No replies yet.</Text>
              )}
            </View>
          )}
        </View>
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

    const isSafe = checkContent(postContent, () => {
      Alert.alert(
        "Action Required",
        "Your post contains content that violates our community guidelines. Please keep it respectful.",
        [{ text: "Edit Post" }]
      );
      setPostContent('');
    });

    if (!isSafe) return;

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

  const handleReportPost = async () => {
    if (reportReason.trim() === '') {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Please provide a reason.", ToastAndroid.SHORT);
      }
      return;
    }

    setIsReporting(true);

    try {
      const response = await axios.post('/comunity/report-post', {
        postId: String(selectedPostId),
        reason: reportReason
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      });

      if (response?.data?.status_code === 201) {
        Alert.alert("Report Submitted", "Thank you for helping us keep the community safe. We will review this post.");
      }
    } catch (error) {
      console.log('Report error: ', error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setIsReporting(false);
      setReportModalVisible(false);
      setReportReason('');
      setSelectedPostId(null);
      fetchData();
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchPosts(authToken);
      if (data) {
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts: ', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show("Failed to fetch posts.", ToastAndroid.LONG);
      } else {
        Alert.alert("Error", "Failed to fetch posts.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [authToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const openReportModal = (postId) => {
    setSelectedPostId(postId);
    setReportModalVisible(true);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          animated={true}
          barStyle={'dark-content'}
          hidden={false}
          backgroundColor={background}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 20} color={'#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>The Calmspace Community</Text>

          {isTablet ? (
            <TouchableOpacity onPress={toggleWritePostModal} activeOpacity={0.8}>
              <LinearGradient
                colors={['#0fb8ad', '#1fc8db']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerAddButtonTablet}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.headerAddButtonText}>New Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButtonPlaceholder} />
          )}
        </View>

        {loading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={'large'} color={primary} />
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                fetchReplies={fetchReplies}
                authToken={authToken}
                onReportPress={openReportModal}
                loggedInUserId={userDetails?._id}
              />
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.postListContainer}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 80
              }}>
                <Feather
                  name="message-square"
                  size={isTablet ? 80 : 50}
                  color="#d3d3d3"
                />
                <Text style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: isTablet ? responsiveFontSize(1.5) : 18,
                  color: '#555',
                  marginTop: 20
                }}>
                  Nothing to see here... yet!
                </Text>
                <Text style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: isTablet ? responsiveFontSize(1.2) : 14,
                  color: '#888',
                  marginTop: 8,
                  textAlign: 'center',
                  paddingHorizontal: 40
                }}>
                  Be the first to share a post and start a conversation in the community.
                </Text>
              </View>
            }
          />
        )}

        {!isTablet && (
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
        )}

        <Modal
          isVisible={isWritePostModalVisible}
          onBackdropPress={toggleWritePostModal}
          onBackButtonPress={toggleWritePostModal}
          animationIn="zoomIn"
          animationOut="zoomOut"
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

        <Modal
          isVisible={isReportModalVisible}
          onBackdropPress={() => setReportModalVisible(false)}
          onBackButtonPress={() => setReportModalVisible(false)}
          animationIn="zoomIn"
          animationOut="zoomOut"
          useNativeDriver={true}
          style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Post</Text>
            <Text style={styles.modalMessage}>Please explain why this content is objectionable.</Text>
            <TextInput
              style={[styles.textInput, { minHeight: responsiveHeight(15) }]}
              placeholder="Reason for report..."
              placeholderTextColor="#888"
              multiline={true}
              value={reportReason}
              onChangeText={setReportReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReportModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.writePostButton, { backgroundColor: '#E91E63' }]}
                onPress={handleReportPost}
                disabled={isReporting || reportReason.trim() === ''}>
                {isReporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.writePostButtonText}>Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// export default Community;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: lightPrimary,
    height: isTablet ? 80 : 60,
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
  headerAddButtonTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: responsiveHeight(4),
    width: responsiveWidth(18),
    borderRadius: 20,
    marginRight: 10,
  },
  headerAddButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: responsiveFontSize(1.2),
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.3),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    paddingTop: 2,
  },
  postListContainer: {
    paddingHorizontal: isTablet ? 0 : 15,
    paddingBottom: responsiveHeight(12),
    paddingTop: isTablet ? 10 : 0,
  },
  postCardWrapper: {
    width: isTablet ? '70%' : '100%',
    alignSelf: 'center',
  },
  postCard: {
    backgroundColor: '#f6fcfc',
    borderRadius: 18,
    padding: isTablet ? 20 : 15,
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
    width: isTablet ? 55 : 45,
    height: isTablet ? 55 : 45,
    borderRadius: isTablet ? 27.5 : 22.5,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.9),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  timestamp: {
    fontSize: isTablet ? responsiveFontSize(1.0) : responsiveFontSize(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },
  moreButton: {
    padding: 5,
  },
  postContent: {
    fontSize: isTablet ? responsiveFontSize(1.2) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#444',
    lineHeight: isTablet ? responsiveHeight(3) : responsiveHeight(2.5),
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
    paddingHorizontal: 10,
    borderRadius: 20,
    width: '50%'
  },
  actionText: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.6),
    fontFamily: 'Poppins-Medium',
    marginLeft: 5,
  },
  addPostButton: {
    position: 'absolute',
    bottom: responsiveHeight(11),
    right: Platform.OS === 'ios' ? 20 : 25,
    borderRadius: 100,
    width: 60,
    height: 60,
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
    borderRadius: isTablet ? 40 : 22,
    padding: 30,
    width: isTablet ? '80%' : '90%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: isTablet ? responsiveFontSize(1.5) : responsiveFontSize(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
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
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-Medium',
  },
  writePostButton: {
    backgroundColor: primary,
  },
  writePostButtonText: {
    color: '#fff',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
    fontFamily: 'Poppins-SemiBold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: isTablet ? 20 : 15,
    width: '100%',
    minHeight: isTablet ? responsiveHeight(30) : responsiveHeight(15),
    textAlignVertical: 'top',
    fontSize: isTablet ? responsiveFontSize(1.1) : responsiveFontSize(1.8),
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
    fontSize: isTablet ? responsiveFontSize(1.0) : 14,
  },
  noRepliesText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    fontSize: isTablet ? responsiveFontSize(1.0) : 14,
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
    width: isTablet ? 40 : 35,
    height: isTablet ? 40 : 35,
    borderRadius: isTablet ? 20 : 17.5,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  replyContentContainer: {
    flex: 1,
    gap: 0
  },
  replyUserName: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? responsiveFontSize(1.0) : 13,
    color: '#444',
  },
  replyText: {
    fontSize: isTablet ? responsiveFontSize(0.9) : 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
});

export default Community;