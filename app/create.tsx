import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppHeader } from '../src/components/AppHeader';
import Navigation from '../src/components/Navigation';
import { PostComposer, PostComposerSharePayload } from '../src/components/PostComposer';
import { theme } from '../src/styles/theme';
import { createPost, getCurrentUserProfile, uploadImage } from '../src/lib/database';
import { compressImage } from '../src/utils/imageCompression';

const REMOTE_PROTOCOL_REGEX = /^https?:\/\//i;

const inferExtension = (uri: string, defaultExt: string) => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return defaultExt;
};

const inferExtensionFromMime = (mime: string | null): string => {
  if (!mime) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
};

const base64ToUint8Array = (b64: string): Uint8Array => {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let bufferLength = b64.length * 0.75;
  const len = b64.length;

  if (b64[len - 1] === '=') bufferLength--;
  if (b64[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength | 0);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const encoded1 = base64Chars.indexOf(b64[i]);
    const encoded2 = base64Chars.indexOf(b64[i + 1]);
    const encoded3 = base64Chars.indexOf(b64[i + 2]);
    const encoded4 = base64Chars.indexOf(b64[i + 3]);

    const triplet = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 & 63) << 6) | (encoded4 & 63);

    if (b64[i + 2] === '=') {
      bytes[p++] = (triplet >> 16) & 0xff;
    } else if (b64[i + 3] === '=') {
      bytes[p++] = (triplet >> 16) & 0xff;
      bytes[p++] = (triplet >> 8) & 0xff;
    } else {
      bytes[p++] = (triplet >> 16) & 0xff;
      bytes[p++] = (triplet >> 8) & 0xff;
      bytes[p++] = triplet & 0xff;
    }
  }

  return bytes;
};

const resolveUploadPayload = async (
  uri: string,
): Promise<{ body: Uint8Array | ArrayBuffer | Blob; extension: string }> => {
  if (uri.startsWith('data:')) {
    const mimeMatch = uri.match(/^data:(.*?);base64,/);
    const extension = inferExtensionFromMime(mimeMatch?.[1] ?? null);
    const commaIndex = uri.indexOf(',');
    const base64Data = commaIndex !== -1 ? uri.slice(commaIndex + 1) : '';
    return {
      body: base64ToUint8Array(base64Data),
      extension,
    };
  }

  const extension = inferExtension(uri, 'jpg');
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Failed to read image data');
  }

  if (Platform.OS === 'web') {
    const blob = await response.blob();
    return { body: blob, extension };
  }

  const arrayBuffer = await response.arrayBuffer();
  return { body: arrayBuffer, extension };
};

const uploadPostImageIfNeeded = async (imageUri: string | null | undefined): Promise<string | undefined> => {
  if (!imageUri) {
    return undefined;
  }

  const trimmed = imageUri.trim();
  if (!trimmed.length) {
    return undefined;
  }

  const isRemote = REMOTE_PROTOCOL_REGEX.test(trimmed);
  const isLocal = trimmed.startsWith('file:') || trimmed.startsWith('data:') || trimmed.startsWith('blob:');

  if (isRemote && !isLocal) {
    return trimmed;
  }

  try {
    const compressed = await compressImage(trimmed);
    const fileName = `post-${Date.now()}.jpg`;
    const { url, error } = await uploadImage(compressed.uri, 'post-images', fileName);

    if (error || !url) {
      throw error ?? new Error('Upload failed');
    }

    return url;
  } catch (error) {
    console.error('Failed to upload post image:', error);
    return undefined;
  }
};

const CreateScreen: React.FC = () => {
  const router = useRouter();
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthor();
  }, []);

  const loadAuthor = async () => {
    const { profile, socialLinks } = await getCurrentUserProfile();

    if (profile) {
      setAuthor({
        name: profile.display_name,
        username: profile.user_name,
        avatar: socialLinks?.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random&color=fff&size=128`,
      });
    }

    setLoading(false);
  };

  const handleShare = useCallback(async ({ content, image }: PostComposerSharePayload) => {
    const trimmed = content.trim();
    if (!trimmed.length) {
      Alert.alert('Error', 'Please enter some content.');
      return false;
    }

    let uploadedImageUrl: string | undefined;

    if (image) {
      uploadedImageUrl = await uploadPostImageIfNeeded(image);
      if (!uploadedImageUrl) {
        Alert.alert('Upload Failed', 'We could not upload your image. Please try again.');
        return false;
      }
    }

    const { post, error } = await createPost(trimmed, uploadedImageUrl);

    if (error || !post) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Error creating post:', error);
      return false;
    }

    Alert.alert('Success', 'Post created successfully!', [
      {
        text: 'OK',
        onPress: () => router.push('/feed'),
      },
    ]);

    return true;
  }, [router]);

  if (loading || !author) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppHeader title="Create Post" />
        <Navigation activePath="/create" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <AppHeader title="Create Post" />

      <View style={styles.content}>
        <PostComposer author={author} onShare={handleShare} />
      </View>

      <Navigation activePath="/create" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
});

export default CreateScreen;
