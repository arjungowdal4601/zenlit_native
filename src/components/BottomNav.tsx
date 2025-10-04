import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, space } from '../theme';

interface BottomNavProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'radar',
  onTabPress,
}) => {
  const handleTabPress = (tab: string) => {
    if (onTabPress) {
      onTabPress(tab);
    }
  };

  const tabs = [
    { id: 'people', icon: 'account-group-outline' },
    { id: 'compass', icon: 'compass-outline' },
    { id: 'add', icon: 'plus' },
    { id: 'chat', icon: 'chat-outline' },
    { id: 'settings', icon: 'cog-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={styles.tabButton}
          onPress={() => handleTabPress(tab.id)}
        >
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? palette.accent : palette.subtext}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 15, 18, 0.95)',
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  tabButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
});

export default BottomNav;