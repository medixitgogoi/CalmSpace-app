import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, BackHandler, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { fetchProfileQuestions } from '../utils/fetchProfileQuestions';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder'
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addUser } from '../redux/UserSlice';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient)

const ProfileCreation = ({ navigation }) => {

    const dispatch = useDispatch()

    const userDetails = useSelector(state => state.user);

    const authToken = userDetails?.authToken;

    const [questions, setQuestions] = useState(null);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedResponses, setSelectedResponses] = useState({});
    const isNextDisabled = !selectedResponses[questions?.[currentQuestion]?.question]?.length;

    const [loading, setLoading] = useState(true);
    const [finishLoading, setFinishLoading] = useState(false);

    // Fetch questions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchProfileQuestions(); // Fetch all questions

                console.log('questions: ', data)

                // Transform the first 5 items into the required format
                const formattedQuestions = data?.slice(0, 5)?.map(item => ({
                    question: item?.question,
                    responses: item?.options?.map(option => option.text)
                }));

                setQuestions(formattedQuestions);
            } catch (error) {
                console.log('Error fetching questions: ', error);
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

    const finishHandler = async () => {
        try {
            setFinishLoading(true);

            if (!authToken) {
                throw new Error("Missing authToken");
            }

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

                navigation.navigate('Main');

                // Retrieve existing user info from AsyncStorage
                const storedUserInfo = await AsyncStorage.getItem('userDetails');

                if (storedUserInfo) {
                    const parsedUserInfo = JSON.parse(storedUserInfo);

                    // Merge and update profileStatus
                    const updatedUserInfo = {
                        ...parsedUserInfo,
                        profileStatus: true,
                    };

                    // Update Redux state
                    dispatch(addUser(updatedUserInfo));

                    // Persist updated user to AsyncStorage
                    await AsyncStorage.setItem('userDetails', JSON.stringify(updatedUserInfo));
                }

            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Something went wrong.',
                    text2: 'Please try again.',
                    position: 'top',
                    topOffset: 40,
                });
            }

            console.log("profile creation response: ", response);

        } catch (error) {
            console.log("error: ", error);
        } finally {
            setFinishLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            await finishHandler();  // Ensures the API call completes before moving on
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const toggleSelection = (response) => {
        setSelectedResponses(prev => {
            const selected = prev[questions[currentQuestion].question] || [];
            if (selected.includes(response)) {
                return {
                    ...prev,
                    [questions[currentQuestion].question]: selected.filter(item => item !== response)
                };
            } else if (selected.length < 2) {
                return {
                    ...prev,
                    [questions[currentQuestion].question]: [...selected, response]
                };
            }
            return prev;
        });
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, paddingHorizontal: 10, justifyContent: 'space-between', flexDirection: 'column', backgroundColor: '#ecf9f9' }}>

                {/* StatusBar */}
                <StatusBar hidden={false} barStyle='dark-content' />

                <View style={{ width: '100%', paddingHorizontal: 8 }}>

                    {/* Back button */}
                    <TouchableOpacity onPress={handleBack} disabled={currentQuestion === 0} style={{ marginBottom: 40, marginTop: 10 }}>
                        <Icon name="arrow-left" size={22} color={currentQuestion === 0 ? '#ccc' : '#000'} />
                    </TouchableOpacity>

                    {/* Question */}
                    {loading ? (
                        <ShimmerPlaceHolder
                            style={{ width: '100%', height: 50, borderRadius: 10, marginBottom: 30 }}
                        />
                    ) : (
                        <Text style={{ fontSize: responsiveFontSize(2.5), fontFamily: 'Poppins-Bold', marginBottom: 30, color: '#000' }}>
                            {questions?.[currentQuestion]?.question}
                        </Text>
                    )}

                    {/* Responses */}
                    {loading
                        ? [...Array(4)].map((_, index) => (
                            <ShimmerPlaceHolder
                                key={index}
                                style={{ width: '97%', height: 60, borderRadius: 40, marginBottom: 20, alignSelf: 'center' }}
                            />
                        ))
                        : questions?.[currentQuestion]?.responses?.map((response, index) => {

                            const selected = selectedResponses?.[questions?.[currentQuestion]?.question] || [];
                            const isDisabled = selected.length >= 2 && !selected.includes(response);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        borderColor: '#1f8dba',
                                        borderWidth: 2,
                                        backgroundColor: selected?.includes(response) ? '#1f8dba' : '#e1f3fa',
                                        paddingVertical: 10,
                                        paddingHorizontal: 15,
                                        borderRadius: 38,
                                        marginBottom: 20,
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        flexDirection: 'row',
                                        opacity: isDisabled ? 0.5 : 1,
                                    }}
                                    onPress={() => !isDisabled && toggleSelection(response)}
                                    disabled={isDisabled}
                                >
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 50,
                                            borderWidth: 2,
                                            borderColor: '#1f8dba',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            backgroundColor: selected.includes(response) ? '#fff' : '#e1f3fa',
                                        }}
                                    >
                                        {selected?.includes(response) && <Icon name="check" size={14} color="#1f8dba" />}
                                    </View>

                                    <Text
                                        style={{
                                            fontSize: responsiveFontSize(2),
                                            fontFamily: 'Poppins-SemiBold',
                                            color: selected.includes(response) ? '#fff' : '#000',
                                            flexShrink: 1,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {response}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    }
                </View>

                {/* Finish / Next button */}
                <TouchableOpacity onPress={handleNext} disabled={isNextDisabled} style={{ marginBottom: Platform.OS === 'ios' ? 0 : 10 }}>
                    <LinearGradient
                        colors={isNextDisabled ? ['#c9c9c9', '#c9c9c9'] : ['#53b6e1', '#1b7ba2']}
                        style={{ paddingVertical: 13, borderRadius: 60, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {finishLoading ? (
                            <ActivityIndicator size={'large'} color="#fff" />
                        ) : (
                            <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Bold', fontSize: responsiveFontSize(2.1), textAlign: 'center' }}>
                                {currentQuestion === questions?.length - 1 ? 'Finish' : 'Next'}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default ProfileCreation;