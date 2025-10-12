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
      <View style={styles.suggestionsGrid}>
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <Pressable
            key={`${suggestion}-${index}`}
            onPress={() => onSelectSuggestion(suggestion)}
            style={({ pressed }) => [
              styles.suggestionItem,
              pressed && styles.suggestionItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Use username ${suggestion}`}
          >
            <LinearGradient
              colors={['rgba(37, 99, 235, 0.2)', 'rgba(126, 34, 206, 0.2)']}
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
    marginTop: 10,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionItem: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  suggestionItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  suggestionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
});

export default UsernameSuggestions;
