import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome6';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

const screenWidth = Dimensions.get('window').width;

// Enhanced TabButton to support both Icon libraries
const TabButton = ({ icon, iconLibrary, label, onPress }) => {
    const IconComponent = iconLibrary === 'FontAwesome6' ? Icon2 : Icon; // Choose correct icon library

    return (
        <TouchableOpacity onPress={onPress} style={{ alignItems: 'center' }}>
            <IconComponent name={icon} size={20} color="white" />
            <Text style={{
                color: 'white', fontSize: responsiveFontSize(1.2), fontFamily: 'Poppins-SemiBold', marginTop: 3
            }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const CustomTabBar = () => {
    const navigation = useNavigation();

    return (
        <View style={{
            position: 'absolute', bottom: 5, width: screenWidth * 0.97, height: 65,
            borderRadius: 18, overflow: 'hidden', alignSelf: 'center'
        }}>
            <LinearGradient
                colors={['#2D9596', '#36b1b3']}
                style={{
                    flex: 1, flexDirection: 'row', justifyContent: 'space-around',
                    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5
                }}
            >
                <TabButton icon="home" label="Home" onPress={() => navigation.navigate('Home')} />

                <TabButton icon="account-multiple" label="Counselors" onPress={() => navigation.navigate('Counselors')} />

                <TabButton icon="help-circle" label="Chat with Kiara" onPress={() => navigation.navigate('AiChat')} />

                <TabButton icon="bolt-lightning" iconLibrary="FontAwesome6" label="Quick Boost" onPress={() => navigation.navigate('QuickBoost')} />

                <TabButton icon="account-group" label="Community" onPress={() => navigation.navigate('Community')} />
                
            </LinearGradient>
        </View>
    );
};

export default CustomTabBar;
