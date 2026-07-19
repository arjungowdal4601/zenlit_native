import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { useReducedMotionPreference } from './app-dialog';

export type AppBottomSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  dismissOnBackdrop?: boolean;
};

const ENTER_DURATION = 220;
const EXIT_DURATION = 170;

export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  visible,
  onRequestClose,
  title,
  children,
  accessibilityLabel,
  dismissOnBackdrop = true,
}) => {
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  const reducedMotion = useReducedMotionPreference();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetWidth = useMemo(() => Math.min(620, width), [width]);

  useEffect(() => {
    if (visible && !rendered) {
      setRendered(true);
      return;
    }

    if (!rendered) return;

    if (reducedMotion) {
      opacity.setValue(visible ? 1 : 0);
      translateY.setValue(0);
      if (!visible) setRendered(false);
      return;
    }

    if (visible) {
      opacity.setValue(0);
      translateY.setValue(32);
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? ENTER_DURATION : EXIT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 32,
        duration: visible ? ENTER_DURATION : EXIT_DURATION,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });

    return () => animation.stop();
  }, [opacity, reducedMotion, rendered, translateY, visible]);

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
            testID="app-bottom-sheet-backdrop"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
          role="dialog"
          style={[
            styles.frame,
            {
              width: sheetWidth,
              opacity,
              maxHeight: Math.max(280, height * 0.92),
              transform: [{ translateY }],
            },
          ]}
        >
          <LinearGradient
            colors={theme.prism.gradients.surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}
          >
            <View style={styles.handle} accessibilityElementsHidden />
            {title ? <Text style={styles.title}>{title}</Text> : null}
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
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 12, 0.78)',
  },
  frame: {
    maxWidth: '100%',
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.prism.colors.borderStrong,
    overflow: 'hidden',
    backgroundColor: theme.prism.colors.background,
    boxShadow: '0 -20px 64px rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    flexShrink: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(8, 13, 16, 0.98)',
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: theme.prism.colors.mutedDeep,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.prism.colors.text,
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  contentScroll: {
    flexShrink: 1,
  },
  content: {
    paddingTop: theme.spacing.lg,
  },
});

export default AppBottomSheet;
