import React, { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { SocialLinks } from '../../constants/socialPlatforms';
import {
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  getTwitterHandle,
} from '../../constants/socialPlatforms';

const INSTAGRAM_GRADIENT = [
  '#f09433',
  '#e6683c',
  '#dc2743',
  '#cc2366',
  '#bc1888',
] as const;

export type SocialLinksRowProps = {
  links?: SocialLinks;
};

const SocialLinksRow: React.FC<SocialLinksRowProps> = ({ links }) => {
  const entries = useMemo(() => {
    if (!links) {
      return [];
    }
    const instagram = ensureSocialUrl('instagram', links.instagram);
    const linkedin = ensureSocialUrl('linkedin', links.linkedin);
    const twitter = ensureSocialUrl('twitter', getTwitterHandle(links));

    return [
      instagram ? { id: 'instagram' as const, url: instagram } : null,
      linkedin ? { id: 'linkedin' as const, url: linkedin } : null,
      twitter ? { id: 'twitter' as const, url: twitter } : null,
    ].filter(Boolean) as Array<{ id: 'instagram' | 'linkedin' | 'twitter'; url: string }>;
  }, [links]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {entries.map(({ id, url }) => {
        const meta = SOCIAL_PLATFORMS[id];
        const icon = meta.renderIcon({ size: 18, color: '#ffffff' });
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={meta.label}
            style={styles.button}
            onPress={() => {
              // TODO: optionally integrate Linking when needed
              console.log('Open social link', id, url);
            }}
          >
            {id === 'instagram' ? (
              <LinearGradient colors={INSTAGRAM_GRADIENT} style={styles.badge}>
                {icon}
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.badge,
                  meta.style.backgroundColor ? { backgroundColor: meta.style.backgroundColor } : null,
                ]}
              >
                {icon}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SocialLinksRow;
