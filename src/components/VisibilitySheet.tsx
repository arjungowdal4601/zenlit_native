import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { orderedSocialPlatforms } from '../constants/socialPlatforms';
import { useVisibility } from '../contexts/VisibilityContext';
import { animations } from '../styles/animations';
import { theme } from '../styles/theme';

type VisibilitySheetProps = {
  visible: boolean;
  onClose: () => void;
};

export const VisibilitySheet: React.FC<VisibilitySheetProps> = ({ visible, onClose }) => {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const { isVisible, toggleVisibility, selectedPlatforms, selectAll, deselectAll, togglePlatform } =
    useVisibility();

  useEffect(() => {
    Animated.timing(translateAnim, {
      toValue: visible ? 1 : 0,
      duration: animations.durations.sheet,
      useNativeDriver: true,
    }).start();
  }, [translateAnim, visible]);

  const translateY = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [340, 0],
  });

  return (
    <Modal
      animationType="none"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}> 
          <View style={styles.header}>
            <Text style={styles.title}>Visibility</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={theme.iconSizes.lg} color={theme.colors.icon} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.visibilityRow}>
              <View>
                <Text style={styles.sectionTitle}>Radar presence</Text>
                <Text style={styles.sectionSubtitle}>
                  Control whether your profile appears to nearby members.
                </Text>
              </View>
              <Switch
                value={isVisible}
                onValueChange={toggleVisibility}
                thumbColor={isVisible ? theme.colors.icon : '#FFFFFF'}
                trackColor={{ false: theme.colors.muted, true: theme.colors.accent }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Platforms</Text>
              <View style={styles.sectionActions}>
                <Pressable onPress={selectAll}>
                  <Text style={styles.actionText}>Select all</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable onPress={deselectAll}>
                  <Text style={styles.actionText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            {orderedSocialPlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);

              return (
                <Pressable
                  key={platform.id}
                  style={[styles.platformRow, isSelected ? styles.platformRowActive : null]}
                  onPress={() => togglePlatform(platform.id)}
                >
                  <Text style={styles.platformLabel}>{platform.label}</Text>
                  <View style={[styles.checkbox, isSelected ? styles.checkboxActive : null]}>
                    {isSelected ? (
                      <Feather name="check" size={16} color={theme.colors.icon} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: theme.colors.subtitle,
    fontSize: 13,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 4,
    borderRadius: theme.radii.md,
  },
  platformRowActive: {
    backgroundColor: theme.colors.muted,
  },
  platformLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
});
