import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { lightColors } from '../colors';
import { Modal } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Theme from './Theme';
import AnimatedLottieView from 'lottie-react-native';
import _ from 'lodash';

const DeviceList = React.memo(({ list, bleHelp, currentColors }: any) => {
    const [visibleItems, setVisibleItems] = useState<any[]>([]);
    const [isNextItemLoadable, setNextItemLoadable] = useState(true);
    const [numberOfVisibleItems, setNumberOfVisibleItems] = useState<number>(10);
    
    useEffect(() => {
        setNextItemLoadable(true);
  
        setVisibleItems(list.slice(0, numberOfVisibleItems));
    }, [list, numberOfVisibleItems]);

    const onEndReached = () => {
        if (isNextItemLoadable) {
            setNextItemLoadable(false);
    
            setNumberOfVisibleItems((prev) => prev + 10);
    
            const newVisibleItems = list.slice(0, numberOfVisibleItems);
    
            setVisibleItems(newVisibleItems);
        }
    };

    const BleItemRender = ({ device, currentColors }: { device: Device, currentColors: any }) => (
        <TouchableOpacity
            style={{

                marginVertical: 2,
                backgroundColor: currentColors.backgroundColor,
                flex: 1,
                height: 100,
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
                <Text style={{ fontSize: 12, color: currentColors.textColor }}>{device.rssi + ' dBm'}</Text>
            </View>
            <SimpleLineIcons name="arrow-right" size={10} color={currentColors.primaryColor} />
        </TouchableOpacity>
    );

    const RSSIIcon = ({ rssi, currentColors }: any) => (
        <View style={{}}>
            {rssi >= -50 ? (
                <Icon name="signal-cellular-3" size={20} color={currentColors.primaryColor} />
            ) : rssi <= -50 && rssi > -60 ? (
                <Icon name="signal-cellular-2" size={20} color={currentColors.primaryColor} />
            ) : rssi <= -60 && rssi > -70 ? (
                <Icon name="signal-cellular-1" size={20} color={currentColors.primaryColor} />
            ) : <Icon name="signal-cellular-outline" size={20} color={currentColors.primaryColor} />}
        </View>
    );

    return (
        <Theme>
            {({ currentColors }: any) => (
                <View style={[styles.container, { backgroundColor: currentColors.secondaryColor, paddingTop: 50 }]}>
                    <Text style={{ fontWeight: 'bold', fontSize: 20, width: '100%', marginBottom: 20, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                        Select your device
                    </Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 15, width: '100%', marginBottom: 20, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                        Result ({list.length})
                    </Text>
                    {visibleItems.length < 1 ?
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
                                width: Dimensions.get('window').width * 0.95,
                                maxHeight: Dimensions.get('window').height * 0.70,
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
                                updateCellsBatchingPeriod={20}
                                windowSize={10}
                                onEndReached={onEndReached}
                                onEndReachedThreshold={0.1}
                            />

                        </View>}
                    <TouchableOpacity
                        onPress={() => bleHelp.bleStopScanningAndConnect('')} accessibilityLabel='Cancel scanning'
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
    }
});

export default DeviceList;