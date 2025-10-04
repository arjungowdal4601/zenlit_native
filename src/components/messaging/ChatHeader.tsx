import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AVATAR_SIZE = 40;

export type ChatHeaderProps = {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  isAnonymous?: boolean;
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, subtitle, avatarUrl, isAnonymous = false }) => {
  const router = useRouter();
  const initial = title?.trim().charAt(0)?.toUpperCase() ?? 'C';

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to messages"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>

        <View style={styles.profileRow}>
          <View style={styles.avatarFrame}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                {isAnonymous ? (
                  <Feather name="eye" size={20} color="#cbd5f5" />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
            )}
          </View>

          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.trailingSpace} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  trailingSpace: {
    width: 44,
  },
});

export default ChatHeader;
