import React from 'react';
import { Platform, StyleSheet, Text, TextProps, View } from 'react-native';
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

  return (
    <MaskedView
      style={styles.maskContainer}
      maskElement={
        <View style={styles.maskWrapper}>
          <Text
            numberOfLines={numberOfLines}
            ellipsizeMode={ellipsizeMode}
            accessible={false}
            importantForAccessibility="no"
            style={[styles.text, style]}
          >
            {text}
          </Text>
        </View>
      }
    >
      <LinearGradient
        colors={[theme.gradients.header.from, theme.gradients.header.to]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientFill}
      >
        <Text
          accessible={false}
          importantForAccessibility="no"
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          style={[styles.text, style, styles.hiddenText]}
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
    flexShrink: 1,
    alignSelf: 'flex-start',
  },
  maskWrapper: {
    backgroundColor: 'transparent',
  },
  gradientFill: {
    alignSelf: 'flex-start',
  },
  hiddenText: {
    color: '#ffffff',
  },
});

export default GradientTitle;
