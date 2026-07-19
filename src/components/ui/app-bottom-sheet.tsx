import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '../icons';
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
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 32,
        duration: visible ? ENTER_DURATION : EXIT_DURATION,
        useNativeDriver: USE_NATIVE_DRIVER,
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
          onAccessibilityEscape={onRequestClose}
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
            <View style={styles.header}>
              <View style={styles.headerSide} accessibilityElementsHidden />
              {title ? (
                <Text numberOfLines={1} style={styles.title}>
                  {title}
                </Text>
              ) : (
                <View style={styles.titleSpacer} />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${accessibilityLabel ?? title ?? 'sheet'}`}
                accessibilityHint="Closes this panel"
                hitSlop={8}
                onPress={onRequestClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <Feather name="x" size={19} color={theme.prism.colors.textSoft} />
              </Pressable>
            </View>
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
    marginBottom: theme.spacing.xs,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerSide: {
    width: 44,
    height: 44,
  },
  title: {
    ...theme.typography.title,
    flex: 1,
    color: theme.prism.colors.text,
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  titleSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(8, 13, 16, 0.72)',
  },
  closeButtonPressed: {
    opacity: 0.72,
    borderColor: theme.prism.colors.borderStrong,
  },
  contentScroll: {
    flexShrink: 1,
  },
  content: {
    paddingTop: theme.spacing.lg,
  },
});

export default AppBottomSheet;
