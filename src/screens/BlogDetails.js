import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { background, primary, secondary } from '../utils/colors';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

const BlogDetails = ({ route }) => {

    const { data } = route?.params;

    const navigation = useNavigation();

    const getTimeAgo = (dateString) => {
        if (!dateString) return 'Unknown date';

        const [day, month, year] = dateString.split('/').map(Number);
        const createdAt = new Date(year, month - 1, day);
        const now = new Date();

        const diffTime = now - createdAt;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) return `${diffYears}y ago`;
        if (diffMonths > 0) return `${diffMonths}mo ago`;
        return diffDays === 0 ? 'Today' : `${diffDays}d ago`;
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
                {/* StatusBar */}
                <StatusBar animated={true} barStyle={'dark-content'} hidden={false} />

                {/* Back Button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-start', width: 30, height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 }}>
                    <Ionicons name="arrow-back" size={27} color={'#000'} />
                </TouchableOpacity>

                {/* Category Header */}
                {data?.category && (
                    <Text style={{ fontSize: responsiveFontSize(2.6), fontFamily: 'Poppins-Bold', color: primary, textAlign: 'center', marginBottom: 5 }}>
                        {data.category}
                    </Text>
                )}

                <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>

                    {/* Title */}
                    {data?.title && (
                        <Text style={{ fontSize: responsiveFontSize(2.3), fontFamily: 'Poppins-SemiBold', color: '#333' }}>
                            {data.title}
                        </Text>
                    )}

                    {/* Author & Date */}
                    {(data?.author || data?.createdAt) && (
                        <Text style={{ fontSize: responsiveFontSize(1.7), fontFamily: 'Poppins-Medium', color: '#555', marginBottom: 15 }}>
                            {data?.author ? `By ${data.author}` : ''} {data?.createdAt ? `• ${getTimeAgo(data.createdAt)}` : ''}
                        </Text>
                    )}

                    {/* Image */}
                    {data?.imgSrc && (
                        <Image
                            source={require('../assets/blog5.jpeg')}
                            style={{ width: '100%', height: 200, borderRadius: 15, marginBottom: 10 }}
                            resizeMode="cover"
                        />
                    )}

                    {/* Description Section */}
                    {data?.desc && (
                        <View style={{ backgroundColor: secondary, padding: 14, borderRadius: 15, marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.9), fontFamily: 'Poppins-Medium', color: '#444' }}>
                                {data.desc}
                            </Text>
                        </View>
                    )}

                    {/* Eye-catching heading before content */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, marginBottom: 8 }}>
                        <Icon name="lightbulb-o" size={24} color={'#d2d52a'} style={{ marginRight: 8 }} />

                        <Text style={{ fontSize: responsiveFontSize(2.2), fontFamily: 'Poppins-Bold', color: '#222' }}>
                            Explore This Insightful Read
                        </Text>
                    </View>

                    {/* Content Sections */}
                    {data?.content?.length > 0 ? (
                        data.content.map((item, index) => (
                            <View key={index} style={{ marginBottom: 12 }}>
                                {item.title && (
                                    <Text style={{ fontSize: responsiveFontSize(2.1), fontFamily: 'Poppins-SemiBold', color: primary, marginBottom: 4 }}>
                                        {index + 1}. {item.title}
                                    </Text>
                                )}

                                {item.body && (
                                    <Text style={{ fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-Regular', color: '#666' }}>
                                        {item.body}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={{ fontSize: 16, fontFamily: 'Poppins-Medium', color: '#777', textAlign: 'center', marginTop: 10 }}>
                            No content available
                        </Text>
                    )}

                    {/* Message Section */}
                    {data?.message && (
                        <View style={{ backgroundColor: primary, padding: 15, borderRadius: 15, marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontFamily: 'Poppins-SemiBold', color: '#fff' }}>
                                {data.message}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default BlogDetails;