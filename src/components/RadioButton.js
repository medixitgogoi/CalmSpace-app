import {View, Text, TouchableOpacity} from 'react-native';
import {primary} from '../utils/colors';
import {responsiveFontSize} from 'react-native-responsive-dimensions';

const RadioButton = ({label, selected, onPress}) => {
  return (
    <TouchableOpacity
      style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}
      onPress={onPress}>
      <View
        style={{
          height: 20,
          width: 20,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? '#1f8dba' : '#a6a6a6',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected && (
          <View
            style={{
              height: 10,
              width: 10,
              borderRadius: 6,
              backgroundColor: '#1f8dba',
            }}
          />
        )}
      </View>

      <Text
        style={{
          marginLeft: 8,
          color: primary,
          fontFamily: 'Poppins-SemiBold',
          fontSize: responsiveFontSize(1.8),
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default RadioButton;
