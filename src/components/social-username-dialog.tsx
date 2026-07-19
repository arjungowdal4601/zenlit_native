import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { extractUsername } from '../constants/socialPlatforms';
import { prismGradientColors, theme } from '../styles/theme';
import { AppBottomSheet } from './ui/app-bottom-sheet';

export type SocialUsernamePlatform = 'instagram' | 'twitter' | 'linkedin';

const PLATFORM_COPY: Record<
  SocialUsernamePlatform,
  { label: string; title: string; urlPrefix: string }
> = {
  instagram: {
    label: 'Instagram',
    title: 'Instagram Username',
    urlPrefix: 'instagram.com/',
  },
  twitter: {
    label: 'X',
    title: 'X Username',
    urlPrefix: 'x.com/',
  },
  linkedin: {
    label: 'LinkedIn',
    title: 'LinkedIn Username',
    urlPrefix: 'linkedin.com/in/',
  },
};

export type SocialUsernameDialogProps = {
  visible: boolean;
  platform: SocialUsernamePlatform;
  value: string;
  onSave: (value: string) => void;
  onRequestClose: () => void;
};

export const SocialUsernameDialog = ({
  visible,
  platform,
  value,
  onSave,
  onRequestClose,
}: SocialUsernameDialogProps) => {
  const [draft, setDraft] = useState(value);
  const copy = PLATFORM_COPY[platform];

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [platform, value, visible]);

  const handleSave = () => {
    onSave(draft);
    onRequestClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onRequestClose={onRequestClose}
      title={copy.title}
      accessibilityLabel={`${copy.label} username editor`}
    >
      <View style={styles.content}>
        <TextInput
          value={draft}
          onChangeText={(text) => setDraft(extractUsername(text))}
          placeholder="username"
          placeholderTextColor={theme.prism.colors.mutedDeep}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`${copy.label} username`}
        />
        <Text style={styles.helper} selectable>
          Will link to: {copy.urlPrefix}
          {draft || 'username'}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            onPress={onRequestClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel username changes"
          >
            <Text style={styles.buttonLabel}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={`Save ${copy.label} username`}
          >
            <LinearGradient
              colors={prismGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              <Text style={styles.buttonLabel}>Save</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(8, 13, 16, 0.82)',
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helper: {
    color: theme.prism.colors.muted,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.prism.colors.borderStrong,
    backgroundColor: theme.prism.colors.cardDeep,
  },
  saveGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.76,
  },
});

export default SocialUsernameDialog;
