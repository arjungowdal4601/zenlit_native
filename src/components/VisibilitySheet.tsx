import React from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from './icons';
import { SocialBrandBadge } from './social-brand-badge';
import { AppBottomSheet } from './ui/app-bottom-sheet';

import { SOCIAL_PLATFORM_IDS, SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { useVisibility } from '../contexts/VisibilityContext';
import { theme } from '../styles/theme';

export type VisibilitySheetProps = {
  visible: boolean;
  onRequestClose: () => void;
};

export const VisibilitySheet: React.FC<VisibilitySheetProps> = ({ visible, onRequestClose }) => {
  const {
    isVisible,
    setIsVisible,
    selectedAccounts,
    toggleAccount,
    selectAll,
    deselectAll,
  } = useVisibility();

  return (
    <AppBottomSheet
      visible={visible}
      onRequestClose={onRequestClose}
      title="Visibility"
      accessibilityLabel="Visibility settings"
    >
      <View style={styles.content}>
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
                accessibilityLabel="Visible to nearby users"
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
                  accessibilityRole="checkbox"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.platformLeft}>
                    <SocialBrandBadge platform={platformId} size={32} />
                    <Text style={styles.platformLabel}>{meta.label}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected ? styles.checkboxActive : null]}>
                    {isSelected ? <Feather name="check" size={16} color="#ffffff" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
      </View>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    paddingRight: 16,
  },
  sectionTitle: {
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    paddingTop: 4,
    color: theme.prism.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTextSelectAll: {
    color: theme.prism.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  actionTextClear: {
    color: '#FCA5A5',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(8, 13, 16, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.13)',
    borderColor: theme.prism.colors.borderStrong,
  },
  platformLabel: {
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.prism.colors.success,
    borderColor: theme.prism.colors.success,
  },
});

export default VisibilitySheet;

