import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export type ProfilePostProps = {
  authorName: string;
  authorHandle: string;
  dateISO: string;
  text: string;
  image?: string | null;
  avatar: string;
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
}) => {
  const displayDate = useMemo(() => formatDate(dateISO), [dateISO]);
  const avatarSource = useMemo(
    () => ({ uri: avatar && avatar.trim().length ? avatar : FALLBACK_AVATAR }),
    [avatar],
  );

  const shouldShowImage = image && image.trim().length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
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
      <Text style={styles.body}>
        {text}
      </Text>
      {shouldShowImage ? (
        <Image
          source={{ uri: image as string }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  meta: {
    flex: 1,
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
});

export default ProfilePost;


