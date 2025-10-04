import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { COLORS } from '../theme/colors';

type HeaderIconButtonProps = {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon: Icon,
  onPress,
  accessibilityLabel,
  style,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
    onPress={onPress}
    style={({ pressed }) => [styles.button, style, pressed ? styles.pressed : null]}
  >
    <Icon color={COLORS.icon} size={24} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default HeaderIconButton;
