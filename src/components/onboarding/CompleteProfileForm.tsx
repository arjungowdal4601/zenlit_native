import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '../icons';
import { LinearGradient } from 'expo-linear-gradient';

import ImageUploadDialog from '../ImageUploadDialog';
import GradientTitle from '../GradientTitle';
import { SOCIAL_PLATFORMS, extractUsername } from '../../constants/socialPlatforms';
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
    title: 'X (Twitter) Username',
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
      badgeStyle: styles.instagramBadge,
    },
    {
      key: 'twitter' as const,
      value: profile.twitter,
      setValue: profile.setTwitter,
      badgeStyle: styles.outlinedBadge,
    },
    {
      key: 'linkedin' as const,
      value: profile.linkedin,
      setValue: profile.setLinkedin,
      badgeStyle: { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor },
    },
  ];
  const activeSocialItem = socialItems.find((item) => item.key === activeSocial) ?? socialItems[0];
  const activeSocialLabels = SOCIAL_LINK_LABELS[activeSocialItem.key];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile basics"
            onPress={profile.handleBack}
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={22} color={theme.prism.colors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.stepIndicator}>Step 2 of 2</Text>
            <GradientTitle text="Complete your profile" style={styles.headerTitle} variant="prism" />
            <Text style={styles.headerHelper}>
              Add a photo, bio, and socials so nearby people recognize you. You can skip for now.
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerWrapper}>
          {profile.bannerImage ? (
            <Image source={{ uri: profile.bannerImage.uri }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerFallback]} />
          )}
          <Pressable style={styles.bannerOverlay} onPress={profile.openBannerMenu}>
            <View style={styles.overlayCircle}>
              <Feather name="camera" size={18} color={theme.prism.colors.text} />
            </View>
          </Pressable>
          <View style={styles.avatarWrapper}>
            <Pressable onPress={profile.openProfileMenu} style={styles.avatarButton}>
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
              <View style={[styles.socialBadge, item.badgeStyle]}>
                {SOCIAL_PLATFORMS[item.key].renderIcon({ size: 20, color: theme.prism.colors.text })}
              </View>
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

      <Modal
        transparent
        visible={!!activeSocial}
        animationType="fade"
        onRequestClose={() => setActiveSocial(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{activeSocialLabels.title}</Text>
            <TextInput
              value={activeSocialItem.value}
              onChangeText={(text) => activeSocialItem.setValue(extractUsername(text))}
              placeholder="username"
              placeholderTextColor={theme.prism.colors.mutedDeep}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>
              Will link to: {activeSocialLabels.helper}/{activeSocialItem.value || 'username'}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setActiveSocial(null)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setActiveSocial(null)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
      />
    </View>
  );
};
