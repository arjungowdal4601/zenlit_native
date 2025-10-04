import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { COLORS } from '../theme/colors';

type SocialType = 'instagram' | 'linkedin' | 'x';

type SocialLink = {
  type: SocialType;
  url: string;
};

type SocialCardProps = {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  socials: SocialLink[];
  profileUrl?: string;
};

type SocialProfile = SocialCardProps & {
  id: string;
};

const INSTAGRAM_GRADIENT = ['#F58529', '#DD2A7B', '#8134AF'] as const;
const CARD_GLOW_GRADIENT = ['rgba(59,130,246,0.24)', 'rgba(17,24,39,0.05)', 'rgba(2,6,23,0.6)'] as const;
const SCREEN_GRADIENT = ['#050608', '#000000'] as const;
const LINKEDIN_COLOR = '#0A66C2';
const X_COLOR = '#000000';

const PRIMARY_FONT_FAMILY =
  Platform.select({
    ios: 'Inter',
    android: 'Inter',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: 'System',
  }) ?? 'System';

const SAMPLE_PROFILES: SocialProfile[] = [
  {
    id: 'aarav-kumar',
    name: 'Aarav Kumar',
    username: '@user1',
    bio: 'Creative director & visual storyteller. 🎨 Passionate about design.',
    avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=240&q=80',
    profileUrl: 'https://example.com/aarav-kumar',
    socials: [
      { type: 'instagram', url: 'https://instagram.com/user1' },
      { type: 'linkedin', url: 'https://linkedin.com/in/user1' },
      { type: 'x', url: 'https://x.com/user1' },
    ],
  },
  {
    id: 'maya-lopez',
    name: 'Maya Lopez',
    username: '@maya.lopez',
    bio: 'Product marketer connecting ideas to people. 🚀 Coffee enthusiast.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
    profileUrl: 'https://example.com/maya-lopez',
    socials: [
      { type: 'instagram', url: 'https://instagram.com/maya.lopez' },
      { type: 'linkedin', url: 'https://linkedin.com/in/mayalopez' },
      { type: 'x', url: 'https://x.com/mayalopez' },
    ],
  },
  {
    id: 'jordan-smith',
    name: 'Jordan Smith',
    username: '@jordans',
    bio: 'Full-stack developer exploring AI + mobile. 🤖 Open-source advocate.',
    avatar: 'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=240&q=80',
    profileUrl: 'https://example.com/jordan-smith',
    socials: [
      { type: 'instagram', url: 'https://instagram.com/jordans' },
      { type: 'linkedin', url: 'https://linkedin.com/in/jordans' },
      { type: 'x', url: 'https://x.com/jordans' },
    ],
  },
];

const SocialCardComponent: React.FC<SocialCardProps> = ({
  name,
  username,
  bio,
  avatar,
  socials,
  profileUrl,
}) => {
  const viewProfileUrl = profileUrl ?? socials[0]?.url;

  const handleOpenUrl = useCallback((url?: string) => {
    if (!url) {
      Alert.alert('Link unavailable', 'This profile has not added that link yet.');
      return;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Please try again later.');
    });
  }, []);

  const handleViewProfile = useCallback(() => {
    handleOpenUrl(viewProfileUrl);
  }, [handleOpenUrl, viewProfileUrl]);

  const handleMessage = useCallback(() => {
    Alert.alert('Message', `Start a new conversation with ${name}.`);
  }, [name]);

  return (
    <LinearGradient colors={CARD_GLOW_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGlow}>
      <View style={styles.cardSurface}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.cardBody}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.bioText} numberOfLines={2} ellipsizeMode="tail">
            {bio}
          </Text>
          <View style={styles.bottomRow}>
            <View style={styles.socialRow}>
              {socials.map((social, index) => (
                <TouchableOpacity
                  key={`${social.type}-${index}`}
                  activeOpacity={0.85}
                  style={[styles.socialTouch, index === socials.length - 1 && styles.noMarginRight]}
                  onPress={() => handleOpenUrl(social.url)}
                >
                  {social.type === 'instagram' ? (
                    <LinearGradient colors={INSTAGRAM_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.socialBadge}>
                      <FontAwesome5 name="instagram" size={18} color="#ffffff" />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.socialBadge,
                        social.type === 'linkedin' ? styles.linkedinBadge : styles.xBadge,
                      ]}
                    >
                      {social.type === 'linkedin' ? (
                        <FontAwesome5 name="linkedin-in" size={18} color="#ffffff" />
                      ) : (
                        <Svg width={18} height={18} viewBox="0 0 24 24">
                          <Path
                            d="M16.96 3H20l-6.96 8.2L20.56 21h-3.18l-4.95-6.63L6.43 21H3.2l7.78-9.17L3 3h3.22l4.53 6.08L16.96 3Z"
                            fill="#FFFFFF"
                          />
                        </Svg>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleViewProfile}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialCommunityIcons name="account-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={handleMessage}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonSpacing,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="chat-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const SocialCard = React.memo(SocialCardComponent);

const SocialProfilesScreen: React.FC = () => {
  return (
    <LinearGradient colors={SCREEN_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          {SAMPLE_PROFILES.map((profile) => (
            <SocialCard key={profile.id} {...profile} />
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  scrollContent: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardGlow: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    padding: 1,
    marginBottom: 20,
    backgroundColor: 'rgba(15,23,42,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(59,130,246,0.3)',
        shadowOpacity: 1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      },
      android: {
        shadowColor: '#000000',
        elevation: 12,
      },
      web: {
        boxShadow: '0 12px 40px rgba(37,99,235,0.25)',
      },
    }),
  },
  cardSurface: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(8,10,14,0.95)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 18,
    backgroundColor: '#1F2937',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardBody: {
    flex: 1,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: PRIMARY_FONT_FAMILY,
    letterSpacing: -0.3,
  },
  usernameText: {
    marginTop: 3,
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: PRIMARY_FONT_FAMILY,
  },
  bioText: {
    marginTop: 10,
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: PRIMARY_FONT_FAMILY,
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialTouch: {
    marginRight: 12,
  },
  noMarginRight: {
    marginRight: 0,
  },
  socialBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  linkedinBadge: {
    backgroundColor: LINKEDIN_COLOR,
  },
  xBadge: {
    backgroundColor: X_COLOR,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionButtonSpacing: {
    marginLeft: 12,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default SocialProfilesScreen;
