import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

export type AppDialogTone = 'default' | 'danger' | 'success' | 'info';

export type AppDialogProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: AppDialogTone;
  dismissOnBackdrop?: boolean;
  maxWidth?: number;
  accessibilityLabel?: string;
};

const ENTER_DURATION = 180;
const EXIT_DURATION = 140;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const toneColors: Record<AppDialogTone, string> = {
  default: theme.prism.colors.accent,
  danger: theme.prism.colors.danger,
  success: theme.prism.colors.success,
  info: theme.prism.colors.primary,
};

export const useReducedMotionPreference = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
};

export const AppDialog: React.FC<AppDialogProps> = ({
  visible,
  onRequestClose,
  title,
  description,
  children,
  icon,
  tone = 'default',
  dismissOnBackdrop = true,
  maxWidth = 420,
  accessibilityLabel,
}) => {
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  const reducedMotion = useReducedMotionPreference();
  const { width } = useWindowDimensions();
  const accentColor = toneColors[tone];
  const surfaceWidth = useMemo(
    () => Math.min(maxWidth, Math.max(0, width - theme.spacing.xl * 2)),
    [maxWidth, width],
  );

  useEffect(() => {
    if (visible && !rendered) {
      setRendered(true);
      return;
    }

    if (!rendered) return;

    if (reducedMotion) {
      opacity.setValue(visible ? 1 : 0);
      scale.setValue(1);
      if (!visible) setRendered(false);
      return;
    }

    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.97);
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? ENTER_DURATION : EXIT_DURATION,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scale, {
        toValue: visible ? 1 : 0.97,
        duration: visible ? ENTER_DURATION : EXIT_DURATION,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });

    return () => animation.stop();
  }, [opacity, reducedMotion, rendered, scale, visible]);

  if (!rendered) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={rendered}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdrop ? onRequestClose : undefined}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="app-dialog-backdrop"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title ?? description}
          onAccessibilityEscape={onRequestClose}
          role="dialog"
          style={[
            styles.surfaceFrame,
            { width: surfaceWidth, opacity, transform: [{ scale }] },
          ]}
        >
          <LinearGradient
            colors={theme.prism.gradients.surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.surface}
          >
            <View style={[styles.accent, { backgroundColor: accentColor }]} />

            {icon ? (
              <View
                style={[
                  styles.iconFrame,
                  {
                    backgroundColor: `${accentColor}1F`,
                    borderColor: `${accentColor}66`,
                  },
                ]}
              >
                {icon}
              </View>
            ) : null}

            {title ? <Text style={styles.title}>{title}</Text> : null}
            {description ? (
              <Text selectable style={styles.description}>
                {description}
              </Text>
            ) : null}
            {children ? (
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.content}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>
            ) : null}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 12, 0.82)',
  },
  surfaceFrame: {
    maxWidth: '100%',
    maxHeight: '92%',
    borderRadius: theme.radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.prism.colors.borderStrong,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
  },
  surface: {
    flexShrink: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 28,
    paddingBottom: theme.spacing.xl,
    backgroundColor: 'rgba(8, 13, 16, 0.97)',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.prism.colors.text,
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.body,
    color: theme.prism.colors.textSoft,
    textAlign: 'center',
    maxWidth: 340,
  },
  contentScroll: {
    alignSelf: 'stretch',
  },
  content: {
    paddingTop: theme.spacing.sm,
  },
});

export default AppDialog;
