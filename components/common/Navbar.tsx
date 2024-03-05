
import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import Theme from '../Theme';
import { NativeBaseProvider } from 'native-base';
const Navbar = () => {
    const imageSource: ImageSourcePropType = require('../../android/app/src/main/res/SweIot.png');
    
    return (
        <Theme>

            {({ currentColors }: any) => (
       
                    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: "center", marginVertical: "5%" }}>

                        <Image
                            source={imageSource}
                            style={{ width: '30%', alignSelf: "center" }}
                            resizeMode="contain"
                        />

                    </View>

               )}
        </Theme>
    );
};

export default Navbar;