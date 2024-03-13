import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, PanResponder, Animated, TextBase, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { lightColors } from '../colors';
import { Modal } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Theme from './Theme';
import AnimatedLottieView from 'lottie-react-native';
import _ from 'lodash';
import Slider from '@react-native-community/slider';
import Navbar from './common/Navbar';
import { AUTHORIZED_MODE, REQUIRE_SECURE_MODE, SECURE_MODE, UNSECURE_MODE } from '../App';
import Http from '../backend/Http';
import Server from '../backend/Server';

const DeviceList = React.memo(({ list, stopScanAndConnect, refreshScan, ownsDevice, app }: any) => {
    const [visibleItems, setVisibleItems]: any = useState([]);
    const [searchInput, setSearchInput]: any = useState('');
    const [numOfVisibleItems, setNumOfVisibleItems] = useState(0);
    const [sliderValue, setSliderValue] = useState(100);
    const [listVisibleItems, setListVisbleItems] = useState([]);
    const [initialLoad, setInitialLoad] = useState(false);
    const [checkedDevices, setCheckedDevices]: any = useState([]);
  

    useEffect(() => {
        const sortListBasedOnRSSI = (list: any) => {
            if (list.length > 1) {
                list.sort((a: any, b: any) => (b.rssi && a.rssi) && b.rssi! - a.rssi!);
            }
        };

        const updateVisibleItems = () => {

            let updatedVisibleItems = list;


            if (list.length > 0 && updatedVisibleItems && updatedVisibleItems.length > 0) {

                /*if (searchInput.length > 2) {
                    updatedVisibleItems = updatedVisibleItems.filter((device: any) => {
                        const deviceIdWithoutColons = device.id.toUpperCase().replace(/:/g, '');
                        const searchInputWithoutColons = searchInput.toUpperCase().replace(/:/g, '');

                        const searchPattern = new RegExp(`.*${searchInputWithoutColons}.*`);

                        return searchPattern.test(deviceIdWithoutColons);
                    });
                    sortListBasedOnRSSI(updatedVisibleItems);
                    setListVisbleItems(updatedVisibleItems);

                    loadInitValues(updatedVisibleItems);
                } else if (sliderValue <= 100) {
                    updatedVisibleItems = updatedVisibleItems.filter((device: any) => device?.rssi >= -sliderValue);
                    sortListBasedOnRSSI(updatedVisibleItems);
                    setListVisbleItems(updatedVisibleItems);

                    loadInitValues(updatedVisibleItems);
                }*/

                if (!_.isEqual(updatedVisibleItems, visibleItems)) {

                    addOwnedDevices(updatedVisibleItems);
                }
            }
        };

        const id = setInterval(updateVisibleItems, 500);


        const addOwnedDevices = (list: any) => {

            const deviceIds = list.map((device: any) => device.name);

        
            const newDeviceIds = deviceIds.filter((deviceId: any) => !checkedDevices.find((device: any) => device.name === deviceId));

            if (newDeviceIds.length === 0) {
                return;
            }

            if (REQUIRE_SECURE_MODE) {
                ownsDevice(newDeviceIds, (error: string, response: any, responseJson: any) => {
                    if (!error) {
                        const ownedDevices = responseJson.map((deviceInfo: any) => {
                            return {
                                name: deviceInfo[0],
                                settings: deviceInfo[1],
                                version: deviceInfo[2],
                                owned: deviceInfo[3]
                            };
                        });

                        ownedDevices.forEach((device: any) => {
                            setCheckedDevices((prev:any) => [...prev, device]);
                            
                            if (device.owned === true) {
                            const deviceOwned = list.find((devices: any) => devices.name === device.name);
                            console.warn(deviceOwned, "ownedDevice");
                        
                            setVisibleItems((prev:any) => [...prev, deviceOwned]);
                            
                            }
                        });

                  
                        setNumOfVisibleItems(visibleItems.length);
                        
                    }
                    if (isNotAuthorized(response, error)) {
                        console.log("ownsDevice, server API not authorized");
                        stopScanAndConnect("");
                        app.setLoginViewVisible(true);
                        app.setLoginStatusText("Session timed out, please enter login credentials");
                    }
                });
            } else {
                //setVisibleItems(list);
            }
        }
        return () => {
            clearInterval(id);
        };
    }, [list, sliderValue, searchInput, visibleItems, checkedDevices]);

    const loadInitValues = (updatedVisibleItems: any) => {
        if (!initialLoad) {
            updatedVisibleItems = updatedVisibleItems.slice(0, 10);
            setListVisbleItems(updatedVisibleItems);
            setInitialLoad(true);

        }
    }



    function isNotAuthorized(response: any, error: string): boolean {
        if (response !== null) {
            return (response.status === Http.ERROR_UNAUTHORIZED);
        }
        else {
            return (error === Server.NOT_AUTHORIZED);
        }

    }

    const expandDeviceList = () => {
        console.log("loading more...");
        const initialVisibleItems = visibleItems.slice(0, visibleItems.length + 10); // Adjust the initial count as needed
        setListVisbleItems(initialVisibleItems);
    };

    const restartDeviceScan = () => {
        list = [];
        setVisibleItems([]);
        setListVisbleItems([]);
        setNumOfVisibleItems(0);
        refreshScan();
    }

    const BleItemRender = React.memo(({ device, currentColors }: { device: Device, currentColors: any }) => {
        const memoizedColors = React.useMemo(() => currentColors, [currentColors]);
        return (
            <TouchableOpacity
                style={[styles.itemContainer, { backgroundColor: memoizedColors.backgroundColor }]}
                onPress={() => stopScanAndConnect(device.id)}
            >
                <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemText, { color: memoizedColors.textColor }]}>{device.id}</Text>
                    <Text style={[styles.itemDescription, { color: memoizedColors.describingTextColor }]}>Type</Text>
                </View>
                <View style={styles.itemIconContainer}>
                    <RSSIIcon rssi={device.rssi} currentColors={memoizedColors} />
                    <Text style={[styles.itemText, { color: memoizedColors.textColor }]}>{device.rssi + ' dBm'}</Text>
                </View>
                <SimpleLineIcons name="arrow-right" size={10} color={memoizedColors.primaryColor} />
            </TouchableOpacity>
        );
    });

    const RSSIIcon = ({ rssi, currentColors }: any) => (
        <View style={{}}>
            {rssi >= -50 ? (
                <Icon name="signal-cellular-3" size={15} color={currentColors.primaryColor} />
            ) : rssi <= -50 && rssi > -60 ? (
                <Icon name="signal-cellular-2" size={15} color={currentColors.primaryColor} />
            ) : rssi <= -60 && rssi > -70 ? (
                <Icon name="signal-cellular-1" size={15} color={currentColors.primaryColor} />
            ) : <Icon name="signal-cellular-outline" size={15} color={currentColors.primaryColor} />}
        </View>
    );

    const handleSearch = _.debounce((value: string) => {
        setSearchInput(value);
    }, 300);


    return (
        <Theme>
            {({ currentColors }: any) => (
                <View style={[styles.container, { backgroundColor: currentColors.secondaryColor }]}>
                    <Navbar />
                    <Text style={{ fontWeight: 'bold', fontSize: 20, width: '100%', marginBottom: 20, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                        Select your device
                    </Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: currentColors.backgroundColor }]}
                        placeholder='Search for device'
                        onChangeText={(value) => handleSearch(value)}
                    />

                    <Text style={{ fontSize: 15, width: '100%', marginTop: 20, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                        Filter on signal strenghts ({sliderValue >= 100 ? 'dBm' : -sliderValue + ' dBm'})
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        step={5}
                        maximumValue={100}
                        value={sliderValue}
                        thumbTintColor={currentColors.primaryColor}
                        maximumTrackTintColor={currentColors.primaryColor}
                        minimumTrackTintColor={currentColors.primaryColor}

                        onSlidingComplete={(value: any) => {
                            setSliderValue(value);
                        }}
                    />
                    <View style={{ justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, flexDirection: 'row', width: '100%' }}>


                        <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 20, marginTop: 20, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                            Result ({numOfVisibleItems})
                        </Text>
                        <TouchableOpacity
                            onPress={restartDeviceScan} accessibilityLabel='Cancel scanning'
                            style={{}}
                        >
                            <Icon name="restart" size={22} color={currentColors.describingTextColor} />
                        </TouchableOpacity>


                    </View>
                    {numOfVisibleItems < 1 ?
                        <View style={{
                            flex: 0.80,
                            minHeight: Dimensions.get('window').height / 3,
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <AnimatedLottieView
                                source={require("../files/spin.json")}
                                style={{ width: "100%", height: 200 }}
                                autoPlay
                                loop
                            />
                        </View>
                        :
                        <View
                            style={{
                                width: "95%",
                                flex: 1,
                                minHeight: Dimensions.get('window').height / 3,
                                borderRadius: 20,
                                overflow: 'hidden',
                                justifyContent: 'flex-start',
                                marginBottom: 35,
                            }}
                        >
                            <FlatList
                                showsVerticalScrollIndicator={true}
                                data={visibleItems}
                                renderItem={({ item }) => <BleItemRender device={item} currentColors={currentColors} />}
                                keyExtractor={(item: Device) => item.id}
                                updateCellsBatchingPeriod={50}
                                windowSize={10}
                                extraData={{ searchInput, sliderValue }}
                                onEndReached={expandDeviceList}
                                onEndReachedThreshold={0.1}
                                style={{ flex: 1 }} // Add this line
                            />


                        </View>}
                    <TouchableOpacity
                        onPress={() => stopScanAndConnect('')} accessibilityLabel='Cancel scanning'
                        style={[styles.button, { position: 'absolute', bottom: 20, alignSelf: 'center' }]}
                    >
                        <Text style={styles.buttonText}>Cancel scanning</Text>
                    </TouchableOpacity>
                    <View style={{ paddingTop: 50 }}></View>
                </View>

            )}
        </Theme>
    );
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        marginTop: 10,
        padding: 17,
        backgroundColor: lightColors.primaryColor,
        borderRadius: 50,
        alignItems: 'center',
        width: '95%'
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    slider: {
        width: '97%',
        marginTop: 10,
        height: 30,
        alignSelf: 'flex-start'
    },
    textInput: {
        width: '95%',
        height: 50,
        borderRadius: 100,
        paddingLeft: 20
    },
    itemContainer: {
        marginVertical: 2,
        flex: 1,
        height: 70,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    itemTextContainer: {
        flexDirection: 'column',
    },
    itemText: {
        fontSize: 12,
    },
    itemDescription: {
        marginTop: 2,
    },
    itemIconContainer: {
        alignItems: 'center',
    },

    // New styles for RSSIIcon
    rssiIconContainer: {},
});

export default DeviceList;