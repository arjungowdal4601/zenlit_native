import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { FeedPost } from '../constants/feedData';

export type EditablePostProps = {
  author: FeedPost['author'];
  onSubmit?: (content: string) => void;
};

export const EditablePost: React.FC<EditablePostProps> = ({ author, onSubmit }) => {
  const [content, setContent] = useState('');
  const trimmedContent = useMemo(() => content.trim(), [content]);
  const isDisabled = trimmedContent.length === 0;

  const handleShare = () => {
    if (isDisabled) {
      return;
    }

    if (onSubmit) {
      onSubmit(trimmedContent);
    } else {
      console.log('Share post', trimmedContent);
    }

    setContent('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Attach media"
        >
          <Feather name="paperclip" size={18} color="#cbd5f5" />
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.shareButton,
            isDisabled ? styles.shareButtonDisabled : null,
            pressed && !isDisabled ? styles.shareButtonPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <Text style={styles.shareLabel}>Share</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                author.avatar?.trim().length
                  ? author.avatar.trim()
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&color=ffffff&size=128`,
            }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.contentArea}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{author.name}</Text>
            <Text style={styles.authorHandle}>@{author.username}</Text>
          </View>

          <TextInput
            nativeID="editable-post-input"
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Share your thoughts with the world! What's on your mind today?"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    marginRight: 12,
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareButtonDisabled: {
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  shareLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  contentArea: {
    flex: 1,
  },
  authorRow: {
    marginBottom: 12,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  authorHandle: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 13,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    padding: 0,
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default EditablePost;
