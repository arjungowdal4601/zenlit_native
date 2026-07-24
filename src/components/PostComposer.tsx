import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from './icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { ImageUploadTarget, StoredImage } from '../types/stored-image';
import { usePendingUpload } from '../hooks/usePendingUpload';
import { theme } from '../styles/theme';
import ImageUploadDialog from './ImageUploadDialog';
import type { FeedPostAuthor } from './Post';

const AVATAR_SIZE = 48;
const LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * 3;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 5;
const POST_UPLOAD_TARGET = {
  bucket: 'post-images',
  prefix: 'post',
} as const satisfies ImageUploadTarget;

export type PostComposerSharePayload = {
  content: string;
  image?: StoredImage | null;
};

export type PostComposerProps = {
  author: FeedPostAuthor;
  onShare?: (payload: PostComposerSharePayload) => Promise<boolean> | boolean;
  onShareComplete?: () => void;
};

export const PostComposer: React.FC<PostComposerProps> = ({ author, onShare, onShareComplete }) => {
  const [value, setValue] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const attachedUpload = usePendingUpload();
  const attachedImage = attachedUpload.image;
  const [isSharing, setIsSharing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const avatarSource = useMemo(() => {
    const uri = author.avatar?.trim();
    if (uri) {
      return { uri };
    }

    return {
      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&color=ffffff&size=128`,
    };
  }, [author.avatar, author.name]);

  const handleShare = async () => {
    const trimmed = value.trim();

    if (!trimmed.length) {
      setValidationMessage('Please enter some content before sharing.');
      return;
    }

    if (isSharing) {
      return;
    }

    const releasePersistence = attachedUpload.beginPersistence();
    try {
      setIsSharing(true);
      const result = await onShare?.({
        content: trimmed,
        image: attachedImage,
      });

      if (result === false) {
        return;
      }

      attachedUpload.commit();
      if (mountedRef.current) {
        setValue('');
        setInputHeight(MIN_INPUT_HEIGHT);
        setValidationMessage(null);
        onShareComplete?.();
      }
    } finally {
      releasePersistence();
      if (mountedRef.current) setIsSharing(false);
    }
  };

  const handleAttachmentPress = () => {
    if (attachedImage || isSharing) {
      return;
    }
    setShowImageDialog(true);
  };

  const handleImageUploaded = async (image: StoredImage) => {
    await attachedUpload.replace(image);
    setShowImageDialog(false);
  };

  const handleRemoveImage = async () => {
    if (isSharing) return;
    await attachedUpload.discard();
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
            style={({ pressed }) => [
              styles.iconButton,
              attachedImage || isSharing ? styles.iconButtonDisabled : null,
              pressed && !attachedImage && !isSharing ? styles.iconPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Attach media"
            onPress={handleAttachmentPress}
            disabled={!!attachedImage || isSharing}
            accessibilityState={{ disabled: !!attachedImage || isSharing }}
          >
            <Feather
              name="paperclip"
              size={18}
              color={attachedImage || isSharing ? theme.colors.iconInactive : theme.colors.icon}
            />
          </Pressable>

          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            disabled={isSharing}
            style={({ pressed }) => [
              styles.shareButton,
              isSharing ? styles.shareDisabled : null,
              pressed && !isSharing ? styles.sharePressed : null,
            ]}
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

      <View style={styles.composerBody}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (validationMessage) {
              setValidationMessage(null);
            }
          }}
          placeholder={'Share your thoughts with the world!\nWhat\'s on your mind today?'}
          placeholderTextColor={theme.colors.muted}
          multiline
          editable={!isSharing}
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

        {validationMessage ? (
          <View
            style={styles.validationNotice}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Feather name="alert-circle" size={16} color={theme.prism.colors.warning} />
            <Text selectable style={styles.validationText}>{validationMessage}</Text>
          </View>
        ) : null}

        {attachedImage && (
          <View style={styles.attachedImageContainer}>
            <Image
              source={{ uri: attachedImage.publicUrl }}
              style={styles.attachedImage}
              resizeMode="contain"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
              disabled={isSharing}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              accessibilityState={{ disabled: isSharing }}
            >
              <Feather name="x" size={16} color="#ffffff" />
            </Pressable>
          </View>
        )}
      </View>

      <ImageUploadDialog
        visible={showImageDialog && !isSharing}
        onClose={() => setShowImageDialog(false)}
        onImageUploaded={handleImageUploaded}
        uploadTarget={POST_UPLOAD_TARGET}
        currentImage={attachedImage?.publicUrl}
        onRemove={handleRemoveImage}
        showRemoveOption={!!attachedImage}
        title="Attach Image"
        imageKind="attachment"
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
    backgroundColor: 'transparent',
  },
  iconPressed: {
    opacity: 0.6,
  },
  iconButtonDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
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
  shareDisabled: {
    opacity: 0.6,
  },
  shareLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  composerBody: {
    marginLeft: AVATAR_SIZE + theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.42)',
    backgroundColor: 'rgba(146, 64, 14, 0.2)',
  },
  validationText: {
    flex: 1,
    color: '#FDE68A',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    letterSpacing: 0.15,
    alignSelf: 'stretch',
    paddingRight: theme.spacing.sm,
  },
  attachedImageContainer: {
    position: 'relative',
    alignSelf: 'stretch',
    marginTop: theme.spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  attachedImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 4 / 3,
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
