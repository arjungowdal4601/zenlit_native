import React, { useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type SearchDropdownItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type SearchDropdownProps = {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  items: SearchDropdownItem[];
  onSelect: (item: SearchDropdownItem) => void;
};

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  visible,
  value,
  onChangeText,
  onClose,
  items,
  onSelect,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.dropdown, { opacity }]}> 
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Search people"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoFocus
          />
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close search">
            <Feather name="x" size={20} color="#ffffff" />
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => onSelect(item)}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>Try a different name or handle.</Text>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    top: 110,
    left: 24,
    right: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    color: '#ffffff',
    fontSize: 16,
  },
  closeButton: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  item: {
    paddingVertical: 12,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    marginTop: 2,
    color: '#cbd5f5',
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 13,
  },
});

export default SearchDropdown;
