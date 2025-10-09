import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { SOCIAL_PLATFORM_IDS, SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { useVisibility } from '../contexts/VisibilityContext';

const INSTAGRAM_GRADIENT = [
  '#f09433',
  '#e6683c',
  '#dc2743',
  '#cc2366',
  '#bc1888',
] as const;

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
            {/* Removed redundant close icon; backdrop tap and controls provide dismissal */}
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
                thumbColor="#ffffff"
                trackColor={{ false: 'rgba(71, 85, 105, 0.7)', true: '#3b82f6' }}
                ios_backgroundColor="rgba(71, 85, 105, 0.7)"
              />
            </View>
          </View>

          {/* Radius selection removed per request */}

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Social platforms</Text>
              <View style={styles.sectionActions}>
                <Pressable onPress={selectAll}>
                  <Text style={styles.actionTextSelectAll}>Select All</Text>
                </Pressable>
                <View style={styles.divider} />
                <Pressable onPress={deselectAll}>
                  <Text style={styles.actionTextClear}>Clear All</Text>
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
                  <View style={styles.platformLeft}>
                    {platformId === 'instagram' ? (
                      <LinearGradient
                        colors={INSTAGRAM_GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.platformIcon}
                      >
                        {meta.renderIcon({ size: 16, color: '#ffffff' })}
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.platformIcon,
                          meta.style.backgroundColor ? { backgroundColor: meta.style.backgroundColor } : null,
                        ]}
                      >
                        {meta.renderIcon({ size: 16, color: meta.wantsWhiteIcon ? '#ffffff' : '#94a3b8' })}
                      </View>
                    )}
                    <Text style={styles.platformLabel}>{meta.label}</Text>
                  </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
  actionTextSelectAll: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  actionTextClear: {
    color: '#ef4444',
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  platformActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(148, 163, 184, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
});

export default VisibilitySheet;

