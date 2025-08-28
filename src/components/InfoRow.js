import { View, Text } from "react-native";
import { responsiveFontSize } from "react-native-responsive-dimensions";

const InfoRow = ({ label, value }) => {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6, paddingHorizontal: 10 }}>
            <Text style={{
                fontFamily: 'Poppins-Medium',
                fontSize: responsiveFontSize(1.7),
                color: '#334155'
            }}>
                {label}
            </Text>

            <Text style={{
                fontFamily: 'Poppins-Regular',
                fontSize: responsiveFontSize(1.7),
                color: '#64748b'
            }}>
                {value}
            </Text>
        </View>
    );
};

export default InfoRow;