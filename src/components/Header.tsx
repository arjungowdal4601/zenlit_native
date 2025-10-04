import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, space, type } from '../theme';

interface HeaderProps {
  title: string;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onSearchPress,
  onMenuPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.iconRow}>
        <Pressable
          style={styles.iconButton}
          onPress={onSearchPress}
        >
          <MaterialCommunityIcons 
            name="magnify" 
            size={24} 
            color={palette.text} 
          />
        </Pressable>
        
        <Pressable
          style={[styles.iconButton, styles.iconSpacing]}
          onPress={onMenuPress}
        >
          <MaterialCommunityIcons 
            name="menu" 
            size={24} 
            color={palette.text} 
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: palette.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.accent,
    letterSpacing: -0.5,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  iconSpacing: {
    marginLeft: space.xs,
  },
});

export default Header;