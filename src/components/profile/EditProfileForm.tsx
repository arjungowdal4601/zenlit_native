import { Feather } from '../icons';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientTitle from '../GradientTitle';
import ImageUploadDialog from '../ImageUploadDialog';
import { SocialBrandBadge } from '../social-brand-badge';
import { SocialUsernameDialog } from '../social-username-dialog';
import type {
  EditProfileController,
  EditProfileSocialField,
} from '../../hooks/useEditProfile';
import type { ImageUploadTarget } from '../../types/stored-image';
import { ProfileImageEditor } from './ProfileImageEditor';
import { styles } from './editProfile.styles';

const socialItems: Array<{
  key: EditProfileSocialField;
  label: string;
}> = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X' },
  { key: 'linkedin', label: 'LinkedIn' },
];

const PROFILE_UPLOAD_TARGETS = {
  avatar: { bucket: 'profile-images', prefix: 'avatar' },
  banner: { bucket: 'profile-images', prefix: 'banner' },
} as const satisfies Record<'avatar' | 'banner', ImageUploadTarget>;

const Header = ({ onBack, disabled = false }: { onBack: () => void; disabled?: boolean }) => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        disabled={disabled}
        style={styles.headerButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityState={{ disabled }}
      >
        <Feather name="arrow-left" size={22} color="#ffffff" />
      </Pressable>
      <GradientTitle text="Edit Profile" style={styles.headerTitle} />
      <View style={{ width: 44 }} />
    </View>
  </SafeAreaView>
);

const SocialRow = ({
  item,
  value,
  onPress,
  disabled = false,
}: {
  item: (typeof socialItems)[number];
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  return (
    <View style={styles.socialCard}>
      <SocialBrandBadge platform={item.key} size={44} />
      <View style={styles.socialContent}>
        <Text style={styles.socialLabel}>{item.label}</Text>
        <Text style={styles.socialValue}>{value || 'No link added'}</Text>
      </View>
      <Pressable
        style={styles.editButton}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.label} username`}
        accessibilityState={{ disabled }}
      >
        <Feather name="edit-3" size={16} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export const EditProfileForm = ({ profile }: { profile: EditProfileController }) => {
  const { draft } = profile;
  const activeModal = socialItems.find((item) => item.key === profile.activeSocialModal);
  const bannerUri = (draft.bannerImage as { uri?: string } | null)?.uri;

  if (profile.loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Header onBack={profile.handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Header onBack={profile.handleBack} disabled={profile.isSaving} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileImageEditor
          bannerImage={draft.bannerImage}
          profileImage={draft.profileImage}
          onEditBanner={profile.openBannerMenu}
          onEditProfile={profile.openProfileMenu}
          disabled={profile.isSaving}
        />

        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Display Name</Text>
          <TextInput
            value={draft.displayName}
            onChangeText={(text) => profile.setDraftField('displayName', text.slice(0, 50))}
            placeholder="Your display name"
            placeholderTextColor="#475569"
            style={styles.input}
            maxLength={50}
            editable={!profile.isSaving}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Bio</Text>
          <TextInput
            value={draft.bio}
            onChangeText={(text) => profile.setDraftField('bio', text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor="#475569"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
            editable={!profile.isSaving}
          />
          <Text style={styles.charCount}>{draft.bio.length}/500</Text>
        </View>

        <View style={styles.socialSection}>
          <GradientTitle text="Social Links" style={styles.sectionTitle} />
          {socialItems.map((item) => (
            <SocialRow
              key={item.key}
              item={item}
              value={draft[item.key]}
              onPress={() => profile.openSocialModal(item.key)}
              disabled={profile.isSaving}
            />
          ))}
        </View>

        <View style={styles.footerActions}>
          <Pressable
            style={[styles.actionButton, styles.cancelButton, profile.isSaving && { opacity: 0.5 }]}
            onPress={profile.handleCancel}
            disabled={profile.isSaving}
            accessibilityRole="button"
            accessibilityState={{ disabled: profile.isSaving }}
          >
            <Text style={[styles.actionLabel, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.saveButton, profile.isSaving && { opacity: 0.5 }]}
            onPress={profile.handleSave}
            disabled={profile.isSaving}
            accessibilityRole="button"
          >
            <Text style={styles.actionLabel}>{profile.isSaving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {activeModal && !profile.isSaving ? (
        <SocialUsernameDialog
          visible
          platform={activeModal.key}
          value={draft[activeModal.key]}
          onSave={(value) => profile.setDraftField(activeModal.key, value)}
          onRequestClose={profile.closeSocialModal}
        />
      ) : null}

      <ImageUploadDialog
        visible={profile.showImageUploadDialog && !profile.isSaving}
        onClose={profile.closeImageUploadDialog}
        onImageUploaded={profile.handleImageUploaded}
        uploadTarget={PROFILE_UPLOAD_TARGETS[profile.uploadType]}
        title={profile.uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={profile.uploadType === 'avatar' ? draft.profileImage : bannerUri}
        onRemove={profile.handleImageRemove}
        showRemoveOption={true}
        imageKind={profile.uploadType === 'avatar' ? 'avatar' : 'banner'}
      />
    </View>
  );
};
