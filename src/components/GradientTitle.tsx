import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { theme } from '../styles/theme';

type GradientTitleProps = {
  text: string;
  style?: TextProps['style'];
  numberOfLines?: number;
  ellipsizeMode?: TextProps['ellipsizeMode'];
  variant?: 'default' | 'prism';
};

export const GradientTitle: React.FC<GradientTitleProps> = ({
  text,
  style,
  numberOfLines = 1,
  ellipsizeMode = 'tail',
  variant = 'default',
}) => {
  const effectiveStyle = useMemo<TextStyle>(() => {
    const overrides = StyleSheet.flatten(style) as TextStyle | undefined;
    const flattened = StyleSheet.flatten([styles.text, style]) as TextStyle | undefined;
    const computed: TextStyle = { ...(flattened ?? {}) };
    const fallbackFontSize =
      typeof computed.fontSize === 'number' ? computed.fontSize : theme.header.title.fontSize;
    const hasCustomFontSize = overrides?.fontSize != null;
    const hasCustomLineHeight = overrides?.lineHeight != null;
    if (!hasCustomLineHeight && typeof fallbackFontSize === 'number') {
      computed.lineHeight = hasCustomFontSize
        ? Math.round(fallbackFontSize * 1.1)
        : theme.header.title.lineHeight;
    }
    return computed;
  }, [style]);

  const webGradientStyle: any = {
    backgroundImage:
      variant === 'prism'
        ? `linear-gradient(90deg, ${theme.prism.gradients.brand.join(', ')})`
        : 'linear-gradient(90deg, #2563eb, #7e22ce)',
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
      style={[effectiveStyle, webGradientStyle]}
    >
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: theme.header.title.fontFamily,
    fontSize: theme.header.title.fontSize,
    fontWeight: theme.header.title.fontWeight,
    letterSpacing: theme.header.title.letterSpacing,
    lineHeight: theme.header.title.lineHeight,
  },
});

export default GradientTitle;
