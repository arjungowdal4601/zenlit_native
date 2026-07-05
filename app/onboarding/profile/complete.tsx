import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ImageUploadDialog from '../../../src/components/ImageUploadDialog';
import GradientTitle from '../../../src/components/GradientTitle';
import { SocialLinksEditor } from './SocialLinksEditor';
import { styles } from './complete.styles';
import { useCompleteProfileOnboarding } from './useCompleteProfileOnboarding';

const CompleteProfileScreen: React.FC = () => {
  const profile = useCompleteProfileOnboarding();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile basics"
            onPress={profile.handleBack}
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.stepIndicator}>Step 2 of 2</Text>
            <GradientTitle text="Complete your profile" style={styles.headerTitle} />
            <Text style={styles.headerHelper}>
              Add the details that make your browser profile feel alive - or skip for now.
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {profile.showSuccess ? (
        <View style={styles.successBar}>
          <Feather name="check" size={18} color="#ffffff" />
          <Text style={styles.successText}>{profile.successMessage}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerWrapper}>
          {profile.bannerImage ? (
            <Image source={{ uri: profile.bannerImage.uri }} style={styles.bannerImage} resizeMode="cover" />
          ) : profile.bannerImageUrl ? (
            <Image source={{ uri: profile.bannerImageUrl }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerFallback]} />
          )}
          <Pressable style={styles.bannerOverlay} onPress={profile.openBannerMenu}>
            <View style={styles.overlayCircle}>
              <Feather name="camera" size={18} color="#ffffff" />
            </View>
          </Pressable>
          <View style={styles.avatarWrapper}>
            <Pressable onPress={profile.openProfileMenu} style={styles.avatarButton}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage.uri }} style={styles.avatar} />
              ) : profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
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

        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Bio</Text>
          <TextInput
            value={profile.bio}
            onChangeText={(text) => profile.setBio(text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor="#475569"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{profile.bio.length}/500</Text>
        </View>

        <SocialLinksEditor
          instagram={profile.instagram}
          linkedin={profile.linkedin}
          setInstagram={profile.setInstagram}
          setLinkedin={profile.setLinkedin}
          setTwitter={profile.setTwitter}
          twitter={profile.twitter}
        />

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
              (!profile.authReady || profile.isSaving) && { opacity: 0.5 },
            ]}
            onPress={profile.handleSave}
            disabled={!profile.authReady || profile.isSaving}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#2563eb', '#7e22ce']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {profile.isSaving ? (
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

      <ImageUploadDialog
        visible={profile.showImageUploadDialog}
        onClose={() => profile.setShowImageUploadDialog(false)}
        onImageSelected={profile.handleImageSelected}
        title={profile.uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={
          profile.uploadType === 'avatar'
            ? profile.profileImage?.uri ?? profile.profileImageUrl
            : profile.bannerImage?.uri ?? profile.bannerImageUrl
        }
        onRemove={profile.handleRemoveImage}
        showRemoveOption={true}
      />
    </View>
  );
};

export default CompleteProfileScreen;
