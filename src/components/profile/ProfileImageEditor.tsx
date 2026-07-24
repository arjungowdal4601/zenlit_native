import { Feather } from '../icons';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, View } from 'react-native';

import { styles } from './editProfile.styles';

type ProfileImageEditorProps = {
  bannerImage: ImageSourcePropType | null;
  profileImage: string | null;
  onEditBanner: () => void;
  onEditProfile: () => void;
  disabled?: boolean;
};

export const ProfileImageEditor = ({
  bannerImage,
  profileImage,
  onEditBanner,
  onEditProfile,
  disabled = false,
}: ProfileImageEditorProps) => (
  <View style={styles.bannerWrapper}>
    {bannerImage ? (
      <Image source={bannerImage} style={styles.bannerImage} resizeMode="cover" />
    ) : (
      <View style={[styles.bannerImage, styles.bannerFallback]} />
    )}
    <Pressable
      style={styles.bannerOverlay}
      onPress={onEditBanner}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Edit banner photo"
      accessibilityState={{ disabled }}
    >
      <View style={styles.overlayCircle}>
        <Feather name="camera" size={18} color="#ffffff" />
      </View>
    </Pressable>
    <View style={styles.avatarWrapper}>
      <Pressable
        onPress={onEditProfile}
        disabled={disabled}
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel="Edit profile photo"
        accessibilityState={{ disabled }}
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Feather name="user" size={44} color="#64748b" />
          </View>
        )}
        <View style={styles.avatarCamera}>
          <View style={styles.overlayCircle}>
            <Feather name="camera" size={16} color="#ffffff" />
          </View>
        </View>
      </Pressable>
    </View>
  </View>
);
