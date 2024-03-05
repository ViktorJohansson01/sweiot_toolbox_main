import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Theme from './Theme';

const Connect = ({ startDeviceScan }: any) => {
    const imageSource: ImageSourcePropType = require('../android/app/src/main/res/SweIot.png');

    return (
        <Theme>
            {({ currentColors }: any) => (
                <View style={{
                    flex: 1,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: currentColors.secondaryColor
                }}>
                    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: "center" }}>

                        <Image
                            source={imageSource}
                            style={{ width: '40%', alignSelf: "center" }}
                            resizeMode="contain"
                        />

                    </View>
                    <View style={{ backgroundColor: currentColors.backgroundColor, width: '100%', borderRadius: 35, paddingVertical: "15%" }}>
                        <View style={{
                            
                            flexDirection: 'column',
                            justifyContent: 'space-evenly',
                            alignItems: 'center'
                        }}>
                            <View style={{ backgroundColor: currentColors.secondaryColor, padding: 20, borderRadius: 100, marginBottom: "10%" }}>
                                <Icon name="wifi" size={100} color={currentColors.primaryColor} />

                            </View>

                            <View style={{
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignContent: 'center',
                                width: '80%',
                                 marginBottom: "10%"
                            }}>


                                <Text style={{ fontSize: 20, fontWeight: "bold", color: currentColors.textColor, textAlign: 'center' }}>Detect Nearby Sensors</Text>
                                <Text style={{ fontSize: 16, color: currentColors.textColor, textAlign: 'center', marginTop: 10 }}>Tap 'Connect' to explore and connect with nearby sensors.</Text>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>

                                <TouchableOpacity accessibilityLabel="Connect button" onPress={() => startDeviceScan()} style={[styles.button, { backgroundColor: currentColors.primaryColor }]}>
                                    <Text style={styles.buttonText}>Connect</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>)}
        </Theme>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        marginTop: 15,
        padding: 17,
        borderRadius: 50,
        alignItems: 'center',
        width: '80%'
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    }
});

export default Connect;