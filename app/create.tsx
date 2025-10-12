import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppHeader } from '../src/components/AppHeader';
import Navigation from '../src/components/Navigation';
import { PostComposer } from '../src/components/PostComposer';
import { theme } from '../src/styles/theme';
import { createPost, getCurrentUserProfile } from '../src/lib/database';

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

  const handleShare = useCallback(async (content: string) => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    const { post, error } = await createPost(content.trim());

    if (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Error creating post:', error);
      return;
    }

    Alert.alert('Success', 'Post created successfully!', [
      {
        text: 'OK',
        onPress: () => router.push('/feed'),
      },
    ]);
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
