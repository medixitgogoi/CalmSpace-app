import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchUserData } from '../../utils/fetchUserData';
import InfoRow from '../../components/InfoRow';
import Sidebar from '../../components/Sidebar';
import LottieView from 'lottie-react-native';
import { getCounselorByID } from '../../utils/getCounselorByID';
import { connectSocket } from '../../redux/socketSlice';
import { background } from '../../utils/colors';

const Dashboard = ({ navigation }) => {
  const dispatch = useDispatch();

  const [sidebarVisible, setSidebarVisible] = useState(false);

  const userDetails = useSelector(state => state.user);
  const authToken = userDetails?.authToken;

  const [data, setData] = useState(null);

  const [newCounselor, setNewCounselor] = useState(false);
  const [infoCounselorAdded, setInfoCounselorAdded] = useState(true);

  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [counselorLoading, setCounselorLoading] = useState(true);

  const [userId, setUserId] = useState(null);

  // fetchUserData
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await fetchUserData(authToken);

          setData(data?.user);

          if (data?.isComplete) {
            setNewCounselor(false);
          } else {
            setNewCounselor(true);
          }
        } catch (error) {
          console.log('Error fetching counselor data: ', error);
        } finally {
          setUserLoading(false);
        }
      };

      fetchData();
      return () => { };
    }, []),
  );

  // getCounselorByID
  useFocusEffect(
    useCallback(() => {
      if (!newCounselor) {
        const fetchData = async () => {
          try {
            const data = await getCounselorByID(authToken);

            if (!data) {
              setInfoCounselorAdded(false);
            }

            if (data) {
              setUserId(data?.counselorId?._id);
            }
          } catch (error) {
            console.log('Error fetching counselor: ', error);
          } finally {
            setCounselorLoading(false);
          }
        };

        fetchData();
      }
    }, [newCounselor, authToken]), // dependencies must include used variables
  );

  // Combine loading states
  useEffect(() => {
    if (!userLoading && !counselorLoading) {
      setLoading(false);
    }
  }, [userLoading, counselorLoading]);

  // call connect socket
  useEffect(() => {
    if (userId) {
      dispatch(connectSocket({ userId: userId }));
    }
  }, [userId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ecf9f9" />

        {/* Menu icon */}
        {!newCounselor && (
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 55 : 45, left: 18 }}>
            <Ionicons name="menu-outline" size={25} color="#0f172a" />
          </TouchableOpacity>
        )}

        {/* Sidebar */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onQuickBoost={() => {
            setSidebarVisible(false);
            navigation.navigate('QuickBoost');
          }}
          onSlot={() => {
            setSidebarVisible(false);
            navigation.navigate('Slot');
          }}
          onCommunity={() => {
            setSidebarVisible(false);
            navigation.navigate('CommunityCounselor');
          }}
          onAppointment={() => {
            setSidebarVisible(false);
            navigation.navigate('Appointments')
          }}

        />

        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: background,
            }}>
            {/* Lottie Animation */}
            <View
              style={{
                width: 270,
                height: 270,
                alignSelf: 'center',
                marginBottom: 20,
              }}>
              <LottieView
                source={require('../../assets/animations/loading.json')}
                autoPlay
                loop
                style={{
                  height: '100%',
                  alignSelf: 'center',
                  marginBottom: 20,
                  width: '100%',
                }}
              />
            </View>
          </View>
        ) : (
          <>
            {!newCounselor ? (
              <>
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Image
                    source={{ uri: data?.pic }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 2,
                      borderColor: '# ',
                      marginBottom: 10,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: responsiveFontSize(2.5),
                      color: '#0f172a',
                    }}>
                    {data?.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: responsiveFontSize(1.8),
                      color: '#475569',
                    }}>
                    {data?.email}
                  </Text>
                </View>

                {/* Info Section */}
                <View
                  style={{
                    marginTop: 30,
                    backgroundColor: '#ffffff',
                    padding: 10,
                    borderRadius: 20,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}>
                  <View
                    style={{
                      backgroundColor: '#e0f7fb',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      marginBottom: 20,
                    }}>
                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: responsiveFontSize(2.2),
                        color: '#0ea5e9',
                        textAlign: 'center',
                      }}>
                      About Counselor
                    </Text>
                  </View>

                  <InfoRow label="Age" value={data?.age} />
                  <InfoRow label="Gender" value={data?.gender} />
                  <InfoRow label="Role" value={data?.role} />
                  <InfoRow
                    label="Joined on"
                    value={new Date(data?.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  />
                </View>

                {infoCounselorAdded ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('UpdateProfile')}
                    style={{
                      backgroundColor: '#f7fdfd',
                      paddingVertical: 12,
                      marginTop: 20,
                      borderRadius: 12,
                      alignItems: 'center',
                      borderColor: '#0ea5e9',
                      borderWidth: 1,
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}>
                    <Ionicons
                      name="create-outline"
                      size={23}
                      color="#0ea5e9"
                      style={{ marginRight: 5 }}
                    />

                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: responsiveFontSize(2),
                        color: '#0ea5e9',
                        letterSpacing: 1,
                      }}>
                      Update Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AddDetails')}
                    style={{
                      backgroundColor: '#f7fdfd',
                      paddingVertical: 12,
                      marginTop: 20,
                      borderRadius: 12,
                      alignItems: 'center',
                      borderColor: '#0ea5e9',
                      borderWidth: 1,
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}>
                    <Ionicons
                      name="document-text-outline"
                      size={23}
                      color="#0ea5e9"
                      style={{ marginRight: 5 }}
                    />

                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: responsiveFontSize(2),
                        color: '#0ea5e9',
                        letterSpacing: 1,
                      }}>
                      Add Details
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View
                style={{
                  flex: 0.9,
                  padding: 20,
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    borderRadius: 16,
                    padding: 24,
                    alignItems: 'center',
                  }}>
                  <Ionicons
                    name="person-circle-outline"
                    size={60}
                    color="#0ea5e9"
                    style={{ marginBottom: 12 }}
                  />

                  <Text
                    style={{
                      fontSize: responsiveFontSize(2.4),
                      fontFamily: 'Poppins-SemiBold',
                      color: '#0f172a',
                      textAlign: 'center',
                      marginBottom: 5,
                    }}>
                    Complete Your Profile
                  </Text>

                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontFamily: 'Poppins-Regular',
                      color: '#334155',
                      textAlign: 'center',
                    }}>
                    Please complete your profile so users can find you and trust
                    your valuable services.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('CompleteProfile', { data: 2 })
                  }
                  style={{
                    backgroundColor: '#0ea5e9',
                    paddingVertical: 10,
                    marginTop: 7,
                    borderRadius: 13,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4,
                  }}>
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: responsiveFontSize(2),
                      color: '#fff',
                      letterSpacing: 1,
                    }}>
                    Add Profile Details
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Dashboard;
