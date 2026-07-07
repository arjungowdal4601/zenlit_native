import type { CSSProperties, RefObject } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '../icons';

import { styles } from '../../styles/profileBasics.styles';
import { theme } from '../../styles/theme';

const WEB_DATE_INPUT_OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  borderRadius: 16,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
};

type ProfileBasicsDobFieldProps = {
  dob: string;
  error: string;
  handleDobWebChange: (value: string) => void;
  isWebDateFocused: boolean;
  maxDobInputValue: string;
  openDobPicker: () => void;
  setIsWebDateFocused: (value: boolean) => void;
  webDateInputRef: RefObject<HTMLInputElement | null>;
};

export const ProfileBasicsDobField = ({
  dob,
  error,
  handleDobWebChange,
  isWebDateFocused,
  maxDobInputValue,
  openDobPicker,
  setIsWebDateFocused,
  webDateInputRef,
}: ProfileBasicsDobFieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>Date of Birth</Text>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Select date of birth"
      onPress={openDobPicker}
      style={({ pressed }) => [
        styles.pickerField,
        isWebDateFocused ? styles.pickerFieldFocused : null,
        pressed ? styles.pickerFieldPressed : null,
      ]}
    >
      <View style={styles.pickerRow}>
        <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
          {dob || 'YYYY-MM-DD'}
        </Text>
        <Feather name="calendar" size={24} color={theme.prism.colors.text} style={styles.pickerIcon} />
      </View>
      <input
        ref={webDateInputRef}
        type="date"
        value={dob}
        onChange={(event) => handleDobWebChange(event.target.value)}
        max={maxDobInputValue}
        style={WEB_DATE_INPUT_OVERLAY_STYLE}
        onFocus={() => setIsWebDateFocused(true)}
        onBlur={() => setIsWebDateFocused(false)}
        aria-label="Date of Birth"
      />
    </Pressable>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);
