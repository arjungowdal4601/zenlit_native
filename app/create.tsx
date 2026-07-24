import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppHeader } from '../src/components/AppHeader';
import { PostComposer, PostComposerSharePayload } from '../src/components/PostComposer';
import { useAppToast } from '../src/components/ui/app-toast';
import { theme } from '../src/styles/theme';
import { createPost } from '../src/services/postService';
import { getCurrentUserProfile } from '../src/services/profileService';

const CreateScreen: React.FC = () => {
  const router = useRouter();
  const { showToast } = useAppToast();
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAuthor = async () => {
      try {
        const { profile, socialLinks } = await getCurrentUserProfile();
        if (!cancelled && profile) {
          setAuthor({
            name: profile.display_name,
            username: profile.user_name,
            avatar: socialLinks?.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random&color=fff&size=128`,
          });
        }
      } catch (error) {
        console.error('Unable to load the post author:', error);
        if (!cancelled) {
          showToast({ message: 'Unable to load your profile. Please try again.', tone: 'error' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAuthor();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleShare = useCallback(async ({ content, image }: PostComposerSharePayload) => {
    const trimmed = content.trim();
    if (!trimmed.length) {
      showToast({ message: 'Please enter some content.', tone: 'warning' });
      return false;
    }

    const { post, error } = await createPost(trimmed, image?.publicUrl);

    if (error || !post) {
      showToast({ message: 'Failed to create post. Please try again.', tone: 'error' });
      console.error('Error creating post:', error);
      return false;
    }

    return true;
  }, [showToast]);

  const handleShareComplete = useCallback(() => {
    showToast({ message: 'Post created successfully.', tone: 'success' });
    router.replace('/feed');
  }, [router, showToast]);

  if (loading || !author) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppHeader title="Create Post" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <AppHeader title="Create Post" />

      <View style={styles.content}>
        <PostComposer
          author={author}
          onShare={handleShare}
          onShareComplete={handleShareComplete}
        />
      </View>

      {/* Navigation is now rendered in the root layout */}
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


