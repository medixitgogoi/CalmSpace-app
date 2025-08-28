import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { primary, lightPrimary } from '../utils/colors';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import LinearGradient from 'react-native-linear-gradient';
import Icon4 from 'react-native-vector-icons/dist/AntDesign';
import Toast from 'react-native-toast-message';
import SelectDropdown from 'react-native-select-dropdown';
import axios from 'axios';
import { useSelector } from 'react-redux';

const { width: screenWidth } = Dimensions.get('window');

const languages = [
  { title: 'English' },
  { title: 'Hindi' },
  { title: 'Assamese' },
  { title: 'Bengali' },
  { title: 'Gujarati' },
  { title: 'Kannada' },
  { title: 'Kashmiri' },
  { title: 'Malayalam' },
  { title: 'Marathi' },
  { title: 'Marwari' },
  { title: 'Punjabi' },
  { title: 'Tamil' },
  { title: 'Telugu' },
  { title: 'Urdu' },
];

const experienceData = [
  { title: '1+ years' },
  { title: '2+ years' },
  { title: '3+ years' },
  { title: '4+ years' },
  { title: '5+ years' },
];

const SlidableSection = ({ onFinish, setCounselorsLoading, counselors }) => {
  const userDetails = useSelector(state => state.user);

  const authToken = userDetails?.authToken;

  const slideAnim = useRef(new Animated.Value(0)).current;

  const [currentSlide, setCurrentSlide] = useState(0);

  const [minBudget, setMinBudget] = useState(500);
  const [maxBudget, setMaxBudget] = useState(1000);

  const [language, setLanguage] = useState(null);
  const [experience, setExperience] = useState(null);

  const options = ['₹(500-1000)', '₹(1000-1500)', '₹(1500-2000)'];

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(options[0]);

  const handleOptionSelect = option => {
    setSelectedBudget(option);
    setDropdownVisible(false);

    const match = option.match(/\((\d+)-(\d+)\)/);
    if (match) {
      const min = Number(match[1]);
      const max = Number(match[2]);

      setMinBudget(min);
      setMaxBudget(max);
    }
  };

  const budgetHandler = () => {
    const min = Number(minBudget); // Convert to number
    const max = Number(maxBudget); // Convert to number

    if (isNaN(min) || isNaN(max)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Budget',
        text2: 'Please enter valid numbers',
        position: 'top',
        topOffset: 40,
      });
      return;
    }

    nextHandler();
  };

  const nextHandler = () => {
    if (currentSlide < 2) {
      // 4 slides in total
      setCurrentSlide(prev => prev + 1);

      Animated.timing(slideAnim, {
        toValue: -(currentSlide + 1) * screenWidth, // Move to the next slide dynamically
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const finishHandler = async () => {
    setCounselorsLoading(true); // Start loading before fetching data

    const min = Number(minBudget);
    const max = Number(maxBudget);

    const numericExperience = parseInt(experience);

    try {
      const response = await axios.get('/counselor/preference', {
        params: {
          language: language?.toLowerCase(),
          minPrice: min,
          maxPrice: max,
          experience: numericExperience,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      });

      console.log('counselors preference: ', response);

      const counselors = response?.data || [];
      onFinish(counselors);
    } catch (error) {
      console.log('Error: ', error.message);
    }
  };

  return (
    <View style={{ paddingBottom: 10, marginTop: Platform.OS === 'ios' ? 10 : 0 }}>
      {/* Heading */}
      <Text
        style={{
          marginHorizontal: 10,
          fontSize: responsiveFontSize(2),
          fontFamily: 'Poppins-SemiBold',
          marginBottom: 10,
          textAlign: 'center',
          color: '#444',
        }}>
        Find counselors based on your preference
      </Text>

      {/* Slides */}
      <Animated.View
        style={{
          flexDirection: 'row',
          width: screenWidth * 3,
          transform: [{ translateX: slideAnim }],
        }}>
        {/* Slide 1 - Budget */}
        <View
          style={{
            width: screenWidth,
            paddingHorizontal: 10,
            flexDirection: 'column',
          }}>
          <View
            style={{ backgroundColor: '#ade6e6', padding: 20, borderRadius: 15 }}>
            {/* Headline */}
            <Text
              style={{
                fontSize: responsiveFontSize(1.9),
                fontFamily: 'Poppins-Medium',
                marginBottom: 5,
              }}>
              What's the Ideal Budget for your preferred counselor?
            </Text>

            <View style={{ marginTop: 5 }}>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setDropdownVisible(!isDropdownVisible)}>
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: responsiveFontSize(1.8),
                  }}>
                  {selectedBudget}
                </Text>
                <Icon4
                  name={isDropdownVisible ? 'up' : 'down'}
                  size={14}
                  color="#333"
                />
              </TouchableOpacity>

              {isDropdownVisible && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 12,
                    marginTop: 8,
                    backgroundColor: '#f9f4e7',
                    elevation: 2,
                    overflow: 'hidden',
                  }}>
                  {options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleOptionSelect(option)}
                      style={{
                        padding: 12,
                        borderBottomWidth:
                          index !== options.length - 1 ? 0.8 : 0,
                        borderBottomColor: '#aaa',
                        backgroundColor:
                          selectedBudget === option ? '#d4f7d4' : '#fff', // greenish background if selected
                      }}>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Medium',
                          fontSize: responsiveFontSize(1.8),
                          color: '#000',
                        }}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Next button */}
          <LinearGradient
            colors={
              minBudget && maxBudget
                ? [primary, lightPrimary]
                : ['#ccc', '#aaa']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 20,
              borderRadius: 12,
              elevation: 2,
              width: '97%',
              alignSelf: 'center',
            }}>
            <TouchableOpacity
              disabled={!minBudget || !maxBudget}
              onPress={budgetHandler}
              style={{
                gap: 5,
                paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                borderRadius: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: responsiveFontSize(2.2),
                  fontFamily: 'Poppins-SemiBold',
                  opacity: minBudget && maxBudget ? 1 : 0.9,
                  paddingTop: 2,
                }}>
                Next
              </Text>

              <Icon4
                name="arrowright"
                size={23}
                color={minBudget && maxBudget ? '#fff' : '#ddd'}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Slide 2 - Experience */}
        <View
          style={{
            width: screenWidth,
            paddingHorizontal: 10,
            flexDirection: 'column',
          }}>
          <View
            style={{ backgroundColor: '#ade6e6', padding: 20, borderRadius: 15 }}>
            <Text
              style={{
                fontSize: responsiveFontSize(1.9),
                fontFamily: 'Poppins-Medium',
                marginBottom: 15,
              }}>
              How much experienced would you like your counselor to be?
            </Text>

            {/* Dropdown */}
            <SelectDropdown
              data={experienceData}
              onSelect={(selectedItem, index) => {
                setExperience(selectedItem.title);
              }}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {(selectedItem && selectedItem.title) ||
                        'Select experience'}
                    </Text>
                    <Icon4 size={17} name={isOpened ? 'up' : 'down'} />
                  </View>
                );
              }}
              renderItem={(item, index, isSelected) => {
                return (
                  <View
                    style={{
                      ...styles.dropdownItemStyle,
                      ...(isSelected && {
                        backgroundColor: '#d5f2f2',
                        borderRadius: 12,
                        paddingLeft: 20,
                      }),
                    }}>
                    <Text style={styles.dropdownItemTxtStyle}>
                      {item.title}
                    </Text>
                  </View>
                );
              }}
              showsVerticalScrollIndicator={true}
              dropdownStyle={styles.dropdownMenuStyle}
            />
          </View>

          <LinearGradient
            colors={experience ? [primary, lightPrimary] : ['#ccc', '#aaa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 20,
              borderRadius: 12,
              elevation: 2,
              width: '97%',
              alignSelf: 'center',
            }}>
            <TouchableOpacity
              disabled={!experience}
              onPress={nextHandler}
              style={{
                gap: 5,
                paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: responsiveFontSize(2.2),
                  fontFamily: 'Poppins-SemiBold',
                  paddingtop: 2,
                  opacity: experience ? 1 : 0.9,
                }}>
                Next
              </Text>

              <Icon4
                name="arrowright"
                size={23}
                color={experience ? '#fff' : '#ddd'}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Slide 3 - Language */}
        <View
          style={{
            width: screenWidth,
            paddingHorizontal: 10,
            flexDirection: 'column',
          }}>
          <View
            style={{ backgroundColor: '#ade6e6', padding: 20, borderRadius: 15 }}>
            <Text
              style={{
                fontSize: responsiveFontSize(1.9),
                fontFamily: 'Poppins-Medium',
                marginBottom: 15,
              }}>
              In which language would you like to communicate with your
              counselor?
            </Text>

            {/* your code here */}
            <SelectDropdown
              data={languages}
              onSelect={(selectedItem, index) => {
                setLanguage(selectedItem.title);
              }}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {(selectedItem && selectedItem.title) ||
                        'Select language'}
                    </Text>
                    <Icon4 size={17} name={isOpened ? 'up' : 'down'} />
                  </View>
                );
              }}
              renderItem={(item, index, isSelected) => {
                return (
                  <View
                    style={{
                      ...styles.dropdownItemStyle,
                      ...(isSelected && {
                        backgroundColor: '#d5f2f2',
                        borderRadius: 12,
                        paddingLeft: 20,
                      }),
                    }}>
                    <Text style={styles.dropdownItemTxtStyle}>
                      {item.title}
                    </Text>
                  </View>
                );
              }}
              showsVerticalScrollIndicator={true}
              dropdownStyle={styles.dropdownMenuStyle}
            />
          </View>

          {/* Finish button */}
          <LinearGradient
            colors={language ? [primary, lightPrimary] : ['#ccc', '#aaa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 20,
              borderRadius: 12,
              elevation: 2,
              width: '97%',
              alignSelf: 'center',
            }}>
            <TouchableOpacity
              disabled={!language}
              onPress={finishHandler}
              style={{
                gap: 5,
                paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: responsiveFontSize(2.2),
                  fontFamily: 'Poppins-SemiBold',
                  opacity: language ? 1 : 0.9,
                  paddingTop: 2,
                }}>
                Finish
              </Text>

              <Icon4
                name="arrowright"
                size={23}
                color={language ? '#fff' : '#ddd'}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
};

export default SlidableSection;

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: '90%',
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-Medium',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 15,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 5,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Poppins-Medium',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});
