import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UsernameSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (username: string) => void;
}

const UsernameSuggestions: React.FC<UsernameSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggestions:</Text>
      <View style={styles.suggestionsGrid}>
        {suggestions.map((suggestion, index) => (
          <Pressable
            key={`${suggestion}-${index}`}
            onPress={() => onSelectSuggestion(suggestion)}
            style={({ pressed }) => [
              styles.suggestionItem,
              pressed && styles.suggestionItemPressed,
            ]}
          >
            <LinearGradient
              colors={['rgba(37, 99, 235, 0.15)', 'rgba(126, 34, 206, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestionGradient}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionItem: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  suggestionItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  suggestionGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#60a5fa',
  },
});

export default UsernameSuggestions;
