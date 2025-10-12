import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { useVisibility } from '../contexts/VisibilityContext';
import { getFeedPosts, PostWithAuthor } from '../lib/database';
import Post from './Post';

export const FeedList: React.FC = () => {
  const { selectedAccounts } = useVisibility();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    const { posts: fetchedPosts, error: fetchError } = await getFeedPosts();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPosts(fetchedPosts);
    }

    setLoading(false);
  };

  const convertPostToFeedFormat = (post: PostWithAuthor) => {
    const author = post.author;
    const socialLinks = author.social_links;

    return {
      id: post.id,
      author: {
        name: author.display_name,
        username: author.user_name,
        avatar: socialLinks?.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.display_name)}&background=random&color=fff&size=128`,
        socialLinks: {
          instagram: socialLinks?.instagram || undefined,
          twitter: socialLinks?.x_twitter || undefined,
          linkedin: socialLinks?.linkedin || undefined,
        },
      },
      content: post.content,
      image: post.image_url || undefined,
      timestamp: new Date(post.created_at).toLocaleDateString(),
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading feed</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Be the first to create a post!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Post post={convertPostToFeedFormat(item)} selectedAccounts={selectedAccounts} showTimestamp={false} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onRefresh={loadPosts}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingBottom: 160,
    paddingTop: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FeedList;
