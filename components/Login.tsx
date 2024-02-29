import { string } from 'hex-my-bytes';
import { Image, ImageSourcePropType } from 'react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Device } from 'react-native-ble-plx';

const Login = ({ loginStatusText, saveCustomerName, saveCustomerPassword, getCustomerName, getCustomerPassword, isLoginButtonsDisabled, loginServer }: any) => {
    const imageSource: ImageSourcePropType = require('../android/app/src/main/res/SweIot.jpg');
    const TEST_USER_NAME = "superknut";
    const TEST_USER_PASSWORD = "superknutpassword_3951";
    return (
        <View style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-evenly', 
            alignItems: 'center',
            width: '100%'
        }}>


            <View style={{width: '100%', alignItems: 'center' }}>
                {/*<Text style={{ fontSize: 18, fontWeight: "bold" }}> {headline + currentChannel + ", " + securityStatus} </Text>*/}

                <Image
                    source={imageSource}
                    style={{ width: '75%' }}
                    resizeMode="contain"
                />
                
            </View>


            {/*<Text style = {{fontWeight: "normal"}}> { internetStatusText } </Text> - Behövs detta?*/}
            <View style={{width: '75%'}}>
            <Text style={{ fontSize: 30, fontWeight: "bold", color: 'black' }}> {"Login"} </Text>
                <Text style={{ fontWeight: "normal", width: '100%', marginTop: 15 }}> {loginStatusText} </Text>



                <TextInput style={{ fontSize: 16, fontWeight: "normal", borderBottomWidth: 1, borderColor: 'black', borderRadius: 10, width: '100%', marginTop: 50 }} placeholder={"Username"} onChangeText={(text: string) => saveCustomerName(text)} />

                <TextInput style={{ fontSize: 16, fontWeight: "normal", borderBottomWidth: 1, borderColor: 'black', borderRadius: 10, width: '100%', marginTop: 25 }} placeholder={"Password"} onChangeText={(text: string) => saveCustomerPassword(text)} />

                <View style={{

                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>

                    <TouchableOpacity disabled={isLoginButtonsDisabled} onPress={() => loginServer.serverLogin(TEST_USER_NAME, TEST_USER_PASSWORD)} style={styles.button}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>



        </View>
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
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
        alignItems: 'center',
        width: '100%'
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    }
});

export default Login;