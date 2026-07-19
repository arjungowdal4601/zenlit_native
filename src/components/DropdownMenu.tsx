import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather, type IconName } from './icons';
import { theme } from '../styles/theme';
import { AppBottomSheet } from './ui/app-bottom-sheet';

export type DropdownItem = {
  label: string;
  destructive?: boolean;
  iconName?: IconName;
  onPress: () => void;
};

export type DropdownMenuProps = {
  visible: boolean;
  items: DropdownItem[];
  onClose: () => void;
  style?: ViewStyle;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, items, onClose, style }) => {
  return (
    <AppBottomSheet
      visible={visible}
      onRequestClose={onClose}
      title="Post options"
      accessibilityLabel="Post options"
    >
      <View style={[styles.actions, style]}>
        {items.map((item, idx) => (
          <Pressable
            key={`${item.label}-${idx}`}
            onPress={() => {
              onClose();
              item.onPress();
            }}
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            {item.iconName ? (
              <View style={[styles.iconWrap, item.destructive && styles.iconWrapDestructive]}>
                <Feather
                  name={item.iconName}
                  size={18}
                  color={item.destructive ? '#FCA5A5' : theme.prism.colors.textSoft}
                />
              </View>
            ) : null}
            <Text style={[styles.rowLabel, item.destructive ? styles.rowLabelDestructive : null]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(8, 13, 16, 0.68)',
  },
  rowPressed: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: theme.prism.colors.borderStrong,
  },
  rowLabel: {
    color: theme.prism.colors.textSoft,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 15,
    fontWeight: '600',
  },
  rowLabelDestructive: {
    color: '#fca5a5',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  iconWrapDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
});

export default DropdownMenu;
