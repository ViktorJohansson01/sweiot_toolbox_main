import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Theme from './Theme';

const Connect = ({ startDeviceScan }: any) => {
    console.log("connect");
    
    return (
        <Theme>
            {({ currentColors }: any) => (
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: currentColors.backgroundColor
                }}>

                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        justifyContent: 'space-evenly',
                        alignItems: 'center'
                    }}>
                        <View style={{ backgroundColor: currentColors.secondaryColor, padding: 20, borderRadius: 100 }}>
                            <Icon name="wifi" size={100} color={currentColors.primaryColor} />

                        </View>

                        <View style={{
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignContent: 'center',
                            width: '80%'
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