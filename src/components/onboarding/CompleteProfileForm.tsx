import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '../icons';
import { LinearGradient } from 'expo-linear-gradient';

import ImageUploadDialog from '../ImageUploadDialog';
import GradientTitle from '../GradientTitle';
import { SocialBrandBadge } from '../social-brand-badge';
import { SocialUsernameDialog } from '../social-username-dialog';
import { styles } from '../../styles/completeProfile.styles';
import { prismGradientColors, theme } from '../../styles/theme';
import type { useCompleteProfileOnboarding } from '../../hooks/useCompleteProfileOnboarding';

type CompleteProfileViewModel = ReturnType<typeof useCompleteProfileOnboarding>;
type SocialLinkKey = 'instagram' | 'twitter' | 'linkedin';

const SOCIAL_LINK_LABELS = {
  instagram: {
    label: 'Instagram',
    title: 'Instagram Username',
    helper: 'instagram.com',
  },
  twitter: {
    label: 'X',
    title: 'X Username',
    helper: 'x.com',
  },
  linkedin: {
    label: 'LinkedIn',
    title: 'LinkedIn Username',
    helper: 'linkedin.com/in',
  },
} as const;

export const CompleteProfileForm = ({ profile }: { profile: CompleteProfileViewModel }) => {
  const [activeSocial, setActiveSocial] = React.useState<SocialLinkKey | null>(null);
  const socialItems = [
    {
      key: 'instagram' as const,
      value: profile.instagram,
      setValue: profile.setInstagram,
    },
    {
      key: 'twitter' as const,
      value: profile.twitter,
      setValue: profile.setTwitter,
    },
    {
      key: 'linkedin' as const,
      value: profile.linkedin,
      setValue: profile.setLinkedin,
    },
  ];
  const activeSocialItem = socialItems.find((item) => item.key === activeSocial) ?? socialItems[0];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.stepIndicator}>Step 2 of 2</Text>
            <GradientTitle text="Complete your profile" style={styles.headerTitle} numberOfLines={2} variant="prism" />
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          {profile.bannerImage ? (
            <Image source={{ uri: profile.bannerImage.uri }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerFallback]} />
          )}
          <Pressable
            style={styles.bannerOverlay}
            onPress={profile.openBannerMenu}
            accessibilityRole="button"
            accessibilityLabel="Add banner photo"
          >
            <View style={styles.overlayCircle}>
              <Feather name="camera" size={18} color={theme.prism.colors.text} />
            </View>
          </Pressable>
          <View style={styles.avatarWrapper}>
            <Pressable
              onPress={profile.openProfileMenu}
              style={styles.avatarButton}
              accessibilityRole="button"
              accessibilityLabel="Add profile photo"
            >
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage.uri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Feather name="user" size={44} color={theme.prism.colors.mutedDeep} />
                </View>
              )}
              <View style={styles.avatarCamera}>
                <View style={styles.overlayCircle}>
                  <Feather name="camera" size={16} color={theme.prism.colors.text} />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Bio</Text>
          <TextInput
            value={profile.bio}
            onChangeText={(text) => profile.setBio(text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor={theme.prism.colors.mutedDeep}
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{profile.bio.length}/500</Text>
        </View>

        <View style={styles.socialSection}>
          <GradientTitle text="Social Links" style={styles.sectionTitle} variant="prism" />

          {socialItems.map((item) => (
            <View key={item.key} style={styles.socialCard}>
              <SocialBrandBadge platform={item.key} size={44} />
              <View style={styles.socialContent}>
                <Text style={styles.socialLabel}>{SOCIAL_LINK_LABELS[item.key].label}</Text>
                <Text style={styles.socialValue}>{item.value || 'No link added'}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${SOCIAL_LINK_LABELS[item.key].label} username`}
                style={styles.editButton}
                onPress={() => setActiveSocial(item.key)}
              >
                <Feather name="edit-3" size={16} color={theme.prism.colors.text} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          {profile.errorMessage ? <Text style={styles.errorText}>{profile.errorMessage}</Text> : null}
          <Pressable
            style={[styles.actionButton, styles.cancelButton, profile.isSaving ? styles.disabledButton : null]}
            onPress={profile.handleSkip}
            accessibilityRole="button"
            disabled={profile.isSaving}
          >
            <Text style={[styles.actionLabel, styles.cancelLabel]}>Skip optional details</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              styles.saveButton,
              profile.isSaving && { opacity: 0.5 },
            ]}
            onPress={profile.handleSave}
            disabled={profile.isSaving}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={prismGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {profile.isSaving ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator color={theme.prism.colors.text} size="small" />
                  <Text style={[styles.actionLabel, styles.savingLabel]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.actionLabel}>Finish</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      <SocialUsernameDialog
        visible={activeSocial !== null}
        platform={activeSocialItem.key}
        value={activeSocialItem.value}
        onSave={activeSocialItem.setValue}
        onRequestClose={() => setActiveSocial(null)}
      />

      <ImageUploadDialog
        visible={profile.showImageUploadDialog}
        onClose={() => profile.setShowImageUploadDialog(false)}
        onImageSelected={profile.handleImageSelected}
        title={profile.uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={
          profile.uploadType === 'avatar'
            ? profile.profileImage?.uri
            : profile.bannerImage?.uri
        }
        onRemove={profile.handleRemoveImage}
        showRemoveOption={true}
        imageKind={profile.uploadType === 'avatar' ? 'avatar' : 'banner'}
      />
    </SafeAreaView>
  );
};
