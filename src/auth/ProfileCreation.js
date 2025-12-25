import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    BackHandler,
    ActivityIndicator,
    ScrollView,
    Platform,
    StyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { fetchProfileQuestions } from '../utils/fetchProfileQuestions';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addUser } from '../redux/UserSlice';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const ProfileCreation = ({ navigation }) => {
    const dispatch = useDispatch();
    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const [questions, setQuestions] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedResponses, setSelectedResponses] = useState({});

    // Calculate if button is disabled
    const currentQData = questions?.[currentQuestion];
    const isNextDisabled = !selectedResponses[currentQData?.question]?.length;

    const [loading, setLoading] = useState(true);
    const [finishLoading, setFinishLoading] = useState(false);

    // Calculate Progress Percentage
    const totalQuestions = questions?.length || 5;
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;

    // Fetch questions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchProfileQuestions();

                console.log('questions: ', data);

                const formattedQuestions = data?.slice(0, 5)?.map(item => ({
                    question: item?.question,
                    responses: item?.options?.map(option => option.text)
                }));

                setQuestions(formattedQuestions);
            } catch (error) {
                console.log('Error fetching questions: ', error);
                Toast.show({
                    type: 'error',
                    text1: 'Failed to load questions',
                    text2: 'Please check your internet connection.'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Hardware Back Handler
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentQuestion > 0) {
                handleBack();
                return true;
            }
            return false;
        });
        return () => backHandler.remove();
    }, [currentQuestion]);

    const finishHandler = async () => {
        try {
            setFinishLoading(true);

            if (!authToken) throw new Error("Missing authToken");

            const response = await axios.post(
                "/auth/make-profile",
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authToken,
                    },
                }
            );

            if (response?.data?.status_code === 201) {
                const storedUserInfo = await AsyncStorage.getItem('userDetails');
                if (storedUserInfo) {
                    const parsedUserInfo = JSON.parse(storedUserInfo);
                    const updatedUserInfo = { ...parsedUserInfo, profileStatus: true };
                    dispatch(addUser(updatedUserInfo));
                    await AsyncStorage.setItem('userDetails', JSON.stringify(updatedUserInfo));
                }
                navigation.navigate('Main');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Something went wrong.',
                    text2: 'Please try again.',
                });
            }
        } catch (error) {
            console.log("error: ", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not create profile.',
            });
        } finally {
            setFinishLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentQuestion < (questions?.length || 0) - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            await finishHandler();
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const toggleSelection = (response) => {
        const questionKey = questions[currentQuestion].question;
        setSelectedResponses(prev => {
            const selected = prev[questionKey] || [];
            if (selected.includes(response)) {
                return {
                    ...prev,
                    [questionKey]: selected.filter(item => item !== response)
                };
            } else if (selected.length < 2) {
                return {
                    ...prev,
                    [questionKey]: [...selected, response]
                };
            }
            return prev;
        });
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar hidden={false} barStyle='dark-content' backgroundColor="#ecf9f9" />

                {/* --- Header Section --- */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        onPress={handleBack}
                        disabled={currentQuestion === 0}
                        style={[styles.backButton, { opacity: currentQuestion === 0 ? 0 : 1 }]}
                    >
                        <Icon name="arrow-left" size={20} color="#333" />
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <LinearGradient
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                colors={['#53b6e1', '#1b7ba2']}
                                style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    borderRadius: 5
                                }}
                            />
                        </View>
                        <Text style={styles.stepText}>
                            {currentQuestion + 1} / {questions?.length || 5}
                        </Text>
                    </View>
                </View>

                {/* --- Scrollable Content --- */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    {loading ? (
                        <View style={{ marginTop: 20 }}>
                            <ShimmerPlaceHolder style={styles.shimmerTitle} />
                            {[...Array(4)].map((_, i) => (
                                <ShimmerPlaceHolder key={i} style={styles.shimmerOption} />
                            ))}
                        </View>
                    ) : (
                        <View>
                            {/* Question Title */}
                            <Text style={styles.questionText}>
                                {questions?.[currentQuestion]?.question}
                            </Text>
                            <Text style={styles.subText}>Select up to 2 options</Text>

                            {/* Response Options */}
                            <View style={styles.optionsContainer}>
                                {questions?.[currentQuestion]?.responses?.map((response, index) => {
                                    const selected = selectedResponses?.[questions?.[currentQuestion]?.question] || [];
                                    const isSelected = selected.includes(response);
                                    const isDisabled = selected.length >= 2 && !isSelected;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.8}
                                            style={[
                                                styles.optionCard,
                                                isSelected && styles.optionCardSelected,
                                                isDisabled && styles.optionCardDisabled
                                            ]}
                                            onPress={() => !isDisabled && toggleSelection(response)}
                                            disabled={isDisabled}
                                        >
                                            <View style={[
                                                styles.checkCircle,
                                                isSelected && styles.checkCircleSelected
                                            ]}>
                                                {isSelected && <Icon name="check" size={12} color="#fff" />}
                                            </View>

                                            <Text style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected
                                            ]}>
                                                {response}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* --- Footer / Next Button --- */}
                <View style={styles.footerContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={isNextDisabled && !loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={isNextDisabled || loading ? ['#e0e0e0', '#cfcfcf'] : ['#53b6e1', '#1b7ba2']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            {finishLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[
                                    styles.nextButtonText,
                                    (isNextDisabled || loading) && { color: '#888' }
                                ]}>
                                    {currentQuestion === (questions?.length || 0) - 1 ? 'Finish Profile' : 'Next'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ecf9f9',
        // backgroundColor: 'red',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ecf9f9',
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#dbeff5',
        borderRadius: 5,
        marginRight: 10,
        overflow: 'hidden',
    },
    stepText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: responsiveFontSize(1.6),
        color: '#555',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    questionText: {
        fontSize: responsiveFontSize(2.8),
        fontFamily: 'Poppins-Bold',
        color: '#1a1a1a',
        marginBottom: 5,
        lineHeight: 36,
    },
    subText: {
        fontSize: responsiveFontSize(1.8),
        fontFamily: 'Poppins-Regular',
        color: '#666',
        marginBottom: 25,
    },
    optionsContainer: {
        marginBottom: 10,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: 'transparent',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        // Elevation for Android
        elevation: 2,
    },
    optionCardSelected: {
        backgroundColor: '#f0f9fc',
        borderColor: '#1f8dba',
        elevation: 4,
        shadowOpacity: 0.1,
    },
    optionCardDisabled: {
        opacity: 0.5,
        backgroundColor: '#f5f5f5',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        backgroundColor: '#fff',
    },
    checkCircleSelected: {
        borderColor: '#1f8dba',
        backgroundColor: '#1f8dba',
    },
    optionText: {
        fontSize: responsiveFontSize(1.9),
        fontFamily: 'Poppins-Medium',
        color: '#333',
        flex: 1,
    },
    optionTextSelected: {
        color: '#1f8dba',
        fontFamily: 'Poppins-SemiBold',
    },
    footerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 10,
        backgroundColor: '#ecf9f9',
    },
    nextButton: {
        // paddingVertical: 16,
        height: responsiveHeight(6.5),
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#53b6e1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        // backgroundColor: 'red'
    },
    nextButtonText: {
        color: '#ffffff',
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2.1),
    },
    shimmerTitle: {
        width: '80%',
        height: 30,
        borderRadius: 8,
        marginBottom: 30,
    },
    shimmerOption: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        marginBottom: 15,
    }
});

export default ProfileCreation;