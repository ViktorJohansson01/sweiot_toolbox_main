import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Settings, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Theme from './Theme';
import uiBuilderData from '../userinterface/uiBuilder.json';
import ConfigUtilities from '../utilities/ConfigUtilities';
import { Dropdown } from 'react-native-element-dropdown';

interface ConfigData {
    configIndex: number;
    parameterIndex: number;
    help: string;
    isSuperUser: boolean;
    title: string;
}

const Config = ({ configIndex, isSuperUser, showCallback, getParTextState, setParTextState, setParTextListState, sendDataSetParsCmd, sendDataReqCmd, setSelectedModeIndex, setShowConfig}: any) => {
    const [configData, setConfigData] = useState([] as Array<ConfigData>);
    const [title, setTitle] = useState('undefined')
    useEffect(() => {
      console.log("configIndex", configIndex, Object.keys(uiBuilderData.config[2].parameter).length);
        console.log("this", configIndex);
        
        sendDataReqCmd(configIndex);
        setConfigData([]);

        for (let parameterIndex = 0; parameterIndex < Object.keys(uiBuilderData.config[configIndex].parameter).length; parameterIndex++) {
            const help = uiBuilderData.config[configIndex].parameter[parameterIndex].help;
            const title = uiBuilderData.config[configIndex].type;
            setTitle(title)
            console.log(uiBuilderData.config[configIndex].parameter[parameterIndex]);
            
            if ((uiBuilderData.actOnVisible === "true" && uiBuilderData.config[configIndex].parameter[parameterIndex].visible === "true") || (isSuperUser)) {
                setConfigData((prev: ConfigData[]) => [...prev, { configIndex, parameterIndex, help, isSuperUser, title }]);
            }
        }
        
    }, [])

    const types:any = uiBuilderData.config
    .filter((data) => data.command !== "sys" && data.type !== undefined).map((data) => {return {label: data.type, value: data.command}});

    const findByCommand:any = (command: any) => 
      uiBuilderData.config.filter(data => data.command === command).map((data) => data.type)
    
      const findIndexByCommand:any = (command: any) => uiBuilderData.config.findIndex(data => data.command === command);

    return (
        <Theme>
        {({ currentColors }: any) => (
            <View style={[styles.container, { backgroundColor: currentColors.secondaryColor, paddingTop: 50, marginBottom: 40 }]}>
            <View style={{width: "90%", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                <TouchableOpacity onPress={() => showCallback(false)}>
                <Icon name="arrow-back" size={30} color={currentColors.describingTextColor} />
                </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 20, width: '100%', marginVertical: 30, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                    {title} Settings
                </Text>
            <View style={{ borderRadius: 20, width: '90%', overflow: 'hidden', backgroundColor: currentColors.backgroundColor, paddingVertical: 5, marginBottom: 20 }}>
              {configData.map((data, index) => (
                
                <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: index === 0 ? 0 : 0.5 }} key={`${data.configIndex}-${data.parameterIndex}`}>
                  
                  <View style={{ flex: 4, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 16, color: currentColors.textColor }}>{uiBuilderData.config[data.configIndex].parameter[data.parameterIndex].name}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => { Alert.alert('Help', data.help); }} >
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: currentColors.primaryColor }}>?</Text>
                    </TouchableOpacity>
                  </View>
                    {uiBuilderData.config[data.configIndex].parameter[data.parameterIndex].name === "Selected Application" ? 
                    <Dropdown
                    containerStyle={{backgroundColor: currentColors.backgroundColor}} style={{width: 120, borderColor: 'gray', borderWidth: 0.5}} placeholder={findByCommand(getParTextState(index))} labelField={"label"} valueField={"value"} data={types} 
                    onChange={(item => {ConfigUtilities.checkDataToBeSent(data.configIndex, data.parameterIndex, item.value, setParTextState); setSelectedModeIndex(findIndexByCommand(item.value))})}            
                    /> : <TextInput
                    style={{ fontSize: 18, fontWeight: 'normal', color: currentColors.textColor, borderColor: currentColors.describingTextColor, borderRadius: 5, padding: 5 }}
                    onChangeText={(text) => {
           
                      ConfigUtilities.checkDataToBeSent(data.configIndex, data.parameterIndex, text, setParTextState);
                      
                    }}
                    value={getParTextState(index)}
                  />
                  }
               
                 
                </View>
              ))}
              
            </View>
            <TouchableOpacity
                        onPress={() => {ConfigUtilities.sendPars(configIndex, sendDataSetParsCmd)
                        console.log(configIndex, sendDataSetParsCmd, "ja");
                        setShowConfig(false);
                        }} 
                        style={[styles.button, { backgroundColor: currentColors.primaryColor, alignSelf: 'center' }]}
                    >
                        <Text style={[styles.buttonText, {color:currentColors.backgroundColor}]}>Save</Text>
                    </TouchableOpacity>
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
        padding: 17,
        borderRadius: 50,
        alignItems: 'center',
        width: '80%'
    },
    buttonText: {
        fontSize: 16,
    }
});

export default Config;