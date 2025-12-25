import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    BackHandler,
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { fetchProfileQuestions } from '../utils/fetchProfileQuestions';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { useSelector } from 'react-redux';
import axios from 'axios';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const PRIMARY_COLOR = '#1f8dba';

const QuizQuestions = ({ navigation }) => {

    const userDetails = useSelector(state => state.user);
    const authToken = userDetails?.authToken;

    const [questions, setQuestions] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedResponses, setSelectedResponses] = useState({});
    const [weightages, setWeightages] = useState({});

    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    // Calculate Progress
    const totalQuestions = questions?.length || 5;
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchProfileQuestions();

                const formattedQuestions = data?.slice(5, 10)?.map(item => ({
                    question: item?.question,
                    responses: item?.options?.map(option => ({
                        text: option.text,
                        weightage: option.weightage
                    }))
                }));

                setQuestions(formattedQuestions);
            } catch (error) {
                console.log('Error fetching questions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

    const finishHandler = async (percentage) => {
        try {
            setCalculating(true);
            if (!authToken) throw new Error("Missing authToken");

            const data = { QuestionScore: percentage };

            const response = await axios.post(
                "/progress/create-progressbar", data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authToken,
                    },
                }
            );

            if (response?.status === 201) {
                navigation.navigate('PercentageShow', { percentage });
            };
        } catch (error) {
            console.log("error: ", error);
        } finally {
            setCalculating(false);
        }
    };

    const handleNext = () => {
        if (currentQuestion < (questions?.length || 0) - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculatePercentage();
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSelection = (response, weightage) => {
        const currentQ = questions[currentQuestion].question;
        setSelectedResponses(prev => ({ ...prev, [currentQ]: response }));
        setWeightages(prev => ({ ...prev, [currentQ]: weightage }));
    };

    const calculatePercentage = async () => {
        setCalculating(true);
        const totalWeightage = Object.values(weightages).reduce((sum, val) => sum + val, 0);
        const N = questions?.length || 5;
        const percentage = ((totalWeightage / (N * 25)) * 100).toFixed(2);
        await finishHandler(percentage);
    };

    const isButtonDisabled = !selectedResponses[questions?.[currentQuestion]?.question];

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar hidden={false} barStyle='dark-content' backgroundColor="#ecf9f9" />

                {/* --- Header --- */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        onPress={handleBack}
                        disabled={currentQuestion === 0}
                        style={[styles.backButton, { opacity: currentQuestion === 0 ? 0 : 1 }]}
                    >
                        <Icon name="arrow-left" size={22} color="#333" />
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View style={styles.progressTrack}>
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
                </View>

                {/* --- Scrollable Content (Takes up available space) --- */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    style={{ flex: 1 }} // Crucial: Allows ScrollView to fill space between Header and Footer
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
                            <Text style={styles.questionText}>
                                {questions?.[currentQuestion]?.question}
                            </Text>

                            <View style={styles.optionsContainer}>
                                {questions?.[currentQuestion]?.responses?.map((response, index) => {
                                    const selected = selectedResponses[questions?.[currentQuestion]?.question] === response.text;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.9}
                                            style={[
                                                styles.optionCard,
                                                selected && styles.optionCardSelected
                                            ]}
                                            onPress={() => handleSelection(response.text, response.weightage)}
                                        >
                                            <View style={[
                                                styles.radioCircle,
                                                selected && styles.radioCircleSelected
                                            ]}>
                                                {selected && <Icon name="check" size={12} color="#fff" />}
                                            </View>

                                            <Text style={[
                                                styles.optionText,
                                                selected && styles.optionTextSelected
                                            ]}>
                                                {response.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* --- Footer Button (Natural Flex Item) --- */}
                <View style={styles.footerContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={isButtonDisabled || calculating}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isButtonDisabled ? ['#e0e0e0', '#cfcfcf'] : ['#53b6e1', '#1b7ba2']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            {calculating ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={[
                                    styles.nextButtonText,
                                    isButtonDisabled && { color: '#888' }
                                ]}>
                                    {currentQuestion === (questions?.length || 0) - 1 ? 'Finish' : 'Next'}
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
        flexDirection: 'column', // Ensures children stack vertically
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ecf9f9',
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    progressTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#dbeff5',
        borderRadius: 5,
        overflow: 'hidden',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    questionText: {
        fontSize: responsiveFontSize(2.6),
        fontFamily: 'Poppins-Bold',
        color: '#1a1a1a',
        marginBottom: 30,
        lineHeight: 34,
        marginTop: 10,
    },
    optionsContainer: {
        width: '100%',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'transparent',
        // Shadows
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    optionCardSelected: {
        backgroundColor: '#f0f9fc',
        borderColor: PRIMARY_COLOR,
        shadowColor: PRIMARY_COLOR,
        shadowOpacity: 0.1,
        elevation: 4,
    },
    radioCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        backgroundColor: '#fff',
    },
    radioCircleSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: PRIMARY_COLOR,
    },
    optionText: {
        fontSize: responsiveFontSize(1.9),
        fontFamily: 'Poppins-Medium',
        color: '#333',
        flex: 1,
    },
    optionTextSelected: {
        color: PRIMARY_COLOR,
        fontFamily: 'Poppins-SemiBold',
    },
    footerContainer: {
        // No absolute positioning here
        backgroundColor: '#ecf9f9',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    },
    nextButton: {
        height: responsiveHeight(6.5),
        borderRadius: 30,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#53b6e1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    nextButtonText: {
        color: '#ffffff',
        fontFamily: 'Poppins-Bold',
        fontSize: responsiveFontSize(2.1),
        textAlign: 'center',
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

export default QuizQuestions;