import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { FeedPost } from '../constants/feedData';
import { theme } from '../styles/theme';
import AttachmentDialog from './AttachmentDialog';

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
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

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
    setAttachedImage(null);
  };

  const handleAttachmentPress = () => {
    if (attachedImage) {
      Alert.alert(
        'One Image Only',
        'You can only upload one image per post. Please remove the current image first to upload a different one.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowAttachmentDialog(true);
  };

  const handleImageSelected = (uri: string) => {
    setAttachedImage(uri);
    setShowAttachmentDialog(false);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
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
            onPress={handleAttachmentPress}
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

      {/* Attached Image Preview */}
      {attachedImage && (
        <View style={styles.attachedImageContainer}>
          <Image source={{ uri: attachedImage }} style={styles.attachedImage} resizeMode="cover" />
          <Pressable
            style={styles.removeImageButton}
            onPress={handleRemoveImage}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
          >
            <Feather name="x" size={16} color="#ffffff" />
          </Pressable>
        </View>
      )}

      {/* Attachment Dialog */}
      <AttachmentDialog
        visible={showAttachmentDialog}
        onClose={() => setShowAttachmentDialog(false)}
        onImageSelected={handleImageSelected}
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
  attachedImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    marginTop: theme.spacing.sm,
    marginLeft: AVATAR_SIZE + theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default PostComposer;
