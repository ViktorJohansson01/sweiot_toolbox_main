import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { lightColors } from '../colors';
import Theme from './Theme';
import LottieView from "lottie-react-native";

const Loading = () => {

    return (
        <Theme>
            {({ currentColors }: any) => (
                <View accessibilityLabel="Loading animation" style={[styles.container, { backgroundColor: currentColors.backgroundColor }]}>

                    <LottieView
                        source={require("../files/spin.json")}
                        style={{ width: "100%", height: 100 }}
                        autoPlay
                        loop   
                    />
                    <Text accessibilityLabel="Connecting Device...">Connecting Device...</Text>
                </View>
            )}
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

export default Loading;