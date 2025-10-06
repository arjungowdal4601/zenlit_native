import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type OptionsDialogItem = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

export type OptionsDialogProps = {
  visible: boolean;
  items: OptionsDialogItem[];
  onClose: () => void;
  title?: string;
};

const OptionsDialog: React.FC<OptionsDialogProps> = ({ visible, items, onClose, title }) => {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {items.map((item, idx) => (
            <Pressable
              key={`${item.label}-${idx}`}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.row,
                item.destructive ? styles.rowDestructive : null,
                pressed ? styles.rowPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text
                style={[styles.rowLabel, item.destructive ? styles.rowLabelDestructive : null]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 24,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  title: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.22)',
    marginBottom: 6,
  },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  rowDestructive: {},
  rowLabel: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  rowLabelDestructive: {
    color: '#fca5a5',
  },
});

export default OptionsDialog;