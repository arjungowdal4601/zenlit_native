import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ProfileCard from '../components/ProfileCard';
import { palette, space } from '../theme';

interface Profile {
  id: string;
  avatarUrl: string;
  name: string;
  handle: string;
  bio: string;
  links: {
    instagram?: string;
    linkedin?: string;
    x?: string;
  };
}

const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    name: 'Aarav Kumar',
    handle: '@user1',
    bio: 'Creative director & visual storyteller 🎨 Passionate about design...',
    links: {
      instagram: 'https://instagram.com/aarav',
      linkedin: 'https://linkedin.com/in/aarav',
      x: 'https://x.com/aarav',
    },
  },
  {
    id: '2',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    name: 'Diya Sharma',
    handle: '@diya',
    bio: 'Software engineer by day, adventure photographer by...',
    links: {
      instagram: 'https://instagram.com/diya',
      linkedin: 'https://linkedin.com/in/diya',
      x: 'https://x.com/diya',
    },
  },
  {
    id: '3',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    name: 'Vikram Rao',
    handle: '@vikram',
    bio: 'Entrepreneur building the future of edtech 🚀 Former consultant...',
    links: {
      instagram: 'https://instagram.com/vikram',
      linkedin: 'https://linkedin.com/in/vikram',
      x: 'https://x.com/vikram',
    },
  },
  {
    id: '4',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    name: 'Ananya Iyer',
    handle: '@ananya',
    bio: 'Classical dancer & movement coach 💃 Teaching Bharatanatyam...',
    links: {
      instagram: 'https://instagram.com/ananya',
      linkedin: 'https://linkedin.com/in/ananya',
      x: 'https://x.com/ananya',
    },
  },
];

const RadarScreen: React.FC = () => {
  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleProfilePress = (profileId: string) => {
    console.log('Profile pressed:', profileId);
  };

  const handleMessagePress = (profileId: string) => {
    console.log('Message pressed:', profileId);
  };

  const handleSocialPress = (platform: string, url: string) => {
    console.log('Social pressed:', platform, url);
  };

  const handleTabPress = (tab: string) => {
    console.log('Tab pressed:', tab);
  };

  const renderProfile = ({ item }: { item: Profile }) => (
    <ProfileCard
      avatarUrl={item.avatarUrl}
      name={item.name}
      handle={item.handle}
      bio={item.bio}
      links={item.links}
      onProfilePress={() => handleProfilePress(item.id)}
      onMessagePress={() => handleMessagePress(item.id)}
      onSocialPress={handleSocialPress}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={palette.bg} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          title="Radar"
          onSearchPress={handleSearchPress}
          onMenuPress={handleMenuPress}
        />
      </SafeAreaView>

      <View style={styles.content}>
        <FlatList
          data={MOCK_PROFILES}
          renderItem={renderProfile}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Bottom navigation is handled by the global tab bar */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  safeArea: {
    backgroundColor: palette.bg,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: space.lg,
    paddingBottom: space.xl,
  },
  // no local bottom safe area — tab bar overlays the root
});

export default RadarScreen;
