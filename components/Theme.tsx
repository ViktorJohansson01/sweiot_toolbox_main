import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from '../colors';

const Theme = ({ children }: any) => {
  const [currentColors, setCurrentColors] = useState(
    Appearance.getColorScheme() === 'dark' ? darkColors : lightColors
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentColors(colorScheme === 'dark' ? darkColors : lightColors);
      console.log(colorScheme);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (typeof children === 'function') {
    return children({ currentColors });
  }

  return null; // or return children; if it's not a function
};

export default Theme;