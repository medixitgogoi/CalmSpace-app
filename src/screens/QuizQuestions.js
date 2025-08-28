import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, BackHandler, ActivityIndicator, Platform, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { fetchProfileQuestions } from '../utils/fetchProfileQuestions';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { primary } from '../utils/colors';
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

            if (!authToken) {
                throw new Error("Missing authToken");
            };

            const data = {
                QuestionScore: percentage
            };

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

            console.log("progress bar response: ", response);

        } catch (error) {
            console.log("error: ", error);
        } finally {
            setCalculating(false);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
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
        setSelectedResponses(prev => ({ ...prev, [questions[currentQuestion].question]: response }));
        setWeightages(prev => ({ ...prev, [questions[currentQuestion].question]: weightage }));
    };

    const calculatePercentage = async () => {

        setCalculating(true);

        const totalWeightage = Object.values(weightages).reduce((sum, val) => sum + val, 0);
        const N = questions?.length || 5;
        const percentage = ((totalWeightage / (N * 25)) * 100).toFixed(2);

        await finishHandler(percentage);

    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ecf9f9' }}>
                <StatusBar hidden={false} barStyle='dark-content' />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 18, flexGrow: 1 }}
                >
                    <TouchableOpacity onPress={handleBack} disabled={currentQuestion === 0} style={{ marginBottom: 40, marginTop: 10 }}>
                        <Icon name="arrow-left" size={24} color={currentQuestion === 0 ? '#ccc' : '#000'} />
                    </TouchableOpacity>

                    {loading ? (
                        <ShimmerPlaceHolder style={{ width: '100%', height: 50, borderRadius: 10, marginBottom: 30 }} />
                    ) : (
                        <Text style={{ fontSize: responsiveFontSize(2.7), fontFamily: 'Poppins-Bold', marginBottom: 30, color: '#000' }}>
                            {questions?.[currentQuestion]?.question}
                        </Text>
                    )}

                    {loading ? [...Array(4)].map((_, index) => (
                        <ShimmerPlaceHolder key={index} style={{ width: '97%', height: 60, borderRadius: 40, marginBottom: 20, alignSelf: 'center' }} />
                    )) : questions?.[currentQuestion]?.responses?.map((response, index) => {
                        const selected = selectedResponses[questions?.[currentQuestion]?.question] === response.text;
                        return (
                            <TouchableOpacity key={index} style={{ borderColor: primary, borderWidth: 2, backgroundColor: selected ? primary : '#e1f3fa', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 40, marginBottom: 20, alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'row' }} onPress={() => handleSelection(response.text, response.weightage)}>
                                <View style={{ width: 30, height: 30, borderRadius: 50, borderWidth: 2, borderColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: selected ? '#fff' : '#e1f3fa' }}>
                                    {selected && <Icon name="check" size={14} color={PRIMARY_COLOR} />}
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(2), fontFamily: 'Poppins-SemiBold', color: selected ? '#fff' : '#000', flexShrink: 1, flexWrap: 'wrap' }}>{response.text}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={{ paddingHorizontal: 10, paddingBottom: Platform.OS === 'ios' ? 0 : 12, paddingTop: 10, backgroundColor: '#ecf9f9' }}>
                    <TouchableOpacity onPress={handleNext} disabled={!selectedResponses[questions?.[currentQuestion]?.question]}>
                        <LinearGradient colors={!selectedResponses[questions?.[currentQuestion]?.question] ? ['#c9c9c9', '#c9c9c9'] : [primary, primary]} style={{ paddingVertical: 12, borderRadius: 60, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            {calculating ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.2), textAlign: 'center' }}>{currentQuestion === questions?.length - 1 ? 'Finish' : 'Next'}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default QuizQuestions;