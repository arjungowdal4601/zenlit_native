import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { palette, radius, space, shadow, icon, avatar, type } from '../theme';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  x?: string;
}

interface ProfileCardProps {
  avatarUrl: string;
  name: string;
  handle: string;
  bio: string;
  links: SocialLinks;
  onProfilePress?: () => void;
  onMessagePress?: () => void;
  onSocialPress?: (platform: string, url: string) => void;
}

const INSTAGRAM_GRADIENT = ['#F58529', '#DD2A7B', '#8134AF'] as const;

const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl,
  name,
  handle,
  bio,
  links,
  onProfilePress,
  onMessagePress,
  onSocialPress,
}) => {
  const handleSocialPress = (platform: string, url?: string) => {
    if (url && onSocialPress) {
      onSocialPress(platform, url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Avatar */}
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Name and Handle */}
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            {handle}
          </Text>
          
          {/* Bio */}
          <Text style={styles.bio} numberOfLines={2} ellipsizeMode="tail">
            {bio}
          </Text>
          
          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            {/* Social Icons */}
            <View style={styles.socialRow}>
              {links.instagram && (
                <Pressable
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('instagram', links.instagram)}
                >
                  <LinearGradient
                    colors={INSTAGRAM_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.socialIcon}
                  >
                    <FontAwesome5 name="instagram" size={icon.size} color="#ffffff" />
                  </LinearGradient>
                </Pressable>
              )}
              
              {links.linkedin && (
                <Pressable
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('linkedin', links.linkedin)}
                >
                  <View style={[styles.socialIcon, styles.linkedinIcon]}>
                    <FontAwesome5 name="linkedin-in" size={icon.size} color="#ffffff" />
                  </View>
                </Pressable>
              )}
              
              {links.x && (
                <Pressable
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('x', links.x)}
                >
                  <View style={[styles.socialIcon, styles.xIcon]}>
                    <Svg width={icon.size} height={icon.size} viewBox="0 0 24 24">
                      <Path
                        d="M16.96 3H20l-6.96 8.2L20.56 21h-3.18l-4.95-6.63L6.43 21H3.2l7.78-9.17L3 3h3.22l4.53 6.08L16.96 3Z"
                        fill="#FFFFFF"
                      />
                    </Svg>
                  </View>
                </Pressable>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionButton}
                onPress={onProfilePress}
              >
                <MaterialCommunityIcons 
                  name="account-outline" 
                  size={icon.size} 
                  color={palette.text} 
                />
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.actionButtonSpacing]}
                onPress={onMessagePress}
              >
                <MaterialCommunityIcons 
                  name="chat-outline" 
                  size={icon.size} 
                  color={palette.text} 
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    marginBottom: space.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: shadow.card.shadowOpacity,
        shadowRadius: shadow.card.shadowRadius,
        shadowOffset: shadow.card.shadowOffset,
      },
      android: {
        elevation: shadow.card.elevation,
      },
      web: {
        boxShadow: `0 ${shadow.card.shadowOffset.height}px ${shadow.card.shadowRadius}px rgba(0,0,0,${shadow.card.shadowOpacity})`,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    padding: space.md,
  },
  avatar: {
    width: avatar.size,
    height: avatar.size,
    borderRadius: avatar.size / 2,
    marginRight: space.md,
    backgroundColor: palette.border,
  },
  mainContent: {
    flex: 1,
  },
  name: {
    fontSize: type.title.size,
    fontWeight: type.title.weight,
    lineHeight: type.title.lineHeight,
    color: palette.text,
    marginBottom: space.xxs,
  },
  handle: {
    fontSize: type.handle.size,
    fontWeight: type.handle.weight,
    color: type.handle.color,
    marginBottom: space.xs,
  },
  bio: {
    fontSize: type.bio.size,
    fontWeight: type.bio.weight,
    color: type.bio.color,
    lineHeight: type.bio.size * 1.4,
    marginBottom: space.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialButton: {
    marginRight: space.xs,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinIcon: {
    backgroundColor: '#0A66C2',
  },
  xIcon: {
    backgroundColor: '#000000',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionButtonSpacing: {
    marginLeft: space.xs,
  },
});

export default ProfileCard;