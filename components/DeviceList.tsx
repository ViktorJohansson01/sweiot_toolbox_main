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
import { StorageUtil } from '../utilities/StorageUtil';

const DeviceList = React.memo(({ list, bleHelp, stopDeviceScan, refreshScan }: any) => {
    const [visibleItems, setVisibleItems]: any = useState([]);
    const [searchInput, setSearchInput]: any = useState('');
    const [numOfVisibleItems, setNumOfVisibleItems] = useState(0);
    const [sliderValue, setSliderValue] = useState(100);
    console.log("te");

    useEffect(() => {
        const id = setInterval(() => {
            const updatedList = list;
            if (list.length > 0) {
            let updatedVisibleItems = list;

            if (searchInput.length > 2) {
                updatedVisibleItems = updatedList.filter((device: any) => device.id.includes(searchInput));
                sortListBasedOnRSSI(updatedVisibleItems);
            } else if (sliderValue <= 100) {
                updatedVisibleItems = updatedList.filter((device: any) => device?.rssi >= -sliderValue);
                sortListBasedOnRSSI(updatedVisibleItems);
            }

            if (!_.isEqual(updatedVisibleItems, visibleItems)) {
                setNumOfVisibleItems(updatedVisibleItems.length);
                setVisibleItems(updatedVisibleItems);
            }
            }
        }, 1000);

        return () => {
            clearInterval(id);
        };
    }, [list, sliderValue, searchInput]);

    const sortListBasedOnRSSI = (list: any) => {
        if (list.length > 1) {
            list.sort((a: any, b: any) => (b.rssi && a.rssi) && b.rssi! - a.rssi!);
        }
    };

    const restartDeviceScan = () => {
        list = [];
        setVisibleItems([]);
        refreshScan();
    }

    const BleItemRender = React.memo(({ device, currentColors }: { device: Device, currentColors: any }) => (
        <TouchableOpacity
            style={{
                marginVertical: 2,
                backgroundColor: currentColors.backgroundColor,
                flex: 1,
                height: 70,
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
            }}
            onPress={() => bleHelp.bleStopScanningAndConnect(device.id)}
        >
            <View style={{
                flexDirection: 'column'
            }}>
                <Text style={{ fontSize: 15, color: currentColors.textColor }}>{device.id}</Text>
                <Text style={{
                    marginTop: 2,
                    color: currentColors.describingTextColor
                }}>Type</Text>
            </View>
            <View style={{
                alignItems: 'center'
            }}>
                <RSSIIcon rssi={device.rssi} currentColors={currentColors} />
                <Text style={{ fontSize: 10, color: currentColors.textColor }}>{device.rssi + ' dBm'}</Text>
            </View>
            <SimpleLineIcons name="arrow-right" size={10} color={currentColors.primaryColor} />
        </TouchableOpacity>
    ));

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
                <View style={[styles.container, { backgroundColor: currentColors.secondaryColor, paddingTop: 50 }]}>
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
                    <View style={{justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, flexDirection: 'row', width: '100%'}}>
                    
                    
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
                                maxHeight: "55%",
                                borderRadius: 20,
                                overflow: 'hidden',
                                justifyContent: 'flex-start'
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
                            />

                        </View>}
                    <TouchableOpacity
                        onPress={() => {stopDeviceScan();}} accessibilityLabel='Cancel scanning'
                        style={[styles.button, { position: 'absolute', bottom: 20, alignSelf: 'center' }]}
                    >
                        <Text style={styles.buttonText}>Cancel scanning</Text>
                    </TouchableOpacity>
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
});

export default DeviceList;