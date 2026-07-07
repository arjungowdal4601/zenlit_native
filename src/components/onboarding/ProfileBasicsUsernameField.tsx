import { Text, TextInput, View } from 'react-native';
import { Feather } from '../icons';

import UsernameSuggestions from '../UsernameSuggestions';
import { styles } from '../../styles/profileBasics.styles';
import { theme } from '../../styles/theme';
import { USERNAME_HELPER_TEXT } from '../../utils/profileValidation';

type ProfileBasicsUsernameFieldProps = {
  error: string;
  handleSuggestionSelect: (suggestion: string) => void;
  handleUsernameChange: (value: string) => void;
  isCheckingUsername: boolean;
  saveError: string;
  username: string;
  usernameAvailable: boolean | null;
  usernameSuggestions: string[];
};

export const ProfileBasicsUsernameField = ({
  error,
  handleSuggestionSelect,
  handleUsernameChange,
  isCheckingUsername,
  saveError,
  username,
  usernameAvailable,
  usernameSuggestions,
}: ProfileBasicsUsernameFieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>Username</Text>
    <View style={styles.usernameInputWrapper}>
      <TextInput
        value={username}
        onChangeText={handleUsernameChange}
        placeholder="username"
        placeholderTextColor={theme.prism.colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          usernameAvailable === true && !saveError && styles.inputSuccess,
          usernameAvailable === false && styles.inputError,
        ]}
      />
      {isCheckingUsername ? (
        <View style={styles.usernameStatusIcon}>
          <Feather name="loader" size={18} color={theme.prism.colors.accent} />
        </View>
      ) : null}
      {!isCheckingUsername && usernameAvailable === true && !saveError ? (
        <View style={styles.usernameStatusIcon}>
          <Feather name="check-circle" size={18} color={theme.prism.colors.success} />
        </View>
      ) : null}
      {!isCheckingUsername && usernameAvailable === false ? (
        <View style={styles.usernameStatusIcon}>
          <Feather name="x-circle" size={18} color={theme.prism.colors.danger} />
        </View>
      ) : null}
    </View>
    {!isCheckingUsername && usernameAvailable !== false ? (
      <Text style={styles.helperText}>{USERNAME_HELPER_TEXT}</Text>
    ) : null}
    {isCheckingUsername ? <Text style={styles.checkingText}>Checking availability...</Text> : null}
    {!isCheckingUsername && usernameAvailable === true && !saveError ? (
      <Text style={styles.successText}>Username is available!</Text>
    ) : null}
    {!isCheckingUsername && usernameAvailable === false ? (
      <Text style={styles.errorText}>That username is already taken. Try one of these:</Text>
    ) : null}
    {error && !isCheckingUsername && usernameAvailable !== false ? (
      <Text style={styles.errorText}>{error}</Text>
    ) : null}
    {!isCheckingUsername && usernameAvailable === false && usernameSuggestions.length > 0 ? (
      <UsernameSuggestions
        suggestions={usernameSuggestions}
        onSelectSuggestion={handleSuggestionSelect}
      />
    ) : null}
  </View>
);
