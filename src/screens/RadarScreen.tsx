import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Instagram, Linkedin, Search } from 'lucide-react-native';

import GradientText from '../components/GradientText';
import { COLORS } from '../theme/colors';
import { SOCIAL_ACCOUNTS, useVisibility } from '../context/VisibilityContext';

const COLLAPSE_DURATION = 300;
const CONTENT_MAX_WIDTH = 760;
const INSTAGRAM_GRADIENT = ['#F58529', '#FEDA77', '#DD2A7B', '#8134AF'] as const;
const LINKEDIN_BLUE = '#0A66C2';
const X_BACKGROUND = '#000000';

const RadarScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 820 ? 28 : 20;
  const contentPadding = width >= 820 ? 28 : 20;

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchExpanded ? 1 : 0,
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [searchExpanded, searchAnim]);

  useEffect(() => {
    Animated.timing(settingsAnim, {
      toValue: settingsExpanded ? 1 : 0,
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [settingsExpanded, settingsAnim]);

  const searchStyles = useMemo(() => {
    const maxHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 88] });
    const opacity = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return {
      maxHeight,
      opacity,
    };
  }, [searchAnim]);

  const settingsStyles = useMemo(() => {
    const maxHeight = settingsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 480] });
    const opacity = settingsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return {
      maxHeight,
      opacity,
    };
  }, [settingsAnim]);

  const renderAccountIcon = useCallback((accountId: string) => {
    switch (accountId) {
      case 'instagram':
        return (
          <LinearGradient
            colors={INSTAGRAM_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountIcon}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Rect x={3.5} y={3.5} width={17} height={17} rx={5} stroke="#FFFFFF" strokeWidth={2} fill="none" />
              <Circle cx={12} cy={12} r={4} stroke="#FFFFFF" strokeWidth={2} fill="none" />
              <Circle cx={17.5} cy={6.5} r={1.2} fill="#FFFFFF" />
            </Svg>
          </LinearGradient>
        );
      case 'linkedin':
        return (
          <View style={[styles.accountIcon, styles.linkedinIcon]}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M5.35 3A2.35 2.35 0 1 1 3 5.35 2.35 2.35 0 0 1 5.35 3ZM3.18 9.32h4.34v11.5H3.18Zm7 0h4.15v1.58h.06c.58-1.07 2-2.2 4.12-2.2 4.4 0 5.21 2.9 5.21 6.68v5.44h-4.5v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.84 1.25-1.84 2.54v4.92h-4.5Z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        );
      case 'x':
        return (
          <View style={[styles.accountIcon, styles.xIcon]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M16.96 3H20l-6.96 8.2L20.56 21h-3.18l-4.95-6.63L6.43 21H3.2l7.78-9.17L3 3h3.22l4.53 6.08L16.96 3Z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        );
      default:
        return <View style={styles.accountIcon} />;
    }
  }, []);

  const handleToggleSearch = useCallback(() => {
    setSearchExpanded((prev) => !prev);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setSettingsExpanded((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>        
        <View style={[styles.contentWrapper, { paddingHorizontal: contentPadding }]}>          
          <RadarHeader
            onToggleSearch={handleToggleSearch}
            onToggleSettings={handleToggleSettings}
            searchActive={searchExpanded}
            settingsActive={settingsExpanded}
          />

          <View style={styles.divider} />

          <Animated.View style={[styles.searchPanel, searchStyles, { marginTop: 18 }]}>
            <View style={styles.searchInner}>
              <TextInput
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>
          </Animated.View>

          <Animated.View style={[styles.settingsPanelWrapper, settingsStyles]}>
            <VisibilityPanel renderAccountIcon={renderAccountIcon} />
          </Animated.View>

          <View style={styles.placeholderMessageContainer}>
            <Text style={styles.placeholderMessage}>Turn on visibility to see nearby users</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const RadarHeader: React.FC<{
  onToggleSearch: () => void;
  onToggleSettings: () => void;
  searchActive: boolean;
  settingsActive: boolean;
}> = ({ onToggleSearch, onToggleSettings, searchActive, settingsActive }) => (
  <View style={styles.headerContainer}>
    <GradientText textStyle={styles.headerTitle}>Radar</GradientText>
    <View style={styles.headerActions}>
      <IconToggleButton icon={Search} active={searchActive} onPress={onToggleSearch} />
      <HamburgerToggle active={settingsActive} onPress={onToggleSettings} />
    </View>
  </View>
);

const IconToggleButton: React.FC<{
  icon: typeof Search;
  active: boolean;
  onPress: () => void;
}> = ({ icon: Icon, active, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Toggle search"
    onPress={onPress}
    style={({ pressed }) => [
      styles.iconPressable,
      (pressed || active) && styles.iconPressableActive,
    ]}
  >
    <Icon color="#FFFFFF" size={24} />
  </Pressable>
);

const HamburgerToggle: React.FC<{ active: boolean; onPress: () => void }> = ({ active, onPress }) => {
  const animation = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: active ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [active, animation]);

  const line1Transform = {
    transform: [
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
      { rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
    ],
  };

  const line2Opacity = animation.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const line3Transform = {
    transform: [
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
      { rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] }) },
    ],
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle visibility settings"
      onPress={onPress}
      style={({ pressed }) => [styles.iconPressable, pressed && styles.iconPressableActive]}
    >
      <View style={styles.hamburgerContainer}>
        <Animated.View style={[styles.hamburgerLine, line1Transform]} />
        <Animated.View style={[styles.hamburgerLine, { opacity: line2Opacity }]} />
        <Animated.View style={[styles.hamburgerLine, line3Transform]} />
      </View>
    </Pressable>
  );
};

type VisibilityPanelProps = {
  renderAccountIcon: (accountId: string) => React.ReactNode;
};

const VisibilityPanel: React.FC<VisibilityPanelProps> = ({ renderAccountIcon }) => {
  const { isVisible, selectedAccounts, toggleVisibility, selectAll, deselectAll, toggleAccount } =
    useVisibility();

  const visibilityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isVisible, visibilityAnim]);

  const knobTranslate = visibilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const trackBackground = visibilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(39,39,42,1)', 'rgba(45,212,191,0.55)'],
  });

  const allSelected = selectedAccounts.length === SOCIAL_ACCOUNTS.length;
  const noneSelected = selectedAccounts.length === 0;

  return (
    <View style={styles.visibilityCard}>
      <View style={styles.visibilityHeaderRow}>
        <Text style={styles.visibilityLabel}>Visibility</Text>
        <TouchableOpacity onPress={toggleVisibility} activeOpacity={0.7}>
          <Animated.View style={[styles.visibilityTrack, { backgroundColor: trackBackground }]}>
            <Animated.View style={[styles.visibilityKnob, { transform: [{ translateX: knobTranslate }] }]} />
          </Animated.View>
        </TouchableOpacity>
        <View style={styles.visibilityActions}>
          <Pressable
            onPress={selectAll}
            disabled={allSelected}
            style={({ pressed }) => [styles.visibilityAction, pressed && styles.visibilityActionPressed]}
          >
            <Text style={[styles.visibilityActionText, allSelected && styles.visibilityActionDisabled]}>Select All</Text>
          </Pressable>
          <Text style={styles.visibilityActionSeparator}>|</Text>
          <Pressable
            onPress={deselectAll}
            disabled={noneSelected}
            style={({ pressed }) => [styles.visibilityAction, pressed && styles.visibilityActionPressed]}
          >
            <Text style={[styles.visibilityActionTextDanger, noneSelected && styles.visibilityActionDisabled]}>
              Deselect All
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Social Account Visibility</Text>

      <View style={styles.accountsList}>
        {SOCIAL_ACCOUNTS.map((account, index) => {
          const selected = selectedAccounts.includes(account.id);

          return (
            <Pressable
              key={account.id}
              onPress={() => toggleAccount(account.id)}
              style={({ pressed }) => [
                styles.accountCard,
                index === 0 ? styles.accountCardFirst : styles.accountCardSpacer,
                selected && styles.accountCardSelected,
                pressed && styles.accountCardPressed,
              ]}
            >
              {renderAccountIcon(account.id)}
              <Text style={styles.accountLabel}>{account.label}</Text>
              <View
                style={[
                  styles.accountIndicator,
                  selected ? styles.accountIndicatorSelected : styles.accountIndicatorIdle,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingVertical: 28,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    textAlign: 'left',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPressable: {
    padding: 8,
    borderRadius: 16,
  },
  iconPressableActive: {
    opacity: 0.6,
  },
  hamburgerContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
  },
  hamburgerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginTop: 12,
  },
  searchPanel: {
    width: '100%',
    overflow: 'hidden',
  },
  searchInner: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsPanelWrapper: {
    width: '100%',
    overflow: 'hidden',
    marginTop: 20,
  },
  visibilityCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#050505',
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 18px 32px rgba(0,0,0,0.55)' }
      : {
          shadowColor: 'rgba(0,0,0,0.85)',
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
        }),
  },
  visibilityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  visibilityTrack: {
    width: 52,
    height: 28,
    borderRadius: 9999,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  visibilityKnob: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }
      : {
          shadowColor: 'rgba(0,0,0,0.45)',
          shadowOpacity: 0.35,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }),
  },
  visibilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visibilityAction: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  visibilityActionPressed: {
    opacity: 0.7,
  },
  visibilityActionText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  visibilityActionTextDanger: {
    color: '#F87272',
    fontSize: 14,
    fontWeight: '600',
  },
  visibilityActionDisabled: {
    color: '#6B7280',
  },
  visibilityActionSeparator: {
    color: '#6B7280',
  },
  sectionSubtitle: {
    marginTop: 16,
    marginBottom: 12,
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  accountsList: {
    width: '100%',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#060709',
    minHeight: 64,
    justifyContent: 'flex-start',
  },
  accountCardFirst: {
    marginTop: 0,
  },
  accountCardSpacer: {
    marginTop: 12,
  },
  accountCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#0B1221',
  },
  accountCardPressed: {
    opacity: 0.9,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinIcon: {
    backgroundColor: LINKEDIN_BLUE,
  },
  xIcon: {
    backgroundColor: X_BACKGROUND,
  },
  accountLabel: {
    flex: 1,
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  accountIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  accountIndicatorIdle: {
    borderColor: '#3B82F6',
    backgroundColor: 'transparent',
  },
  accountIndicatorSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  placeholderMessageContainer: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMessage: {
    color: COLORS.radarMessage,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default RadarScreen;
