import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const CLAMP_LENGTH = 160;

export type ProfileAboutProps = {
  bio?: string;
};

const ProfileAbout: React.FC<ProfileAboutProps> = ({ bio }) => {
  const [expanded, setExpanded] = useState(false);
  const content = bio && bio.trim().length ? bio.trim() : 'No bio available.';

  const shouldClamp = useMemo(() => content.length > CLAMP_LENGTH, [content]);
  const display = expanded || !shouldClamp ? content : `${content.slice(0, CLAMP_LENGTH)}…`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.body}>{display}</Text>
      {!expanded && shouldClamp ? (
        <Pressable onPress={() => setExpanded(true)}>
          <Text style={styles.more}>more</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  more: {
    marginTop: 6,
    color: '#60a5fa',
    fontSize: 13,
  },
});

export default ProfileAbout;
