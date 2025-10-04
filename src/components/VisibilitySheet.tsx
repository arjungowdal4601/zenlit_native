import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { SOCIAL_PLATFORM_IDS, SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { useVisibility } from '../contexts/VisibilityContext';

export type VisibilitySheetProps = {
  visible: boolean;
  onRequestClose: () => void;
};

export const VisibilitySheet: React.FC<VisibilitySheetProps> = ({ visible, onRequestClose }) => {
  const translateY = useRef(new Animated.Value(1)).current;
  const {
    isVisible,
    setIsVisible,
    radiusKm,
    setRadiusKm,
    selectedAccounts,
    toggleAccount,
    selectAll,
    deselectAll,
  } = useVisibility();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 1,
      duration: 260,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateY, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 420],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Visibility</Text>
            <Pressable style={styles.iconButton} onPress={onRequestClose}>
              <Feather name="x" size={22} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Visible to nearby users</Text>
                <Text style={styles.sectionSubtitle}>
                  Control whether your profile appears in radar results.
                </Text>
              </View>
              <Switch
                value={isVisible}
                onValueChange={setIsVisible}
                thumbColor={isVisible ? '#ffffff' : '#ffffff'}
                trackColor={{ false: 'rgba(71, 85, 105,0.7)', true: '#6366f1' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Radius (km)</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setRadiusKm(Math.max(1, radiusKm - 1))}
                >
                  <Feather name="minus" size={16} color="#ffffff" />
                </Pressable>
                <Text style={styles.stepperLabel}>{radiusKm}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setRadiusKm(Math.min(50, radiusKm + 1))}
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Social platforms</Text>
              <View style={styles.sectionActions}>
                <Pressable onPress={selectAll}>
                  <Text style={styles.actionText}>Select all</Text>
                </Pressable>
                <View style={styles.divider} />
                <Pressable onPress={deselectAll}>
                  <Text style={styles.actionText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            {SOCIAL_PLATFORM_IDS.map((platformId) => {
              const meta = SOCIAL_PLATFORMS[platformId];
              const isSelected = selectedAccounts.includes(platformId);
              return (
                <Pressable
                  key={platformId}
                  style={[styles.platformRow, isSelected ? styles.platformActive : null]}
                  onPress={() => toggleAccount(platformId)}
                >
                  <Text style={styles.platformLabel}>{meta.label}</Text>
                  <View style={[styles.checkbox, isSelected ? styles.checkboxActive : null]}>
                    {isSelected ? <Feather name="check" size={16} color="#ffffff" /> : null}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#020617',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  section: {
    marginTop: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    marginHorizontal: 10,
  },
  platformRow: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  platformLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
});

export default VisibilitySheet;

