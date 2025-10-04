import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENT_COLORS, GRADIENT_END, GRADIENT_START } from '../theme/colors';

type GradientTextProps = {
  children: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  gradientStyle?: StyleProp<ViewStyle>;
};

const GradientText: React.FC<GradientTextProps> = ({
  children,
  textStyle,
  containerStyle,
  gradientStyle,
}) => {
  // Web fallback: use CSS background-clip to render gradient text
  if (Platform.OS === 'web') {
    const webGradientStyle: any = {
      // Left-to-right gradient to match app visuals
      backgroundImage: `linear-gradient(90deg, ${GRADIENT_COLORS.join(', ')})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      display: 'inline-block',
    };

    return (
      <Text style={[styles.textBase, textStyle, webGradientStyle]}>{children}</Text>
    );
  }

  // Native (iOS/Android): use MaskedView + LinearGradient
  return (
    <MaskedView
      style={containerStyle}
      maskElement={<Text style={[styles.textBase, textStyle]}>{children}</Text>}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={[styles.gradientFill, gradientStyle]}
      >
        <Text style={[styles.textBase, styles.hiddenFillText, textStyle]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  textBase: {
    fontWeight: '500',
    letterSpacing: -1,
    color: COLORS.icon,
  },
  gradientFill: {
    paddingHorizontal: 8,
  },
  hiddenFillText: {
    opacity: 0,
  },
});

export default GradientText;
