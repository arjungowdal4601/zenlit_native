import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ImageUploadDialog from '../../../src/components/ImageUploadDialog';
import { SOCIAL_PLATFORMS, extractUsername } from '../../../src/constants/socialPlatforms';
import GradientTitle from '../../../src/components/GradientTitle';
import { isAuthReady } from '../../../src/services/authService';
import { type CompressedImage } from '../../../src/utils/imageCompression';
import { uploadProfileImage } from '../../../src/services/storageService';
import {
  getFriendlyOnboardingError,
  saveOptionalProfileDetails,
  skipOptionalProfileDetails,
} from '../../../src/services/onboardingService';
import { getRouteForOnboardingState } from '../../../src/utils/onboardingState';
import { theme } from '../../../src/styles/theme';

const FALLBACK_AVATAR = null;

const CompleteProfileScreen: React.FC = () => {
  const router = useRouter();
  const authReady = isAuthReady();

  // Local state (UI-only)
  const [bio, setBio] = useState('');
  const [bannerImage, setBannerImage] = useState<CompressedImage | null>(null);
  const [profileImage, setProfileImage] = useState<CompressedImage | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(FALLBACK_AVATAR);

  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);

  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('Profile updated successfully.');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'banner'>('avatar');

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimeout = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  const clearPendingImages = () => {
    setProfileImage(null);
    setBannerImage(null);
    setProfileImageUrl(null);
    setBannerImageUrl(null);
  };

  const handleBack = () => {
    clearPendingImages();
    router.replace('/onboarding/profile/basic');
  };

  // Track mounted state to prevent setState on unmounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSuccessTimeout();
    };
  }, []);

  const uploadImageIfNeeded = async (
    image: CompressedImage | null,
    filePrefix: 'avatar' | 'banner',
  ): Promise<string | undefined> => {
    try {
      if (!image) {
        return undefined;
      }

      const { url, error } = await uploadProfileImage(image, filePrefix);
      if (error || !url) {
        console.error('Upload error:', error);
        return undefined;
      }

      return url;
    } catch (err) {
      console.error('Failed to upload image:', err);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      // Upload images if needed
      const uploadedAvatarUrl = await uploadImageIfNeeded(profileImage, 'avatar');
      const uploadedBannerUrl = await uploadImageIfNeeded(bannerImage, 'banner');

      if (profileImage && !uploadedAvatarUrl) {
        throw new Error('Failed to upload the new profile picture. Please try again.');
      }

      if (bannerImage && !uploadedBannerUrl) {
        throw new Error('Failed to upload the new banner image. Please try again.');
      }

      const finalAvatarUrl = uploadedAvatarUrl ?? profileImageUrl ?? null;
      const finalBannerUrl = uploadedBannerUrl ?? bannerImageUrl ?? null;

      const { data: state, error } = await saveOptionalProfileDetails({
        bio: bio?.trim() || null,
        instagram: instagram?.trim() || null,
        x_twitter: twitter?.trim() || null,
        linkedin: linkedin?.trim() || null,
        profile_pic_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
      });

      if (error || !state) {
        throw error ?? new Error('Failed to save optional profile details');
      }

      if (uploadedAvatarUrl) {
        setProfileImage(null);
        setProfileImageUrl(uploadedAvatarUrl);
      }

      if (uploadedBannerUrl) {
        setBannerImage(null);
        setBannerImageUrl(uploadedBannerUrl);
      }

      // Success UI
      clearSuccessTimeout();
      if (mountedRef.current) {
        setSuccessMessage('Profile updated successfully.');
        setShowSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setShowSuccess(false);
            router.replace(getRouteForOnboardingState(state));
            successTimeoutRef.current = null;
          }
        }, 800);
      }
    } catch (error: any) {
      if (mountedRef.current) {
        setShowSuccess(false);
        setErrorMessage(getFriendlyOnboardingError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleSkip = async () => {
    if (isSaving) return;
    clearSuccessTimeout();
    setShowSuccess(false);
    setErrorMessage('');
    clearPendingImages();
    setIsSaving(true);

    try {
      const { data: state, error } = await skipOptionalProfileDetails();
      if (error || !state) {
        throw error ?? new Error('Failed to skip optional details');
      }

      if (mountedRef.current) {
        setSuccessMessage('Optional details skipped.');
        setShowSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setShowSuccess(false);
            router.replace(getRouteForOnboardingState(state));
            successTimeoutRef.current = null;
          }
        }, 500);
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(getFriendlyOnboardingError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const openBannerMenu = () => {
    setUploadType('banner');
    setShowImageUploadDialog(true);
  };
  
  const openProfileMenu = () => {
    setUploadType('avatar');
    setShowImageUploadDialog(true);
  };

  const handleImageSelected = (image: CompressedImage | null) => {
    if (uploadType === 'avatar') {
      setProfileImage(image);
      if (!image) {
        setProfileImageUrl(null);
      }
    } else {
      setBannerImage(image);
      if (!image) {
        setBannerImageUrl(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      clearSuccessTimeout();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile basics"
            onPress={handleBack}
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.stepIndicator}>Step 2 of 2</Text>
            <GradientTitle text="Complete your profile" style={styles.headerTitle} />
            <Text style={styles.headerHelper}>You can add these now or later.</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {showSuccess && (
        <View style={styles.successBar}>
          <Feather name="check" size={18} color="#ffffff" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner area */}
        <View style={styles.bannerWrapper}>
          {bannerImage ? (
            <Image source={{ uri: bannerImage.uri }} style={styles.bannerImage} resizeMode="cover" />
          ) : bannerImageUrl ? (
            <Image source={{ uri: bannerImageUrl }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerFallback]} />
          )}
          <Pressable style={styles.bannerOverlay} onPress={openBannerMenu}>
            <View style={styles.overlayCircle}>
              <Feather name="camera" size={18} color="#ffffff" />
            </View>
          </Pressable>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Pressable onPress={openProfileMenu} style={styles.avatarButton}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.avatar} />
              ) : profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
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

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor="#475569"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        {/* Social links */}
        <View style={styles.socialSection}>
          <GradientTitle text="Social Links" style={styles.sectionTitle} />

          {/* Instagram */}
          <View style={styles.socialCard}>
            {/* Instagram gradient badge */}
            <View style={[styles.socialBadge, styles.instagramBadge]}>
              {SOCIAL_PLATFORMS.instagram.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>Instagram</Text>
              <Text style={styles.socialValue}>{instagram ? instagram : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowInstagramModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>

          {/* Twitter/X */}
          <View style={styles.socialCard}>
            <View style={[styles.socialBadge, styles.outlinedBadge]}>
              {SOCIAL_PLATFORMS.twitter.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>X</Text>
              <Text style={styles.socialValue}>{twitter ? twitter : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowTwitterModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>

          {/* LinkedIn */}
          <View style={styles.socialCard}>
            <View style={[styles.socialBadge, { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor }] }>
              {SOCIAL_PLATFORMS.linkedin.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>LinkedIn</Text>
              <Text style={styles.socialValue}>{linkedin ? linkedin : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowLinkedinModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.footerActions}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Pressable
            style={[styles.actionButton, styles.cancelButton, isSaving ? styles.disabledButton : null]}
            onPress={handleSkip}
            accessibilityRole="button"
            disabled={isSaving}
          >
            <Text style={[styles.actionLabel, styles.cancelLabel]}>Skip optional details</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              styles.saveButton,
              (!authReady || isSaving) && { opacity: 0.5 },
            ]}
            onPress={handleSave}
            disabled={!authReady || isSaving}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#2563eb', '#7e22ce']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {isSaving ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={[styles.actionLabel, styles.savingLabel]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.actionLabel}>Finish</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

  {/* Instagram Modal */}
      <Modal transparent visible={showInstagramModal} animationType="fade" onRequestClose={() => setShowInstagramModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Instagram Username</Text>
            <TextInput
              value={instagram}
              onChangeText={(text) => setInstagram(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: instagram.com/{instagram || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowInstagramModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowInstagramModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Twitter Modal */}
      <Modal transparent visible={showTwitterModal} animationType="fade" onRequestClose={() => setShowTwitterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>X (Twitter) Username</Text>
            <TextInput
              value={twitter}
              onChangeText={(text) => setTwitter(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: x.com/{twitter || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowTwitterModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowTwitterModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* LinkedIn Modal */}
      <Modal transparent visible={showLinkedinModal} animationType="fade" onRequestClose={() => setShowLinkedinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LinkedIn Username</Text>
            <TextInput
              value={linkedin}
              onChangeText={(text) => setLinkedin(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: linkedin.com/in/{linkedin || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowLinkedinModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowLinkedinModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        visible={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        onImageSelected={handleImageSelected}
        title={uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={
          uploadType === 'avatar'
            ? profileImage?.uri ?? profileImageUrl
            : bannerImage?.uri ?? bannerImageUrl
        }
        onRemove={() => {
          if (uploadType === 'avatar') {
            setProfileImage(null);
            setProfileImageUrl(null);
          } else {
            setBannerImage(null);
            setBannerImageUrl(null);
          }
        }}
        showRemoveOption={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safeArea: { backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12,
  },
  headerButton: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: { ...theme.typography.title, fontSize: 24, lineHeight: 28, color: '#ffffff' },
  headerHelper: { marginTop: 4, color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  successBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10 },
  successText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  content: { paddingBottom: 120 },
  bannerWrapper: { position: 'relative', marginBottom: 60 },
  bannerImage: { width: '100%', height: 200, borderRadius: 0 },
  bannerFallback: { backgroundColor: '#1f2937' },
  bannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  avatarWrapper: { position: 'absolute', left: 20, bottom: -50 },
  avatarButton: { borderRadius: 8, borderWidth: 2, borderColor: '#000000', padding: 2, backgroundColor: '#000000' },
  avatar: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#111827' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  avatarCamera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  formSection: { paddingHorizontal: 20 },
  label: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { color: '#ffffff', backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  socialSection: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { ...theme.typography.label, color: '#ffffff', fontSize: 18, lineHeight: 22, fontWeight: '700', marginBottom: 12 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  socialCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)', borderRadius: 12, backgroundColor: '#000000', marginBottom: 12 },
  socialIconWrap: { display: 'none' },
  socialBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)', backgroundColor: '#000000' },
  instagramBadge: { backgroundColor: '#dc2743' },
  outlinedBadge: { backgroundColor: '#000000', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  socialContent: { flex: 1, minWidth: 0 },
  socialLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  socialValue: { color: '#94a3b8', fontSize: 14 },
  charCount: { color: '#94a3b8', fontSize: 12, alignSelf: 'flex-end', marginTop: 4 },
  editButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  footerActions: { gap: 12, paddingHorizontal: 20, marginTop: 24 },
  actionButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  cancelButton: { backgroundColor: '#000000', borderColor: 'rgba(148, 163, 184, 0.35)' },
  saveButton: { backgroundColor: '#6d28d9', borderColor: '#6d28d9', paddingVertical: 0 },
  disabledButton: { opacity: 0.5 },
  actionLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cancelLabel: { color: '#cbd5f5' },
  errorText: { color: '#fca5a5', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  saveGradient: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  savingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  savingLabel: { marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '90%', maxWidth: 420, backgroundColor: '#000000', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: { color: '#ffffff', backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  modalCancel: { backgroundColor: '#000000', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalSave: { backgroundColor: '#6d28d9' },
  modalBtnLabel: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  modalHelper: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
});

export default CompleteProfileScreen;

