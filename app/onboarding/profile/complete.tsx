import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TITLE_GRADIENT = ['#2563eb', '#4f46e5', '#7e22ce'] as const;
const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80';
const BANNER_PLACEHOLDER = 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1200&q=80';

const socials = [
  { id: 'instagram', label: 'Instagram', placeholder: '@username' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Profile URL' },
  { id: 'x', label: 'X (Twitter)', placeholder: '@handle' },
] as const;

type GradientTextProps = {
  children: string;
};

const GradientText: React.FC<GradientTextProps> = ({ children }) => {
  return (
    <MaskedView maskElement={<Text style={[styles.brandTitle, styles.brandMask]}>{children}</Text>}>
      <LinearGradient colors={TITLE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={[styles.brandTitle, styles.brandTransparent]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const CompleteProfileScreen: React.FC = () => {
  const router = useRouter();
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [xHandle, setXHandle] = useState('');

  const socialState = useMemo(() => ({ instagram, linkedin, x: xHandle }), [instagram, linkedin, xHandle]);

  const handleComplete = () => {
    console.log('Complete profile', {
      avatar: avatar || AVATAR_PLACEHOLDER,
      banner: banner || BANNER_PLACEHOLDER,
      bio,
      socials: socialState,
    });
    router.replace('/feed');
  };

  const handleSkip = () => {
    console.log('Skip profile setup');
    router.replace('/feed');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <GradientText>Zenlit</GradientText>
            <Text style={styles.brandSubtitle}>Complete your profile</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.screenTitle}>Make it yours</Text>
            <Text style={styles.screenSubtitle}>Add a face, a vibe, and how people can reach you.</Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Avatar</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  console.log('Change avatar');
                  setAvatar(avatar ? '' : AVATAR_PLACEHOLDER);
                }}
                style={styles.avatarButton}
              >
                <Image
                  source={{ uri: avatar || AVATAR_PLACEHOLDER }}
                  style={styles.avatarImage}
                />
                <View style={styles.cameraBadge}>
                  <Feather name="camera" size={16} color="#ffffff" />
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Banner</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  console.log('Change banner');
                  setBanner(banner ? '' : BANNER_PLACEHOLDER);
                }}
                style={styles.bannerButton}
              >
                <Image
                  source={{ uri: banner || BANNER_PLACEHOLDER }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Feather name="image" size={18} color="#ffffff" />
                  <Text style={styles.bannerOverlayText}>Upload banner</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Share something about you..."
                placeholderTextColor="rgba(148, 163, 184, 0.65)"
                multiline
                numberOfLines={4}
                style={styles.bioInput}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Socials</Text>
              <Text style={styles.helperText}>Let people discover more of your work.</Text>
              {socials.map((entry) => {
                const value = entry.id === 'instagram' ? instagram : entry.id === 'linkedin' ? linkedin : xHandle;
                const setter = entry.id === 'instagram' ? setInstagram : entry.id === 'linkedin' ? setLinkedin : setXHandle;
                return (
                  <View key={entry.id} style={styles.socialField}>
                    <Text style={styles.socialLabel}>{entry.label}</Text>
                    <TextInput
                      value={value}
                      onChangeText={setter}
                      placeholder={entry.placeholder}
                      placeholderTextColor="rgba(148, 163, 184, 0.65)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.socialInput}
                    />
                  </View>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleComplete}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null]}
            >
              <LinearGradient
                colors={PRIMARY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>Complete Profile</Text>
              </LinearGradient>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipLabel}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  brandMask: {
    color: '#ffffff',
  },
  brandTransparent: {
    color: 'transparent',
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#94a3b8',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 22,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  screenSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginTop: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5f5',
    marginBottom: 12,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  bannerButton: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerOverlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bioInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 112,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  socialField: {
    marginTop: 18,
  },
  socialLabel: {
    fontSize: 13,
    color: '#cbd5f5',
    marginBottom: 8,
    fontWeight: '600',
  },
  socialInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    marginTop: 32,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default CompleteProfileScreen;
