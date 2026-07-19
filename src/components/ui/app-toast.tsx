import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '../icons';
import { theme } from '../../styles/theme';
import { useReducedMotionPreference } from './app-dialog';

export type AppToastTone = 'success' | 'info' | 'warning' | 'error';

export type ShowToastOptions = {
  message: string;
  tone?: AppToastTone;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastItem = Required<Pick<ShowToastOptions, 'message' | 'tone'>> &
  Pick<ShowToastOptions, 'actionLabel' | 'onAction'> & {
    id: number;
  };

type AppToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
  dismissToast: () => void;
};

const AppToastContext = createContext<AppToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const ENTER_DURATION = 180;
const EXIT_DURATION = 140;

const toneMeta: Record<
  AppToastTone,
  { color: string; icon: 'check-circle' | 'info' | 'alert-triangle' | 'alert-circle' }
> = {
  success: { color: theme.prism.colors.success, icon: 'check-circle' },
  info: { color: theme.prism.colors.accent, icon: 'info' },
  warning: { color: theme.prism.colors.warning, icon: 'alert-triangle' },
  error: { color: theme.prism.colors.danger, icon: 'alert-circle' },
};

export const AppToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);
  const activeIdRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const insets = useSafeAreaInsets();

  const clearDismissTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback(
    (expectedId?: number) => {
      if (expectedId != null && activeIdRef.current !== expectedId) return;

      clearDismissTimer();
      const closingId = activeIdRef.current;

      if (reducedMotion) {
        activeIdRef.current = null;
        setToast(null);
        return;
      }

      const animation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: EXIT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: EXIT_DURATION,
          useNativeDriver: true,
        }),
      ]);

      animation.start(({ finished }) => {
        if (finished && activeIdRef.current === closingId) {
          activeIdRef.current = null;
          setToast(null);
        }
      });
    },
    [clearDismissTimer, opacity, reducedMotion, translateY],
  );

  const dismissToast = useCallback(() => hideToast(), [hideToast]);

  const showToast = useCallback(
    ({
      message,
      tone = 'info',
      duration,
      actionLabel,
      onAction,
    }: ShowToastOptions) => {
      clearDismissTimer();
      const id = ++nextIdRef.current;
      activeIdRef.current = id;
      setToast({ id, message, tone, actionLabel, onAction });

      opacity.stopAnimation();
      translateY.stopAnimation();

      if (reducedMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
      } else {
        opacity.setValue(0);
        translateY.setValue(-12);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: ENTER_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: ENTER_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const resolvedDuration =
        duration ?? (tone === 'success' || tone === 'info' ? DEFAULT_DURATION : undefined);

      if (resolvedDuration != null && resolvedDuration > 0) {
        timeoutRef.current = setTimeout(() => hideToast(id), resolvedDuration);
      }
    },
    [clearDismissTimer, hideToast, opacity, reducedMotion, translateY],
  );

  useEffect(() => clearDismissTimer, [clearDismissTimer]);

  const contextValue = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  const meta = toast ? toneMeta[toast.tone] : null;

  return (
    <AppToastContext.Provider value={contextValue}>
      <View style={styles.providerRoot}>
        {children}
        <View
          pointerEvents="box-none"
          style={[styles.viewport, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}
        >
          {toast && meta ? (
            <Animated.View
              accessibilityLiveRegion={toast.tone === 'error' ? 'assertive' : 'polite'}
              accessibilityRole={toast.tone === 'error' ? 'alert' : undefined}
              accessibilityLabel={toast.message}
              style={[styles.toastFrame, { opacity, transform: [{ translateY }] }]}
            >
              <LinearGradient
                colors={theme.prism.gradients.surface}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toast}
              >
                <View style={[styles.toneBar, { backgroundColor: meta.color }]} />
                <View
                  style={[
                    styles.iconFrame,
                    { backgroundColor: `${meta.color}1F`, borderColor: `${meta.color}66` },
                  ]}
                >
                  <Feather name={meta.icon} size={18} color={meta.color} strokeWidth={2.2} />
                </View>
                <Text selectable style={styles.message}>
                  {toast.message}
                </Text>
                {toast.actionLabel ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={toast.actionLabel}
                    onPress={() => {
                      toast.onAction?.();
                      hideToast(toast.id);
                    }}
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  >
                    <Text style={[styles.actionLabel, { color: meta.color }]}>
                      {toast.actionLabel}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                  onPress={() => hideToast(toast.id)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                >
                  <Feather name="x" size={18} color={theme.prism.colors.textSoft} />
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </AppToastContext.Provider>
  );
};

export const useAppToast = () => {
  const context = React.use(AppToastContext);

  if (!context) {
    throw new Error('useAppToast must be used within an AppToastProvider.');
  }

  return context;
};

const styles = StyleSheet.create({
  providerRoot: {
    flex: 1,
  },
  viewport: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000,
  },
  toastFrame: {
    width: '100%',
    maxWidth: 520,
    borderRadius: theme.radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    overflow: 'hidden',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
  },
  toast: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    backgroundColor: 'rgba(8, 13, 16, 0.97)',
  },
  toneBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
  },
  iconFrame: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...theme.typography.body,
    flex: 1,
    color: theme.prism.colors.text,
    fontWeight: theme.typography.weight.medium,
  },
  action: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  actionLabel: {
    ...theme.typography.label,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.72,
  },
});

export default AppToastProvider;
