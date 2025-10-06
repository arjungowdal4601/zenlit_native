import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { FeedPost } from '../constants/feedData';
import { theme } from '../styles/theme';

const AVATAR_SIZE = 48;
const LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * 3;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 5;

export type PostComposerProps = {
  author: FeedPost['author'];
  onShare?: (content: string) => void;
};

export const PostComposer: React.FC<PostComposerProps> = ({ author, onShare }) => {
  const [value, setValue] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);

  const avatarSource = useMemo(() => {
    const uri = author.avatar?.trim();
    if (uri) {
      return { uri };
    }

    return {
      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&color=ffffff&size=128`,
    };
  }, [author.avatar, author.name]);

  const handleShare = () => {
    onShare?.(value.trim());
    setValue('');
    setInputHeight(MIN_INPUT_HEIGHT);
  };

  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.profileBlock}>
          <Image source={avatarSource} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{author.name}</Text>
            <Text style={styles.handle}>@{author.username}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
            accessibilityRole="button"
            accessibilityLabel="Attach media"
          >
            <Feather name="paperclip" size={18} color={theme.colors.icon} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            style={({ pressed }) => [styles.shareButton, pressed && styles.sharePressed]}
          >
            <LinearGradient
              colors={[theme.gradients.header.from, theme.gradients.header.to]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shareGradient}
            >
              <Text style={styles.shareLabel}>Share</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={'Share your thoughts with the world!\nWhat\'s on your mind today?'}
        placeholderTextColor={theme.colors.muted}
        multiline
        textAlignVertical="top"
        style={[styles.input, { height: inputHeight }]}
        onContentSizeChange={(event) => {
          const nextHeight = Math.min(
            MAX_INPUT_HEIGHT,
            Math.max(MIN_INPUT_HEIGHT, event.nativeEvent.contentSize.height),
          );
          if (nextHeight !== inputHeight) {
            setInputHeight(nextHeight);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 6,
    backgroundColor: '#111827',
    marginRight: theme.spacing.sm,
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  handle: {
    color: theme.colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: {
    opacity: 0.6,
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePressed: {
    opacity: 0.85,
  },
  shareLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    alignSelf: 'stretch',
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    letterSpacing: 0.15,
    marginLeft: AVATAR_SIZE + theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
});

export default PostComposer;
