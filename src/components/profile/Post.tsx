import React, { useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ProfilePostProps = {
  authorName: string;
  authorHandle: string;
  dateISO: string;
  text: string;
  image?: string | null;
  avatar: string;
  showMenu?: boolean;
  onDelete?: () => void;
};

const FALLBACK_AVATAR =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ProfilePost: React.FC<ProfilePostProps> = ({
  authorName,
  authorHandle,
  dateISO,
  text,
  image,
  avatar,
  showMenu = false,
  onDelete,
}) => {
  const displayDate = useMemo(() => formatDate(dateISO), [dateISO]);
  const avatarSource = useMemo(
    () => ({ uri: avatar && avatar.trim().length ? avatar : FALLBACK_AVATAR }),
    [avatar],
  );

  const shouldShowImage = image && image.trim().length > 0;

  const confirmDelete = () => {
    Alert.alert('Delete post?', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(),
      },
    ]);
  };

  const handleMenuPress = () => {
    if (!showMenu) {
      return;
    }

    Alert.alert('Post options', undefined, [
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.authorRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.meta}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              <Text style={styles.authorMeta} numberOfLines={1}>
                @{authorHandle} • {displayDate}
              </Text>
            </View>
          </View>

          {showMenu ? (
            <Pressable
              onPress={handleMenuPress}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="Post actions"
            >
              <Feather name="more-vertical" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.body}>{text}</Text>

        {shouldShowImage ? (
          <Image source={{ uri: image as string }} style={styles.postImage} resizeMode="cover" />
        ) : null}
      </View>

      <View style={styles.dividerWrapper}>
        <View style={styles.divider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  authorMeta: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 13,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    backgroundColor: '#0f172a',
  },
  dividerWrapper: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.6)',
  },
});

export default ProfilePost;

