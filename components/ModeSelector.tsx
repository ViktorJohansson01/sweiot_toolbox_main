import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import _ from 'lodash';
import uiBuilderData from '../userinterface/uiBuilder.json';
import Theme from './Theme';

const ModeSelector = ({ sendSystemSettingsReq, app }: any) => {
  const [selectedApplication, setSelectedApplication] = useState(0);

  const debouncedSendSystemSettingsReq = _.debounce((selectedApp: any) => {
    sendSystemSettingsReq(`sys:${selectedApp},,,,,1`);
    console.log(`sys:${selectedApp},,,,,1`);
    app.setModeSelectorViewVisible(false);
  }, 1000); 

  const ModeItemRender = React.memo(({ data, currentColors }: { data: any, currentColors: any }) => (
    <TouchableOpacity
      style={{
        marginVertical: 2,
        backgroundColor: currentColors.backgroundColor,
        flex: 1,
        height: 100,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 30,
      }}
      accessibilityLabel={`Device id: ` + data.type}
      onPress={() => setSelectedApplication(parseInt(data.command))}>

      <View style={{
        flexDirection: 'column'
      }}>
        <Text style={{ fontSize: 17, color: currentColors.textColor }}>{data.type}</Text>
        <Text style={{
          marginTop: 2,
          color: currentColors.describingTextColor
        }}>{data.help && data.help}</Text>
      </View>
    </TouchableOpacity>
  ));

  useEffect(() => {
    if (selectedApplication !== 0) {
      debouncedSendSystemSettingsReq(selectedApplication);
    }
  }, [selectedApplication]);

  const types = uiBuilderData.config
    .filter((data) => data.command !== "sys" && data.type !== undefined);

  return (
    <Theme>
      {({ currentColors }: any) => (
        <View style={[styles.container, { backgroundColor: currentColors.secondaryColor }]}>
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%'
            }}>
            <View style={{
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%'
            }}>
              <Text accessibilityLabel='Select what measuring mode you want to use' style={{ fontWeight: 'bold', fontSize: 20, width: '100%', marginBottom: 20, marginLeft: 30, backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                Select Measurement Mode
              </Text>
              <View
                style={{
                  width: Dimensions.get('window').width * 0.95,
                  maxHeight: Dimensions.get('window').height * 0.75,
                  justifyContent: 'flex-start',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <FlatList
                  showsVerticalScrollIndicator={true}
                  data={types}
                  renderItem={({ item }) => <ModeItemRender data={item} currentColors={currentColors} />}
                  keyExtractor={(item, index) => index.toString()}
                  updateCellsBatchingPeriod={50}
                  windowSize={10}
                  
                />
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
    marginTop: 10,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  }
});

export default ModeSelector;