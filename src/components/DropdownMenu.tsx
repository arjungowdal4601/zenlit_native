import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type DropdownItem = {
  label: string;
  destructive?: boolean;
  iconName?: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
};

export type DropdownMenuProps = {
  visible: boolean;
  items: DropdownItem[];
  onClose: () => void;
  style?: ViewStyle;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, items, onClose, style }) => {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, { pointerEvents: 'box-none' }]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.card, style]}>        
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
              <View style={styles.iconWrap}>
                <Feather name={item.iconName} size={18} color="#cbd5f5" />
              </View>
            ) : null}
            <Text style={[styles.rowLabel, item.destructive ? styles.rowLabelDestructive : null]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    position: 'absolute',
    top: 36,
    right: 0,
    minWidth: 160,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  row: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
  },
  rowLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  rowLabelDestructive: {
    color: '#fca5a5',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});

export default DropdownMenu;