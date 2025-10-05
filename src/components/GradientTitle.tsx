import React from 'react';
import { Platform, StyleSheet, Text, TextProps } from 'react-native';
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
  // Web fallback: use CSS linear-gradient with background-clip to render gradient text
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
  return (
    <MaskedView
      maskElement={
        <Text
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          accessible={false}
          importantForAccessibility="no"
          style={[styles.text, style]}
        >
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={[theme.gradients.header.from, theme.gradients.header.to]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text
          accessible={false}
          importantForAccessibility="no"
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          style={[styles.text, style, styles.gradientText]}
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
  gradientText: {
    color: 'transparent',
  },
});

export default GradientTitle;
