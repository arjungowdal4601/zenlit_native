import React from 'react';
import { Platform, StyleSheet, Text, TextProps, StyleSheet as RNStyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../styles/theme';

type GradientTitleProps = {
  text: string;
  style?: TextProps['style'];
  numberOfLines?: number;
  ellipsizeMode?: TextProps['ellipsizeMode'];
};

export const GradientTitle: React.FC<GradientTitleProps> = ({
  text,
  style,
  numberOfLines = 1,
  ellipsizeMode = 'tail',
}) => {
  if (Platform.OS === 'web') {
    const webGradientStyle: any = {
      backgroundImage: `linear-gradient(90deg, ${theme.gradients.header.from}, ${theme.gradients.header.to})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      display: 'inline-block',
    };

    return (
      <Text
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        accessible={false}
        importantForAccessibility="no"
        style={[styles.text, style, webGradientStyle]}
      >
        {text}
      </Text>
    );
  }

  const flattened = (RNStyleSheet.flatten([styles.text, style]) || {}) as TextStyle;
  const lineHeight = flattened.lineHeight ?? theme.header.title.lineHeight;

  return (
    <MaskedView
      maskElement={
        <Text
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          style={[styles.text, style]}
        >
          {text}
        </Text>
      }
      style={styles.maskContainer}
    >
      <LinearGradient
        colors={theme.gradients.header.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientFill, { height: lineHeight }]}
      >
        <Text
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          style={[styles.text, style, styles.hiddenText]}
          accessible={false}
          importantForAccessibility="no"
        >
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: theme.header.title.fontSize,
    lineHeight: theme.header.title.lineHeight,
    fontWeight: theme.header.title.fontWeight,
    letterSpacing: theme.header.title.letterSpacing,
  },
  maskContainer: {
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  gradientFill: {
    justifyContent: 'center',
  },
  hiddenText: {
    color: 'transparent',
  },
});

export default GradientTitle;
