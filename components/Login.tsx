import { string } from 'hex-my-bytes';
import { Image, ImageSourcePropType } from 'react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { Label } from 'recharts';
import Theme from './Theme';

const Login = ({ loginStatusText, saveCustomerName, saveCustomerPassword, getCustomerName, getCustomerPassword, isLoginButtonsDisabled, loginServer }: any) => {
    const imageSource: ImageSourcePropType = require('../android/app/src/main/res/SweIot.png');
    const TEST_USER_NAME = "superknut";
    const TEST_USER_PASSWORD = "superknutpassword_3951";
    return (
        <Theme>
            {({ currentColors }: any) => (
        <View style={{
            backgroundColor: currentColors.secondaryColor,
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
        }}>


            <View style={{flex: 1,width: '100%', alignItems: 'center', justifyContent: "center" }}>

                <Image
                    source={imageSource}
                    style={{ width: '50%', alignSelf: "center",  }}
                    resizeMode="contain"
                />
                
            </View>

            <View style={{backgroundColor: currentColors.backgroundColor, width: '100%', borderRadius: 35}}>
            <View style={{width: '85%', alignSelf: "center"}}>
            
            <Text style={{ fontSize: 25, marginTop: "10%", color: currentColors.textColor }}> {"Log in"} </Text>
            {loginStatusText && <Text style={{ fontSize: 12, color: currentColors.textColor, marginTop: "5%" }}> {loginStatusText} </Text>}
            
                <View style={{marginTop: "10%"}}>
                    <Text style={{color: currentColors.textColor, position: "absolute", top: -10, left: 20, backgroundColor: currentColors.backgroundColor, zIndex: 10, paddingHorizontal: 5}}>Username</Text>
                    <TextInput style={{ padding: "4%", fontSize: 16, fontWeight: "normal", borderWidth: 1, borderColor: currentColors.textColor, color: currentColors.textColor, borderRadius: 10, width: '100%', paddingLeft: 22 }} placeholder={"Username"} onChangeText={(text: string) => saveCustomerName(text)} />
                </View>
                <View style={{marginTop: "10%"}}>
                    <Text style={{color: currentColors.textColor, position: "absolute", top: -10, left: 20, backgroundColor: currentColors.backgroundColor, zIndex: 10, paddingHorizontal: 5}}>Password</Text>
                    <TextInput style={{ padding: "4%", fontSize: 16, fontWeight: "normal", borderWidth: 1, borderColor: currentColors.textColor, color: currentColors.textColor, borderRadius: 10, width: '100%', paddingLeft: 22 }} placeholder={"Password"} onChangeText={(text: string) => saveCustomerPassword(text)} />
                </View>


                <View style={{
                    marginVertical: "10%",
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>

                    <TouchableOpacity
                        onPress={() => loginServer.serverLogin(TEST_USER_NAME, TEST_USER_PASSWORD)} 

                        style={[styles.button, { backgroundColor: currentColors.primaryColor, alignSelf: 'center' }]}
                    >
                        <Text style={[styles.buttonText]}>Log in</Text>
                    </TouchableOpacity>
                </View>
                
            </View>
            </View>


        </View>
            )}</Theme>
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
        marginTop: "3%",
        padding: 17,
        borderRadius: 50,
        alignItems: 'center',
        width: '100%'
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default Login;